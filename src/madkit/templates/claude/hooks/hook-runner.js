#!/usr/bin/env node
// Hook Runner — ejecuta N hooks in-process en un único spawn de Node.
//
// Background: invocar 4 hooks separados en PreToolUse:Write|Edit cuesta
// 4× el cold-start de Node (~4×60ms = 240ms latencia + 4 escaneos AV
// concurrentes en Windows). Bundlearlos en un único proceso reduce a
// ~80ms y elimina el spike p95 causado por Windows Defender escaneando
// cada `node.exe` spawn.
//
// Uso (desde settings.json wiring):
//   {"command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/hook-runner.js\" prompt-guard task-doc-validator sprint-sync sprint-doc-validator"}
//
// Argumentos: nombres de hooks (sin extensión .js). Cada hook debe vivir en
// el mismo directorio que este archivo y exportar `runHook(input)` que
// retorna {exitCode, stdoutJson?, stderr?}.
//
// Política de agregación:
//   - exitCode = max(exit codes individuales). Si alguno = 2 (block), gana.
//   - decision='block' del primer hook que la emite gana (resto se descarta).
//   - additionalContext concatenado con separador "\n---\n" cuando hay varios.
//   - stderr concatenado en orden de ejecución.
//   - Si un hook lanza excepción, se loguea a stderr y se sigue (no rompe flujo).
//
// Backwards-compat: cada hook sigue siendo invocable como script standalone
// (modo legacy preservado). hook-runner es opt-in via settings.json wiring.

const fs = require('fs');
const path = require('path');

const HOOKS_DIR = __dirname;
const STDIN_TIMEOUT_MS = 15000; // suma de los timeouts máximos individuales

// Pre-flight: skip require() para hooks deshabilitados en config.json.
// Lee config.json UNA sola vez por invocación; pasa el objeto a cada hook
// para evitar 4 reads independientes del mismo archivo.
const HOOK_ENABLED_FN = {
  'prompt-guard':         cfg => !!(cfg && cfg.prompt_guard && cfg.prompt_guard.mode),
  'task-doc-validator':   cfg => !!(cfg && cfg.task_doc_validator === true),
  'sprint-sync':          cfg => !!(cfg && cfg.sprint_sync && cfg.sprint_sync.mode),
  'sprint-doc-validator': cfg => {
    const v = cfg && cfg.sprint_doc_validator;
    return v === true || !!(v && typeof v === 'object' && v.enabled !== false);
  },
  'scaffolding-guard':    cfg => {
    const v = cfg && cfg.scaffolding_guard;
    return v === true || !!(v && typeof v === 'object' && v.enabled !== false);
  },
};

function readConfig(cwd) {
  try {
    return JSON.parse(fs.readFileSync(path.join(cwd, '.claude', 'hooks', 'config.json'), 'utf8'));
  } catch {
    return null;
  }
}

async function readStdin() {
  return new Promise((resolve) => {
    let raw = '';
    const timer = setTimeout(() => resolve(raw), STDIN_TIMEOUT_MS);
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => (raw += c));
    process.stdin.on('end', () => { clearTimeout(timer); resolve(raw); });
  });
}

function loadHook(name) {
  // Validación: solo nombres seguros (sin path traversal). Letras, dígitos, guiones.
  if (!/^[a-z0-9][a-z0-9-]*$/i.test(name)) {
    throw new Error(`hook name inválido: ${name}`);
  }
  const hookPath = path.join(HOOKS_DIR, `${name}.js`);
  // require() cachea — bien para reutilización si hook-runner se reusase
  const mod = require(hookPath);
  const fn = typeof mod === 'function' ? mod : (mod.runHook || mod.default);
  if (typeof fn !== 'function') {
    throw new Error(`hook ${name} no exporta runHook`);
  }
  return fn;
}

async function main() {
  const hookNames = process.argv.slice(2).filter((s) => s && !s.startsWith('-'));
  if (hookNames.length === 0) process.exit(0);

  const raw = await readStdin();
  let input = {};
  if (raw.trim()) {
    try { input = JSON.parse(raw); } catch { process.exit(0); return; }
  }

  // Leer config.json UNA vez; filtrar hooks deshabilitados sin hacer require()
  const cwd = (input && input.cwd) || process.cwd();
  const config = readConfig(cwd);
  const activeHooks = hookNames.filter(n => {
    const check = HOOK_ENABLED_FN[n];
    return !check || check(config); // hook desconocido: incluir por seguridad
  });
  if (activeHooks.length === 0) process.exit(0);

  let aggregateExit = 0;
  const stderrParts = [];
  const additionalContexts = [];
  let blockJson = null; // { decision, code, reason } del primer hook que bloquea
  let firstEventName = null; // PreToolUse | PostToolUse — tomado del primer hook que lo emita

  for (const name of activeHooks) {
    let fn;
    try {
      fn = loadHook(name);
    } catch (e) {
      stderrParts.push(`[hook-runner] no se pudo cargar ${name}: ${e.message}\n`);
      continue;
    }

    let result;
    try {
      result = await fn(input, config); // config pre-cargado evita 4 reads redundantes
    } catch (e) {
      stderrParts.push(`[hook-runner: ${name}] excepción durante ejecución: ${e.message}\n`);
      continue;
    }
    if (!result || typeof result !== 'object') continue;

    if (result.stderr) stderrParts.push(String(result.stderr));
    if (typeof result.exitCode === 'number' && result.exitCode > aggregateExit) {
      aggregateExit = result.exitCode;
    }

    const out = result.stdoutJson;
    if (out && typeof out === 'object') {
      // Block decision wins (primer hook que bloquea)
      if (out.decision === 'block' && !blockJson) {
        blockJson = out;
      }
      // Capturar el hookEventName del primer hook que lo emita.
      if (!firstEventName && out.hookSpecificOutput && out.hookSpecificOutput.hookEventName) {
        firstEventName = out.hookSpecificOutput.hookEventName;
      }
      const ac = out.hookSpecificOutput && out.hookSpecificOutput.additionalContext;
      if (ac) additionalContexts.push(String(ac));
    }
  }

  if (stderrParts.length) process.stderr.write(stderrParts.join(''));

  // Emit final JSON: block wins; sino additionalContext agregado.
  if (blockJson) {
    process.stdout.write(JSON.stringify(blockJson));
  } else if (additionalContexts.length) {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: firstEventName || 'PreToolUse',
        additionalContext: additionalContexts.join('\n---\n'),
      },
    }));
  }

  process.exit(aggregateExit);
}

main().catch((e) => {
  process.stderr.write(`[hook-runner] fallo fatal: ${e && e.message ? e.message : e}\n`);
  // Nunca rompemos el flujo del agente — exit 0 (silent fail).
  process.exit(0);
});
