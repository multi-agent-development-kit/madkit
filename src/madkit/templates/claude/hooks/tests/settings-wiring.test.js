// Tests para auto-wiring de hooks nuevos en .claude/settings.json (T146 M15).
//
// Background: sync_templates.{sh,ps1} Paso 1.7 (T144) migra paths legacy pero
// NO añade hooks nuevos a settings.json cuando upstream los introduce. Este
// gap deja hooks "instalados + activos en config.json" pero invisibles a
// Claude Code (sin matcher en settings.json → nunca se invocan).
//
// Cubre 3 ejes:
//   A) Tabla canónica hook→matcher coherente con setup_project.md Fase 1.6.
//   B) Lógica de merge JS (SSOT de comportamiento; scripts sh/ps1 la replican).
//   C) Casos límite documentados en T146 §4 (idempotencia, hook desconocido,
//      settings.json ausente, preservación de orden).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { hooksDir } from './helper.js';

const REPO_ROOT = new URL('../../..', import.meta.url).pathname
  .replace(/^\/(\w):\//, '$1:/');
const SETUP_PROJECT_MD = join(REPO_ROOT, 'claude-templates', 'commands', 'setup_project.md');

// ─── Tabla canónica hook→matcher (SSOT — replicada en scripts) ─────────────
// IMPORTANTE: cualquier cambio aquí debe replicarse en:
//   - scripts/sync_templates.sh Paso 1.8
//   - scripts/sync_templates.ps1 Paso 1.8
//   - claude-templates/commands/setup_project.md Fase 1.6
// El test A1 valida coherencia cross-file.
export const HOOK_MATCHER_TABLE = {
  'prompt-guard.js':           { event: 'PreToolUse',   matcher: 'Write|Edit', runtime: 'node' },
  'task-doc-validator.js':     { event: 'PreToolUse',   matcher: 'Write|Edit', runtime: 'node' },
  'sprint-sync.js':            { event: 'PreToolUse',   matcher: 'Write|Edit', runtime: 'node' },
  'sprint-doc-validator.js':   { event: 'PreToolUse',   matcher: 'Write|Edit', runtime: 'node' },
  'scaffolding-guard.sh':      { event: 'PreToolUse',   matcher: 'Bash|PowerShell', runtime: 'bash' },
  'scaffolding-guard.ps1':     { event: 'PreToolUse',   matcher: 'Bash|PowerShell', runtime: 'pwsh' },
  'scaffolding-guard.js':      { event: 'PreToolUse',   matcher: 'Bash|PowerShell', runtime: 'node' },
  'context-monitor.js':        { event: 'PostToolUse',  matcher: '*',          runtime: 'node' },
  'read-injection-scanner.js': { event: 'PostToolUse',  matcher: 'Read',       runtime: 'node' },
  'session-state.sh':          { event: 'SessionStart', matcher: null,         runtime: 'bash' },
  'session-state.ps1':         { event: 'SessionStart', matcher: null,         runtime: 'pwsh' },
  'core-context-loader.sh':    { event: 'SessionStart', matcher: null,         runtime: 'bash' },
  'core-context-loader.ps1':   { event: 'SessionStart', matcher: null,         runtime: 'pwsh' },
};

// Grupos de alias sh↔ps1/js. Si cualquier variante del grupo está wired o ya añadida
// en este pass, las demás se saltan silenciosamente (sin WARN).
// IMPORTANTE: replicar en scripts/sync_templates.{sh,ps1} Paso 1.8.
export const ALIAS_MAP = {
  'session-state.sh':        'session-state',
  'session-state.ps1':       'session-state',
  'core-context-loader.sh':  'core-context-loader',
  'core-context-loader.ps1': 'core-context-loader',
  'scaffolding-guard.sh':    'scaffolding-guard',
  'scaffolding-guard.ps1':   'scaffolding-guard',
  'scaffolding-guard.js':    'scaffolding-guard',
};

// ─── Lógica de merge (SSOT — scripts sh/ps1 la replican) ───────────────────
// Recibe settings.json como objeto, lista de hooks upstream (filenames) y la
// tabla canónica. Devuelve { settings, added: [...filenames], skipped: [...] }.
// Idempotente: hooks ya wireados (basename detectado en cualquier command) no
// se duplican. Hooks sin entry en tabla → skipped + WARN (no abortar).
export function wireNewHooks(settings, upstreamHookFiles, matcherTable = HOOK_MATCHER_TABLE, aliasMap = ALIAS_MAP) {
  const added = [];
  const skipped = [];

  const cloned = JSON.parse(JSON.stringify(settings || {}));
  cloned.hooks = cloned.hooks || {};

  // Extraer basenames ya wireados de cualquier event/array existente
  const wiredBasenames = new Set();
  for (const event of Object.keys(cloned.hooks)) {
    const arr = cloned.hooks[event];
    if (!Array.isArray(arr)) continue;
    for (const entry of arr) {
      const hooks = entry.hooks || [];
      for (const h of hooks) {
        const cmd = h.command || '';
        // Detectar basename de .claude/hooks/<file> en el command
        const m = cmd.match(/\.claude[\/\\]hooks[\/\\]([^"'\s]+)/);
        if (m) wiredBasenames.add(m[1]);
      }
    }
  }

  const wiredGroups = new Set();
  for (const b of wiredBasenames) { if (aliasMap[b]) wiredGroups.add(aliasMap[b]); }
  const addedGroups = new Set();

  for (const hookFile of upstreamHookFiles) {
    const group = aliasMap[hookFile];
    if (group && (wiredGroups.has(group) || addedGroups.has(group))) continue;
    if (wiredBasenames.has(hookFile)) continue;
    const spec = matcherTable[hookFile];
    if (!spec) {
      skipped.push(hookFile);
      continue;
    }
    const ev = spec.event;
    const cmd = `${spec.runtime} "$CLAUDE_PROJECT_DIR/.claude/hooks/${hookFile}"`;
    const entry = {
      hooks: [{ type: 'command', command: cmd }],
    };
    if (spec.matcher !== null) entry.matcher = spec.matcher;
    cloned.hooks[ev] = cloned.hooks[ev] || [];
    // Insertar como objeto con matcher primero (orden visual canónico setup_project)
    if (spec.matcher !== null) {
      cloned.hooks[ev].push({ matcher: spec.matcher, hooks: entry.hooks });
    } else {
      cloned.hooks[ev].push({ hooks: entry.hooks });
    }
    added.push(hookFile);
    if (group) addedGroups.add(group);
  }

  return { settings: cloned, added, skipped };
}

// ─── Hooks bundleados en hook-runner.js (Write|Edit) ──────────────────────
// Comparten event=PreToolUse, matcher=Write|Edit, runtime=node. Se consolidan
// en 1 entry para evitar 4× cold-start Node + 4× escaneos AV concurrentes.
export const BUNDLED_HOOKS_WRITE_EDIT = [
  'prompt-guard.js',
  'task-doc-validator.js',
  'sprint-sync.js',
  'sprint-doc-validator.js',
];

export function bundledCommand(bundledHookFiles) {
  const names = bundledHookFiles.map(f => f.replace(/\.js$/, ''));
  return `node "$CLAUDE_PROJECT_DIR/.claude/hooks/hook-runner.js" ${names.join(' ')}`;
}

// Detecta entries individuales legacy y las consolida en 1 entry hook-runner.
// Idempotente: si ya hay hook-runner entry, no muta. Conservador: solo consolida
// si TODOS los bundled hooks están como entries individuales con el matcher esperado.
export function consolidateHookRunner(settings, bundledHookFiles = BUNDLED_HOOKS_WRITE_EDIT, matcher = 'Write|Edit', event = 'PreToolUse') {
  const cloned = JSON.parse(JSON.stringify(settings || {}));
  cloned.hooks = cloned.hooks || {};
  const arr = cloned.hooks[event] || [];

  const isLegacyEntry = (e) => {
    if (e.matcher !== matcher) return false;
    if (!Array.isArray(e.hooks) || e.hooks.length !== 1) return false;
    const cmd = e.hooks[0].command || '';
    return bundledHookFiles.some(f => cmd.includes(`/${f}`) || cmd.includes(`\\${f}`));
  };

  const hasRunner = arr.some(e =>
    e.matcher === matcher &&
    e.hooks && e.hooks[0] && /hook-runner\.js/.test(e.hooks[0].command || '')
  );

  const legacyEntries = arr.filter(isLegacyEntry);
  const foundFiles = new Set();
  for (const e of legacyEntries) {
    for (const f of bundledHookFiles) {
      if ((e.hooks[0].command || '').includes(f)) foundFiles.add(f);
    }
  }
  const allPresent = bundledHookFiles.every(f => foundFiles.has(f));

  if (hasRunner || !allPresent) {
    return { settings: cloned, consolidated: false, removed: 0 };
  }

  const newArr = arr.filter(e => !isLegacyEntry(e));
  newArr.push({
    matcher,
    hooks: [{ type: 'command', command: bundledCommand(bundledHookFiles) }],
  });
  cloned.hooks[event] = newArr;

  return { settings: cloned, consolidated: true, removed: legacyEntries.length };
}

// ─── A) Coherencia cross-file con setup_project.md Fase 1.6 ────────────────

test('A1 setup_project Fase 1.6 emite 1 entry hook-runner para Write|Edit + entries individuales para el resto', () => {
  const setup = readFileSync(SETUP_PROJECT_MD, 'utf8').replace(/\r\n/g, '\n');
  const fase16Match = setup.match(/NEW_HOOKS=\$\(cat <<'EOF'\n([\s\S]*?)\nEOF\n\)/);
  assert.ok(fase16Match, 'bloque NEW_HOOKS heredoc ausente en setup_project.md Fase 1.6');
  const fase16Json = JSON.parse(fase16Match[1]);

  // 1. PreToolUse Write|Edit debe tener UNA entry hook-runner con los 4 bundled
  const writeEditEntries = (fase16Json.PreToolUse || []).filter(e => e.matcher === 'Write|Edit');
  assert.equal(writeEditEntries.length, 1,
    `esperado 1 entry Write|Edit (hook-runner); encontrado ${writeEditEntries.length}`);
  const runnerCmd = writeEditEntries[0].hooks[0].command;
  assert.ok(/hook-runner\.js/.test(runnerCmd),
    `entry Write|Edit debe invocar hook-runner.js; got: ${runnerCmd}`);
  for (const f of BUNDLED_HOOKS_WRITE_EDIT) {
    const name = f.replace(/\.js$/, '');
    assert.ok(new RegExp(`\\b${name}\\b`).test(runnerCmd),
      `${name} debe aparecer como argv de hook-runner; cmd: ${runnerCmd}`);
  }

  // 2. Hooks individuales (no bundleados) — siguen como entries separadas.
  const expectedIndividual = [
    { event: 'PreToolUse',   matcher: 'Bash|PowerShell', file: 'scaffolding-guard.js' },
    { event: 'PostToolUse',  matcher: '*',    file: 'context-monitor.js' },
    { event: 'PostToolUse',  matcher: 'Read', file: 'read-injection-scanner.js' },
    { event: 'SessionStart', matcher: null,   file: 'session-state.sh' },
    { event: 'SessionStart', matcher: null,   file: 'core-context-loader.sh' },
  ];
  for (const exp of expectedIndividual) {
    const entries = (fase16Json[exp.event] || []).filter(e =>
      (exp.matcher ? e.matcher === exp.matcher : !e.matcher)
    );
    const found = entries.find(e =>
      e.hooks && e.hooks[0] && new RegExp(exp.file.replace('.', '\\.')).test(e.hooks[0].command || '')
    );
    assert.ok(found,
      `Hook canónico ausente en setup_project Fase 1.6 ${exp.event} matcher=${exp.matcher}: ${exp.file}`);
  }
});

// ─── D) consolidateHookRunner (migración legacy → bundle) ──────────────────

test('D1 consolidateHookRunner — 4 entries legacy individuales → 1 entry hook-runner', () => {
  const legacy = {
    hooks: {
      PreToolUse: [
        { matcher: 'Write|Edit', hooks: [{ type: 'command', command: 'node "$CLAUDE_PROJECT_DIR/.claude/hooks/prompt-guard.js"' }] },
        { matcher: 'Write|Edit', hooks: [{ type: 'command', command: 'node "$CLAUDE_PROJECT_DIR/.claude/hooks/task-doc-validator.js"' }] },
        { matcher: 'Write|Edit', hooks: [{ type: 'command', command: 'node "$CLAUDE_PROJECT_DIR/.claude/hooks/sprint-sync.js"' }] },
        { matcher: 'Write|Edit', hooks: [{ type: 'command', command: 'node "$CLAUDE_PROJECT_DIR/.claude/hooks/sprint-doc-validator.js"' }] },
        { matcher: 'Bash', hooks: [{ type: 'command', command: 'bash "$CLAUDE_PROJECT_DIR/.claude/hooks/scaffolding-guard.sh"' }] },
      ],
    },
  };
  const { settings: out, consolidated, removed } = consolidateHookRunner(legacy);
  assert.equal(consolidated, true);
  assert.equal(removed, 4);
  // 1 entry hook-runner Write|Edit + 1 entry Bash legacy preservado = 2 entries
  assert.equal(out.hooks.PreToolUse.length, 2);
  const runnerEntry = out.hooks.PreToolUse.find(e => /hook-runner/.test(e.hooks[0].command));
  assert.ok(runnerEntry);
  assert.equal(runnerEntry.matcher, 'Write|Edit');
  // Bash entry preservada
  const bashEntry = out.hooks.PreToolUse.find(e => e.matcher === 'Bash');
  assert.ok(bashEntry, 'entry Bash preservada');
});

test('D2 consolidateHookRunner es idempotente — ya consolidado no muta', () => {
  const consolidated = {
    hooks: {
      PreToolUse: [
        { matcher: 'Write|Edit', hooks: [{ type: 'command', command: bundledCommand(BUNDLED_HOOKS_WRITE_EDIT) }] },
      ],
    },
  };
  const r = consolidateHookRunner(consolidated);
  assert.equal(r.consolidated, false);
  assert.equal(r.removed, 0);
  assert.deepEqual(r.settings, consolidated);
});

test('D3 consolidateHookRunner — solo 3 de 4 bundled → NO consolida (conservador)', () => {
  const partial = {
    hooks: {
      PreToolUse: [
        { matcher: 'Write|Edit', hooks: [{ type: 'command', command: 'node "$CLAUDE_PROJECT_DIR/.claude/hooks/prompt-guard.js"' }] },
        { matcher: 'Write|Edit', hooks: [{ type: 'command', command: 'node "$CLAUDE_PROJECT_DIR/.claude/hooks/task-doc-validator.js"' }] },
        { matcher: 'Write|Edit', hooks: [{ type: 'command', command: 'node "$CLAUDE_PROJECT_DIR/.claude/hooks/sprint-sync.js"' }] },
        // sprint-doc-validator ausente
      ],
    },
  };
  const r = consolidateHookRunner(partial);
  assert.equal(r.consolidated, false, 'no consolida si falta alguno del grupo');
  assert.equal(r.removed, 0);
});

test('D4 consolidateHookRunner preserva hooks de matcher distinto', () => {
  const mixed = {
    hooks: {
      PreToolUse: [
        ...BUNDLED_HOOKS_WRITE_EDIT.map(f => ({
          matcher: 'Write|Edit',
          hooks: [{ type: 'command', command: `node "$CLAUDE_PROJECT_DIR/.claude/hooks/${f}"` }],
        })),
        // Hook custom del usuario con matcher distinto — NO debe tocarse
        { matcher: 'Read', hooks: [{ type: 'command', command: 'node my-custom-hook.js' }] },
      ],
    },
  };
  const { settings: out } = consolidateHookRunner(mixed);
  const readEntry = out.hooks.PreToolUse.find(e => e.matcher === 'Read');
  assert.ok(readEntry, 'hook custom Read preservado');
  assert.equal(readEntry.hooks[0].command, 'node my-custom-hook.js');
});

test('D5 consolidateHookRunner sobre settings vacío → no-op', () => {
  const empty = {};
  const r = consolidateHookRunner(empty);
  assert.equal(r.consolidated, false);
  assert.equal(r.removed, 0);
});

test('D6 consolidateHookRunner — hooks bundleados mezclados con hook custom Write|Edit del usuario', () => {
  // Usuario tiene los 4 bundled + 1 custom suyo con Write|Edit. Tras consolidar,
  // los 4 bundled van a hook-runner, el custom se preserva como entry separada.
  const mixed = {
    hooks: {
      PreToolUse: [
        ...BUNDLED_HOOKS_WRITE_EDIT.map(f => ({
          matcher: 'Write|Edit',
          hooks: [{ type: 'command', command: `node "$CLAUDE_PROJECT_DIR/.claude/hooks/${f}"` }],
        })),
        { matcher: 'Write|Edit', hooks: [{ type: 'command', command: 'node my-custom-hook.js' }] },
      ],
    },
  };
  const { settings: out, consolidated, removed } = consolidateHookRunner(mixed);
  assert.equal(consolidated, true);
  assert.equal(removed, 4, 'solo los 4 bundled son legacy');
  const entries = out.hooks.PreToolUse;
  assert.equal(entries.length, 2, '1 custom + 1 hook-runner');
  const customEntry = entries.find(e => /my-custom-hook/.test(e.hooks[0].command));
  assert.ok(customEntry, 'custom hook preservado');
});

// ─── B) Lógica de merge (B1-B6) ────────────────────────────────────────────

test('B1 wireNewHooks añade hook nuevo con matcher correcto', () => {
  const settings = {
    hooks: {
      PreToolUse: [
        { matcher: 'Write|Edit', hooks: [{ type: 'command', command: 'node "$CLAUDE_PROJECT_DIR/.claude/hooks/prompt-guard.js"' }] }
      ]
    }
  };
  const { settings: out, added } = wireNewHooks(settings, ['prompt-guard.js', 'task-doc-validator.js']);

  assert.deepEqual(added, ['task-doc-validator.js'], 'solo task-doc-validator es nuevo');
  // Verificar que el wiring de task-doc-validator quedó añadido al PreToolUse
  const preEntries = out.hooks.PreToolUse;
  const hookEntry = preEntries.find(e =>
    e.hooks[0].command.includes('task-doc-validator.js'));
  assert.ok(hookEntry, 'task-doc-validator añadido a PreToolUse');
  assert.equal(hookEntry.matcher, 'Write|Edit', 'matcher correcto');
  assert.ok(hookEntry.hooks[0].command.includes('$CLAUDE_PROJECT_DIR'), 'usa $CLAUDE_PROJECT_DIR');
});

test('B2 wireNewHooks es idempotente — hook ya wireado no se duplica', () => {
  const settings = {
    hooks: {
      PreToolUse: [
        { matcher: 'Write|Edit', hooks: [{ type: 'command', command: 'node "$CLAUDE_PROJECT_DIR/.claude/hooks/prompt-guard.js"' }] }
      ]
    }
  };
  const { settings: out, added } = wireNewHooks(settings, ['prompt-guard.js']);

  assert.deepEqual(added, [], 'no se añade nada — ya wireado');
  // El array PreToolUse debe quedar con exactamente 1 entrada (no duplicada)
  assert.equal(out.hooks.PreToolUse.length, 1, 'sin duplicados');
});

test('B3 wireNewHooks con settings sin hooks property → inicializa bloque', () => {
  const settings = { permissions: { allow: ['Bash(*)'] } };
  const { settings: out, added } = wireNewHooks(settings, ['prompt-guard.js']);

  assert.deepEqual(added, ['prompt-guard.js']);
  assert.ok(out.hooks, 'inicializa hooks');
  assert.ok(out.hooks.PreToolUse, 'inicializa PreToolUse array');
  assert.equal(out.hooks.PreToolUse.length, 1);
  assert.deepEqual(out.permissions, { allow: ['Bash(*)'] }, 'preserva permissions');
});

test('B4 wireNewHooks con hook desconocido en tabla → skipped, no aborta', () => {
  const settings = { hooks: {} };
  const { settings: out, added, skipped } = wireNewHooks(settings, ['unknown-hook.js']);

  assert.deepEqual(added, [], 'no se añade');
  assert.deepEqual(skipped, ['unknown-hook.js'], 'reportado como skipped');
  assert.deepEqual(out.hooks, {}, 'settings intacto');
});

test('B5 wireNewHooks preserva orden de hooks existentes (append-only)', () => {
  const settings = {
    hooks: {
      PreToolUse: [
        { matcher: 'Bash', hooks: [{ type: 'command', command: 'bash "$CLAUDE_PROJECT_DIR/.claude/hooks/scaffolding-guard.sh"' }] },
        { matcher: 'Write|Edit', hooks: [{ type: 'command', command: 'node "$CLAUDE_PROJECT_DIR/.claude/hooks/prompt-guard.js"' }] }
      ]
    }
  };
  const { settings: out, added } = wireNewHooks(settings, ['task-doc-validator.js']);

  assert.deepEqual(added, ['task-doc-validator.js']);
  // Los 2 hooks originales deben mantener su posición exacta (0, 1)
  assert.ok(out.hooks.PreToolUse[0].hooks[0].command.includes('scaffolding-guard'), 'hook[0] intacto');
  assert.ok(out.hooks.PreToolUse[1].hooks[0].command.includes('prompt-guard'), 'hook[1] intacto');
  // El nuevo se appendea al final (índice 2)
  assert.ok(out.hooks.PreToolUse[2].hooks[0].command.includes('task-doc-validator'), 'nuevo en pos 2');
});

test('B6 wireNewHooks añade SessionStart sin matcher (entry sin propiedad matcher)', () => {
  const settings = { hooks: {} };
  const { settings: out, added } = wireNewHooks(settings, ['core-context-loader.sh']);

  assert.deepEqual(added, ['core-context-loader.sh']);
  const entry = out.hooks.SessionStart[0];
  assert.ok(!('matcher' in entry), 'SessionStart entry NO debe tener matcher');
  assert.equal(entry.hooks[0].command,
    'bash "$CLAUDE_PROJECT_DIR/.claude/hooks/core-context-loader.sh"');
});

test('B7 wireNewHooks output JSON.parse-able tras stringify', () => {
  const settings = { hooks: {} };
  const { settings: out } = wireNewHooks(settings, ['prompt-guard.js', 'sprint-sync.js']);

  // Stringify-parse round-trip → validar que la estructura sigue siendo JSON-clean
  const txt = JSON.stringify(out, null, 2);
  assert.doesNotThrow(() => JSON.parse(txt), 'output debe ser JSON parseable');
});

test('B8 wireNewHooks múltiples hooks nuevos en distintos events en una pasada', () => {
  const settings = { hooks: {} };
  const { added } = wireNewHooks(settings,
    ['prompt-guard.js', 'context-monitor.js', 'session-state.sh']);

  assert.deepEqual(added.sort(),
    ['context-monitor.js', 'prompt-guard.js', 'session-state.sh']);
});

// ─── B9-B12: ALIAS_MAP — deduplicación sh↔ps1/js ───────────────────────────

test('B9 wireNewHooks — .sh wired → .ps1 del mismo grupo se salta silenciosamente', () => {
  const settings = {
    hooks: {
      SessionStart: [
        { hooks: [{ type: 'command', command: 'bash "$CLAUDE_PROJECT_DIR/.claude/hooks/session-state.sh"' }] },
      ],
    },
  };
  const { added, skipped } = wireNewHooks(settings, ['session-state.sh', 'session-state.ps1']);
  assert.deepEqual(added, [], '.sh ya wired y .ps1 alias — ninguno añadido');
  assert.deepEqual(skipped, [], '.ps1 silenciado vía alias, no WARN');
});

test('B10 wireNewHooks — .ps1 wired → .sh del mismo grupo se salta silenciosamente', () => {
  const settings = {
    hooks: {
      SessionStart: [
        { hooks: [{ type: 'command', command: 'pwsh "$CLAUDE_PROJECT_DIR/.claude/hooks/session-state.ps1"' }] },
      ],
    },
  };
  const { added, skipped } = wireNewHooks(settings, ['session-state.sh', 'session-state.ps1']);
  assert.deepEqual(added, [], '.sh no se añade — alias del grupo ya wired');
  assert.deepEqual(skipped, [], '.sh silenciado vía alias, no WARN');
});

test('B11 wireNewHooks — nuevo proyecto sin session-state → solo .sh añadido, .ps1 silenciado', () => {
  const settings = { hooks: {} };
  const { added, skipped } = wireNewHooks(settings, ['session-state.sh', 'session-state.ps1']);
  assert.deepEqual(added, ['session-state.sh'], 'primera variante del grupo añadida');
  assert.deepEqual(skipped, [], '.ps1 silenciado vía addedGroups, no WARN');
});

test('B12 wireNewHooks — scaffolding-guard.sh wired → .js no emite WARN (silenciado vía alias)', () => {
  const settings = {
    hooks: {
      PreToolUse: [
        { matcher: 'Bash', hooks: [{ type: 'command', command: 'bash "$CLAUDE_PROJECT_DIR/.claude/hooks/scaffolding-guard.sh"' }] },
      ],
    },
  };
  const { added, skipped } = wireNewHooks(settings, ['scaffolding-guard.sh', 'scaffolding-guard.js']);
  assert.deepEqual(added, [], 'nada añadido');
  assert.deepEqual(skipped, [], 'scaffolding-guard.js silenciado vía alias — sin WARN');
});
