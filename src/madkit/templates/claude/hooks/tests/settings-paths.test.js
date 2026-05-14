// Tests para resolución de paths de hooks (T144).
//
// Cubre 3 ejes:
//   A) Documentación: el snippet en README.md SOLO usa $CLAUDE_PROJECT_DIR
//      con comillas (cero paths relativos `node .claude/hooks/`).
//   B) Runtime cross-cwd: los hooks PostToolUse (context-monitor,
//      read-injection-scanner) salen exit 0 cuando node los invoca con
//      cwd != project_root, demostrando que el invocador (Claude Code)
//      puede pasarles cualquier cwd y siguen funcionando si la wiring usa
//      paths absolutos.
//   C) Migración legacy: función JS que reproduce la lógica regex de los
//      scripts sync_templates.{sh,ps1} — idempotente, no toca claves
//      no-hooks, maneja todos los runtimes (node/bash/pwsh).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, rmSync, mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomBytes } from 'node:crypto';
import { invokeJsHook, hooksDir } from './helper.js';

const HOOKS_DIR = hooksDir();
const README_PATH = join(HOOKS_DIR, 'README.md');

// ─── A) Documentación ─────────────────────────────────────────────────────

test('A1 README snippet usa $CLAUDE_PROJECT_DIR en TODOS los hooks JS', () => {
  const readme = readFileSync(README_PATH, 'utf8');

  // Extraer el primer bloque ```json ... ``` del README (el snippet de wiring)
  const match = readme.match(/```json\n([\s\S]*?)```/);
  assert.ok(match, 'snippet ```json``` ausente en README');
  const snippet = match[1];

  const relativeNodePaths = (snippet.match(/"command":\s*"node \.claude\/hooks\//g) || []).length;
  const absoluteNodePaths = (snippet.match(/\$CLAUDE_PROJECT_DIR\/\.claude\/hooks\//g) || []).length;

  assert.equal(relativeNodePaths, 0, `snippet tiene ${relativeNodePaths} paths relativos legacy (esperado 0)`);
  assert.ok(absoluteNodePaths >= 6, `snippet debe tener >=6 refs a $CLAUDE_PROJECT_DIR; encontradas ${absoluteNodePaths}`);
});

test('A2 README snippet usa $CLAUDE_PROJECT_DIR en hooks bash (SessionStart)', () => {
  const readme = readFileSync(README_PATH, 'utf8');
  const match = readme.match(/```json\n([\s\S]*?)```/);
  const snippet = match[1];

  const relativeBashPaths = (snippet.match(/"command":\s*"bash \.claude\/hooks\//g) || []).length;
  assert.equal(relativeBashPaths, 0, `snippet tiene ${relativeBashPaths} bash paths relativos legacy (esperado 0)`);
});

test('A3 README explica por qué $CLAUDE_PROJECT_DIR (defense-in-depth contra MODULE_NOT_FOUND)', () => {
  const readme = readFileSync(README_PATH, 'utf8');
  assert.ok(/MODULE_NOT_FOUND|Cannot find module/.test(readme),
    'README debe mencionar MODULE_NOT_FOUND/Cannot find module para que el usuario entienda el porqué');
  assert.ok(/expand|expande/.test(readme),
    'README debe explicar que Claude Code expande $CLAUDE_PROJECT_DIR');
});

// ─── B) Runtime cross-cwd ─────────────────────────────────────────────────

test('B1 context-monitor.js exit 0 desde cwd != project_root (path absoluto)', () => {
  const fakeCwd = mkdtempSync(join(tmpdir(), 'claude-cross-cwd-'));
  try {
    // Pasamos cwd raro al spawn de node, pero el hookPath es ABSOLUTO →
    // node resuelve el archivo correctamente.
    const r = invokeJsHook(join(HOOKS_DIR, 'context-monitor.js'),
      { session_id: 'test-cross-cwd-' + randomBytes(3).toString('hex'), cwd: fakeCwd },
      { cwd: fakeCwd, timeout: 3000 });
    assert.equal(r.exitCode, 0, `exit code ${r.exitCode}; stderr=${r.stderr.slice(0, 200)}`);
  } finally {
    rmSync(fakeCwd, { recursive: true, force: true });
  }
});

test('B2 read-injection-scanner.js exit 0 desde cwd != project_root', () => {
  const fakeCwd = mkdtempSync(join(tmpdir(), 'claude-cross-cwd-'));
  try {
    const r = invokeJsHook(join(HOOKS_DIR, 'read-injection-scanner.js'),
      { tool_name: 'Read', cwd: fakeCwd, tool_input: { file_path: 'no-existe.md' } },
      { cwd: fakeCwd, timeout: 3000 });
    assert.equal(r.exitCode, 0, `exit code ${r.exitCode}; stderr=${r.stderr.slice(0, 200)}`);
  } finally {
    rmSync(fakeCwd, { recursive: true, force: true });
  }
});

// ─── C) Migración legacy ──────────────────────────────────────────────────

// Reimplementación JS del regex usado por scripts/sync_templates.{sh,ps1}.
// Cualquier divergencia respecto al regex de los scripts es un bug — los tests
// C* son la SSOT de comportamiento esperado. Si el regex de sh/ps1 cambia,
// actualizar ESTA función primero y los scripts después.
function migrateLegacyPaths(jsonText) {
  return jsonText.replace(
    /"command":\s*"(node|bash) \.claude\/hooks\/([^"]+)"/g,
    '"command": "$1 \\"$$CLAUDE_PROJECT_DIR/.claude/hooks/$2\\""'
  );
}

test('C1 migrateLegacyPaths reescribe paths relativos a $CLAUDE_PROJECT_DIR', () => {
  const input = JSON.stringify({
    hooks: {
      PreToolUse: [
        { matcher: 'Write|Edit', hooks: [{ type: 'command', command: 'node .claude/hooks/prompt-guard.js' }] }
      ]
    }
  }, null, 2);

  const output = migrateLegacyPaths(input);

  // El resultado debe contener $CLAUDE_PROJECT_DIR y comillas escapadas
  assert.ok(output.includes('$CLAUDE_PROJECT_DIR/.claude/hooks/prompt-guard.js'),
    `output sin $CLAUDE_PROJECT_DIR: ${output}`);
  // Validar que sigue siendo JSON válido tras la migración
  assert.doesNotThrow(() => JSON.parse(output), 'output debe ser JSON parseable');
});

test('C2 migrateLegacyPaths es idempotente', () => {
  const input = JSON.stringify({
    hooks: {
      PostToolUse: [
        { matcher: '*', hooks: [{ type: 'command', command: 'node .claude/hooks/context-monitor.js' }] }
      ]
    }
  });

  const once = migrateLegacyPaths(input);
  const twice = migrateLegacyPaths(once);

  assert.equal(once, twice, 'segundo pase no debe modificar nada');
});

test('C3 migrateLegacyPaths preserva claves no-hooks (permissions, env)', () => {
  const input = JSON.stringify({
    permissions: { allow: ['Bash(*)'] },
    env: { FOO: 'bar' },
    hooks: {
      PreToolUse: [
        { matcher: 'Write', hooks: [{ type: 'command', command: 'node .claude/hooks/task-doc-validator.js' }] }
      ]
    }
  });

  const output = migrateLegacyPaths(input);
  const parsed = JSON.parse(output);

  assert.deepEqual(parsed.permissions, { allow: ['Bash(*)'] }, 'permissions intacto');
  assert.deepEqual(parsed.env, { FOO: 'bar' }, 'env intacto');
  assert.ok(parsed.hooks.PreToolUse[0].hooks[0].command.includes('$CLAUDE_PROJECT_DIR'),
    'hooks migrado');
});

test('C4 migrateLegacyPaths maneja múltiples hooks en el mismo settings', () => {
  const input = JSON.stringify({
    hooks: {
      PreToolUse: [
        { matcher: 'Write|Edit', hooks: [{ type: 'command', command: 'node .claude/hooks/prompt-guard.js' }] },
        { matcher: 'Write|Edit', hooks: [{ type: 'command', command: 'node .claude/hooks/task-doc-validator.js' }] },
        { matcher: 'Bash', hooks: [{ type: 'command', command: 'bash .claude/hooks/scaffolding-guard.sh' }] }
      ],
      PostToolUse: [
        { matcher: '*', hooks: [{ type: 'command', command: 'node .claude/hooks/context-monitor.js' }] }
      ]
    }
  });

  const output = migrateLegacyPaths(input);
  // 4 hooks legacy → 4 migrados
  const absoluteMatches = (output.match(/\$CLAUDE_PROJECT_DIR\/\.claude\/hooks\//g) || []).length;
  const relativeMatches = (output.match(/"(node|bash) \.claude\/hooks\//g) || []).length;
  assert.equal(absoluteMatches, 4, `4 hooks deben quedar con $CLAUDE_PROJECT_DIR; encontradas ${absoluteMatches}`);
  assert.equal(relativeMatches, 0, 'cero paths legacy tras migración');
});

test('C5 migrateLegacyPaths sobre input ya migrado → no-op', () => {
  const alreadyMigrated = JSON.stringify({
    hooks: {
      PreToolUse: [
        { matcher: 'Write', hooks: [{ type: 'command', command: 'node "$CLAUDE_PROJECT_DIR/.claude/hooks/prompt-guard.js"' }] }
      ]
    }
  });

  const output = migrateLegacyPaths(alreadyMigrated);
  assert.equal(output, alreadyMigrated, 'no-op sobre input ya migrado');
});

test('C6 migrateLegacyPaths NO toca paths de hooks fuera de .claude/hooks/', () => {
  // Un hipotético hook de proyecto en otra ruta no debe ser tocado.
  const input = JSON.stringify({
    hooks: {
      PreToolUse: [
        { matcher: 'Write', hooks: [{ type: 'command', command: 'node scripts/my-tool.js' }] },
        { matcher: 'Write', hooks: [{ type: 'command', command: 'node .claude/hooks/prompt-guard.js' }] }
      ]
    }
  });

  const output = migrateLegacyPaths(input);
  const parsed = JSON.parse(output);

  assert.equal(parsed.hooks.PreToolUse[0].hooks[0].command, 'node scripts/my-tool.js',
    'hook fuera de .claude/hooks/ intacto');
  assert.ok(parsed.hooks.PreToolUse[1].hooks[0].command.includes('$CLAUDE_PROJECT_DIR'),
    'hook de .claude/hooks/ migrado');
});
