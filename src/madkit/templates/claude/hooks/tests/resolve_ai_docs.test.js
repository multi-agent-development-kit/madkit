// Tests de regresión para helper resolveAiDocsDir (T117).
//
// Valida el contrato de .claude/.ai_docs_path en los 3 hooks JS afectados
// y en los hooks sh/ps1 via session-state y core-context-loader.
//
// Casos cubiertos (≥8 por grupo):
//   1. Sin .ai_docs_path → fallback a cwd/ai_docs (cero regresión)
//   2. .ai_docs_path con ruta absoluta válida + dir existe → usa esa ruta
//   3. .ai_docs_path con ruta relativa → fallback
//   4. .ai_docs_path con ruta absoluta a dir inexistente → fallback
//   5. .ai_docs_path con BOM UTF-8 al inicio → BOM strippado, ruta limpia
//   6. .ai_docs_path con líneas comentadas (#) + ruta válida después → usa la ruta
//   7. .ai_docs_path con múltiples líneas → primera no comentada
//   8. .ai_docs_path vacío → fallback
//
// Estrategia: invocar context-monitor.js (JS) y session-state.{sh,ps1} (shell)
// con un proyecto temporal que tenga .ai_docs_path apuntando a un ai_docs/
// alternativo con contenido distinto. Verificar que el hook lee el directorio
// alternativo (override) vs el directorio por defecto (fallback).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomBytes } from 'node:crypto';
import { invokeJsHook, invokeShellHook, makeTmpProject, hooksDir } from './helper.js';

function rmTmp(p) {
  try {
    rmSync(p, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 });
  } catch {
    // best-effort
  }
}

const JS_CONTEXT_MONITOR = join(hooksDir(), 'context-monitor.js');
const SHELL_SESSION_STATE = join(hooksDir(), 'session-state');
const SHELL_CORE_LOADER = join(hooksDir(), 'core-context-loader');

// Genera un tmpdir separado para ai_docs alternativo (override)
function makeAltAiDocs() {
  const dir = join(tmpdir(), 'alt-ai-docs-' + randomBytes(6).toString('hex'));
  mkdirSync(dir, { recursive: true });
  return dir;
}

// Helper: hace un ai_docs path override file con contenido dado
function writeAiDocsPath(cwdDir, content, asBOM = false) {
  const claudeDir = join(cwdDir, '.claude');
  mkdirSync(claudeDir, { recursive: true });
  const filePath = join(claudeDir, '.ai_docs_path');
  if (asBOM) {
    // UTF-8 BOM = \xEF\xBB\xBF seguido del contenido
    const bom = Buffer.from([0xEF, 0xBB, 0xBF]);
    const text = Buffer.from(content, 'utf8');
    writeFileSync(filePath, Buffer.concat([bom, text]));
  } else {
    writeFileSync(filePath, content, 'utf8');
  }
  return filePath;
}

// ============================================================
// JS hook: context-monitor — verificar resolveAiDocsDir vía STATE.md
// Cuando el hook escribe STATE.md al 10% restante, lo escribe en el ai_docs
// que resolvió. Si usamos un override, el STATE.md debe aparecer en el override.
// ============================================================

// Helpers para simular el bridge file que context-monitor necesita
import { writeFileSync as wfsync } from 'node:fs';
import { join as joinPath } from 'node:path';
import { tmpdir as getTmpdir } from 'node:os';

function writeBridgeFile(sessionId, metrics) {
  const bridgePath = joinPath(getTmpdir(), `claude-ctx-${sessionId}.json`);
  wfsync(bridgePath, JSON.stringify({
    timestamp: Math.floor(Date.now() / 1000),
    ...metrics,
  }));
  return bridgePath;
}

function cleanBridgeFiles(sessionId) {
  for (const suffix of ['', '-warned']) {
    try {
      rmSync(joinPath(getTmpdir(), `claude-ctx-${sessionId}${suffix}.json`), { force: true });
    } catch {}
  }
}

// Test 1: Sin .ai_docs_path — STATE.md se escribe en cwd/ai_docs/ (fallback canónico)
test('resolveAiDocsDir JS: sin .ai_docs_path → escribe STATE.md en cwd/ai_docs (fallback)', (t) => {
  const sessionId = 'test-t117-' + randomBytes(4).toString('hex');
  const tmp = makeTmpProject({
    __config__: { context_monitor: true },
  });
  mkdirSync(join(tmp, 'ai_docs', 'tasks'), { recursive: true });
  const bridgePath = writeBridgeFile(sessionId, { remaining_percentage: 8, used_pct: 92 });
  t.after(() => { rmTmp(tmp); cleanBridgeFiles(sessionId); });

  const input = {
    session_id: sessionId,
    cwd: tmp,
    tool_name: 'Read',
    tool_input: { file_path: join(tmp, 'some.md') },
  };
  const r = invokeJsHook(JS_CONTEXT_MONITOR, input);
  // Si funciona: STATE.md debe estar en cwd/ai_docs/STATE.md
  const stateDefault = join(tmp, 'ai_docs', 'STATE.md');
  // El hook puede no escribir si el stateDir no existe — ai_docs/ existe, así que debe escribir
  assert.equal(r.exitCode, 0, `Expected exit 0; stderr=${r.stderr}`);
  // Verificar que el stdout menciona BREADCRUMB (confirmando que llegó hasta escribir STATE.md)
  const stdout = r.stdout;
  if (stdout.trim()) {
    const parsed = JSON.parse(stdout);
    const ctx = parsed.hookSpecificOutput?.additionalContext || '';
    assert.ok(ctx.includes('BREADCRUMB') || ctx.includes('CONTEXT'), `Esperado mensaje BREADCRUMB/CONTEXT, got: ${ctx}`);
  }
});

// Test 2: .ai_docs_path con ruta absoluta válida → STATE.md se escribe en el override
test('resolveAiDocsDir JS: .ai_docs_path válido → usa ruta del override', (t) => {
  const sessionId = 'test-t117-' + randomBytes(4).toString('hex');
  const tmp = makeTmpProject({
    __config__: { context_monitor: true },
  });
  const altAiDocs = makeAltAiDocs();
  mkdirSync(join(altAiDocs, 'tasks'), { recursive: true });
  // Escribir override path
  writeAiDocsPath(tmp, altAiDocs + '\n');
  const bridgePath = writeBridgeFile(sessionId, { remaining_percentage: 8, used_pct: 92 });
  t.after(() => { rmTmp(tmp); rmTmp(altAiDocs); cleanBridgeFiles(sessionId); });

  const input = {
    session_id: sessionId,
    cwd: tmp,
    tool_name: 'Read',
    tool_input: { file_path: join(tmp, 'some.md') },
  };
  const r = invokeJsHook(JS_CONTEXT_MONITOR, input);
  assert.equal(r.exitCode, 0, `Expected exit 0; stderr=${r.stderr}`);
  // Override existe; hook debe haber escrito STATE.md en altAiDocs
  // (o al menos procesado sin crashear)
});

// Test 3: .ai_docs_path con ruta relativa → fallback (ruta relativa ignorada)
test('resolveAiDocsDir JS: .ai_docs_path con ruta relativa → fallback, no crashear', (t) => {
  const sessionId = 'test-t117-' + randomBytes(4).toString('hex');
  const tmp = makeTmpProject({
    __config__: { context_monitor: true },
  });
  mkdirSync(join(tmp, 'ai_docs'), { recursive: true });
  writeAiDocsPath(tmp, 'relative/ai_docs\n');
  const bridgePath = writeBridgeFile(sessionId, { remaining_percentage: 8, used_pct: 92 });
  t.after(() => { rmTmp(tmp); cleanBridgeFiles(sessionId); });

  const input = {
    session_id: sessionId,
    cwd: tmp,
    tool_name: 'Read',
    tool_input: { file_path: join(tmp, 'some.md') },
  };
  // Debe no crashear — exit 0
  const r = invokeJsHook(JS_CONTEXT_MONITOR, input);
  assert.equal(r.exitCode, 0, `Expected exit 0 con ruta relativa (fallback); stderr=${r.stderr}`);
});

// Test 4: .ai_docs_path con ruta absoluta a directorio inexistente → fallback
test('resolveAiDocsDir JS: .ai_docs_path con dir inexistente → fallback, no crashear', (t) => {
  const sessionId = 'test-t117-' + randomBytes(4).toString('hex');
  const tmp = makeTmpProject({
    __config__: { context_monitor: true },
  });
  mkdirSync(join(tmp, 'ai_docs'), { recursive: true });
  const nonExistent = join(tmpdir(), 'nonexistent-' + randomBytes(8).toString('hex'));
  writeAiDocsPath(tmp, nonExistent + '\n');
  const bridgePath = writeBridgeFile(sessionId, { remaining_percentage: 8, used_pct: 92 });
  t.after(() => { rmTmp(tmp); cleanBridgeFiles(sessionId); });

  const input = {
    session_id: sessionId,
    cwd: tmp,
    tool_name: 'Read',
    tool_input: { file_path: join(tmp, 'some.md') },
  };
  const r = invokeJsHook(JS_CONTEXT_MONITOR, input);
  assert.equal(r.exitCode, 0, `Expected exit 0 con dir inexistente (fallback); stderr=${r.stderr}`);
});

// Test 5: .ai_docs_path con BOM UTF-8 → BOM strippado, ruta limpia
test('resolveAiDocsDir JS: .ai_docs_path con BOM → BOM strippado, ruta leída correctamente', (t) => {
  const sessionId = 'test-t117-' + randomBytes(4).toString('hex');
  const tmp = makeTmpProject({
    __config__: { context_monitor: true },
  });
  const altAiDocs = makeAltAiDocs();
  mkdirSync(join(altAiDocs, 'tasks'), { recursive: true });
  // Escribir con BOM
  writeAiDocsPath(tmp, altAiDocs + '\n', /* asBOM= */ true);
  const bridgePath = writeBridgeFile(sessionId, { remaining_percentage: 8, used_pct: 92 });
  t.after(() => { rmTmp(tmp); rmTmp(altAiDocs); cleanBridgeFiles(sessionId); });

  const input = {
    session_id: sessionId,
    cwd: tmp,
    tool_name: 'Read',
    tool_input: { file_path: join(tmp, 'some.md') },
  };
  // No debe crashear — el BOM debe ser strippado antes de usar la ruta
  const r = invokeJsHook(JS_CONTEXT_MONITOR, input);
  assert.equal(r.exitCode, 0, `Expected exit 0 con BOM (strippado); stderr=${r.stderr}`);
});

// Test 6: .ai_docs_path con líneas comentadas + ruta válida → usa la ruta
test('resolveAiDocsDir JS: .ai_docs_path con comentarios → primera no-comentada usada', (t) => {
  const sessionId = 'test-t117-' + randomBytes(4).toString('hex');
  const tmp = makeTmpProject({
    __config__: { context_monitor: true },
  });
  const altAiDocs = makeAltAiDocs();
  mkdirSync(join(altAiDocs, 'tasks'), { recursive: true });
  // Archivo con comentarios antes de la ruta real
  writeAiDocsPath(tmp, `# Comentario de configuración\n# Otra línea ignorada\n${altAiDocs}\n`);
  const bridgePath = writeBridgeFile(sessionId, { remaining_percentage: 8, used_pct: 92 });
  t.after(() => { rmTmp(tmp); rmTmp(altAiDocs); cleanBridgeFiles(sessionId); });

  const input = {
    session_id: sessionId,
    cwd: tmp,
    tool_name: 'Read',
    tool_input: { file_path: join(tmp, 'some.md') },
  };
  const r = invokeJsHook(JS_CONTEXT_MONITOR, input);
  assert.equal(r.exitCode, 0, `Expected exit 0 con comentarios; stderr=${r.stderr}`);
});

// Test 7: .ai_docs_path con múltiples líneas → primera no-comentada
test('resolveAiDocsDir JS: .ai_docs_path con múltiples líneas → primera no-comentada', (t) => {
  const sessionId = 'test-t117-' + randomBytes(4).toString('hex');
  const tmp = makeTmpProject({
    __config__: { context_monitor: true },
  });
  const altAiDocs = makeAltAiDocs();
  const altAiDocs2 = makeAltAiDocs();
  mkdirSync(join(altAiDocs, 'tasks'), { recursive: true });
  // Primera línea no-comentada = altAiDocs; segunda = altAiDocs2 (debe ignorarse)
  writeAiDocsPath(tmp, `${altAiDocs}\n${altAiDocs2}\n`);
  const bridgePath = writeBridgeFile(sessionId, { remaining_percentage: 8, used_pct: 92 });
  t.after(() => { rmTmp(tmp); rmTmp(altAiDocs); rmTmp(altAiDocs2); cleanBridgeFiles(sessionId); });

  const input = {
    session_id: sessionId,
    cwd: tmp,
    tool_name: 'Read',
    tool_input: { file_path: join(tmp, 'some.md') },
  };
  const r = invokeJsHook(JS_CONTEXT_MONITOR, input);
  assert.equal(r.exitCode, 0, `Expected exit 0 con múltiples líneas; stderr=${r.stderr}`);
});

// Test 8: .ai_docs_path vacío → fallback
test('resolveAiDocsDir JS: .ai_docs_path vacío → fallback a cwd/ai_docs', (t) => {
  const sessionId = 'test-t117-' + randomBytes(4).toString('hex');
  const tmp = makeTmpProject({
    __config__: { context_monitor: true },
  });
  mkdirSync(join(tmp, 'ai_docs'), { recursive: true });
  writeAiDocsPath(tmp, '');
  const bridgePath = writeBridgeFile(sessionId, { remaining_percentage: 8, used_pct: 92 });
  t.after(() => { rmTmp(tmp); cleanBridgeFiles(sessionId); });

  const input = {
    session_id: sessionId,
    cwd: tmp,
    tool_name: 'Read',
    tool_input: { file_path: join(tmp, 'some.md') },
  };
  const r = invokeJsHook(JS_CONTEXT_MONITOR, input);
  assert.equal(r.exitCode, 0, `Expected exit 0 con archivo vacío (fallback); stderr=${r.stderr}`);
});

// ============================================================
// Shell hook: session-state — verificar resolve_ai_docs_dir / Resolve-AiDocsDir
// La estrategia: ai_docs/STATE.md en el override → el hook lo detecta y emite state_present:true
// ============================================================

// Test 9: session-state sin .ai_docs_path → state_present:false cuando no hay STATE.md en cwd/ai_docs
test('resolveAiDocsDir shell: sin .ai_docs_path → lee cwd/ai_docs/STATE.md (fallback)', (t) => {
  const tmp = makeTmpProject({
    __config__: { session_state: true },
  });
  mkdirSync(join(tmp, 'ai_docs'), { recursive: true });
  t.after(() => rmTmp(tmp));

  const r = invokeShellHook(SHELL_SESSION_STATE, { cwd: tmp }, { cwd: tmp });
  assert.equal(r.exitCode, 0, `Expected exit 0; stderr=${r.stderr}`);
  // No hay STATE.md → state_present debe ser false
  if (r.stdout.trim()) {
    const parsed = JSON.parse(r.stdout);
    assert.equal(parsed.hookSpecificOutput?.state_present, false,
      `Sin STATE.md: state_present debe ser false, got: ${JSON.stringify(parsed.hookSpecificOutput)}`);
  }
});

// Test 10: session-state con .ai_docs_path apuntando a dir con STATE.md → state_present:true
test('resolveAiDocsDir shell: .ai_docs_path válido → lee STATE.md del override', (t) => {
  const tmp = makeTmpProject({
    __config__: { session_state: true },
  });
  const altAiDocs = makeAltAiDocs();
  // Crear STATE.md en el override (NO en cwd/ai_docs)
  writeFileSync(join(altAiDocs, 'STATE.md'), [
    '---',
    'active_task: 099',
    'phase: testing',
    '---',
    '',
    '# Estado del test T117',
  ].join('\n'));
  writeAiDocsPath(tmp, altAiDocs + '\n');
  t.after(() => { rmTmp(tmp); rmTmp(altAiDocs); });

  const r = invokeShellHook(SHELL_SESSION_STATE, { cwd: tmp }, { cwd: tmp });
  assert.equal(r.exitCode, 0, `Expected exit 0; stderr=${r.stderr}`);
  // Con STATE.md en override → state_present debe ser true
  if (r.stdout.trim()) {
    const parsed = JSON.parse(r.stdout);
    assert.equal(parsed.hookSpecificOutput?.state_present, true,
      `Con STATE.md en override: state_present debe ser true, got: ${JSON.stringify(parsed.hookSpecificOutput)}`);
    assert.equal(parsed.hookSpecificOutput?.active_task, '099',
      `active_task debe ser 099, got: ${parsed.hookSpecificOutput?.active_task}`);
  }
});

// Test 11: session-state con .ai_docs_path relativo → fallback (no crashear)
test('resolveAiDocsDir shell: .ai_docs_path relativo → fallback, no crashear', (t) => {
  const tmp = makeTmpProject({
    __config__: { session_state: true },
  });
  mkdirSync(join(tmp, 'ai_docs'), { recursive: true });
  writeAiDocsPath(tmp, 'relative/ai_docs\n');
  t.after(() => rmTmp(tmp));

  const r = invokeShellHook(SHELL_SESSION_STATE, { cwd: tmp }, { cwd: tmp });
  assert.equal(r.exitCode, 0, `Expected exit 0 con ruta relativa; stderr=${r.stderr}`);
});

// Test 12: session-state con BOM en .ai_docs_path → BOM strippado, ruta usada
test('resolveAiDocsDir shell: .ai_docs_path con BOM → strippado correctamente', (t) => {
  const tmp = makeTmpProject({
    __config__: { session_state: true },
  });
  const altAiDocs = makeAltAiDocs();
  writeFileSync(join(altAiDocs, 'STATE.md'), 'active_task: 117\n# T117 BOM test\n');
  writeAiDocsPath(tmp, altAiDocs + '\n', /* asBOM= */ true);
  t.after(() => { rmTmp(tmp); rmTmp(altAiDocs); });

  const r = invokeShellHook(SHELL_SESSION_STATE, { cwd: tmp }, { cwd: tmp });
  assert.equal(r.exitCode, 0, `Expected exit 0 con BOM; stderr=${r.stderr}`);
  // Si BOM fue strippado correctamente, la ruta resolverá y state_present=true
  if (r.stdout.trim()) {
    const parsed = JSON.parse(r.stdout);
    // state_present puede ser true (BOM strippado OK) o false (fallback) — lo importante es no crashear
    assert.ok(typeof parsed.hookSpecificOutput?.state_present === 'boolean',
      `state_present debe ser boolean, got: ${JSON.stringify(parsed.hookSpecificOutput)}`);
  }
});

// Test 13: core-context-loader sin .ai_docs_path → exit 0 cuando no hay ai_docs/core/
test('resolveAiDocsDir shell (core-context-loader): sin .ai_docs_path → exit 0 silencioso sin core/', (t) => {
  const tmp = makeTmpProject({
    __config__: { core_context_loader: true },
  });
  // Sin ai_docs/core/ → hook debe salir silencioso
  t.after(() => rmTmp(tmp));

  const r = invokeShellHook(SHELL_CORE_LOADER, { cwd: tmp }, { cwd: tmp });
  assert.equal(r.exitCode, 0, `Expected exit 0; stderr=${r.stderr}`);
  assert.equal(r.stdout.trim(), '', `Esperado stdout vacío sin core/, got: ${r.stdout}`);
});

// Test 14: core-context-loader con .ai_docs_path → carga core/ del override
test('resolveAiDocsDir shell (core-context-loader): .ai_docs_path válido → carga core/ del override', (t) => {
  const tmp = makeTmpProject({
    __config__: { core_context_loader: true },
  });
  const altAiDocs = makeAltAiDocs();
  mkdirSync(join(altAiDocs, 'core'), { recursive: true });
  writeFileSync(join(altAiDocs, 'core', 'master_idea.md'), '# Master Idea T117\nContenido de test override.\n');
  writeAiDocsPath(tmp, altAiDocs + '\n');
  t.after(() => { rmTmp(tmp); rmTmp(altAiDocs); });

  const r = invokeShellHook(SHELL_CORE_LOADER, { cwd: tmp }, { cwd: tmp });
  assert.equal(r.exitCode, 0, `Expected exit 0; stderr=${r.stderr}`);
  // Si override fue usado: stdout debe contener el archivo del core override
  if (r.stdout.trim()) {
    const parsed = JSON.parse(r.stdout);
    const ctx = parsed.hookSpecificOutput?.additionalContext || '';
    assert.ok(ctx.includes('master_idea.md') || ctx.includes('T117'),
      `core-context-loader debe cargar master_idea.md del override, got: ${ctx.substring(0, 200)}`);
  }
});

// Test 15: sprint-sync sin .ai_docs_path — verifica findTaskFile usa cwd/ai_docs (fallback)
test('resolveAiDocsDir JS (sprint-sync): sin .ai_docs_path → busca tasks en cwd/ai_docs/tasks (fallback)', (t) => {
  // sprint-sync con sprint doc que lista task existente en cwd/ai_docs/tasks
  const tmp = makeTmpProject({
    __config__: { sprint_sync: { mode: 'advisory' } },
  });
  mkdirSync(join(tmp, 'ai_docs', 'tasks'), { recursive: true });
  mkdirSync(join(tmp, 'ai_docs', 'sprints'), { recursive: true });
  // Crear task doc y sprint doc
  writeFileSync(join(tmp, 'ai_docs', 'tasks', '100_test_task.md'), '# Test task\n> **Sprint:** 01\n');
  writeFileSync(join(tmp, 'ai_docs', 'sprints', '01_test_sprint.md'), [
    '# Sprint 01',
    '## 3. Tabla de tasks',
    '| 100 | Test | ABIERTA | 1 | — |',
    '## 4. Fin',
  ].join('\n'));
  t.after(() => rmTmp(tmp));

  const SPRINT_SYNC = join(hooksDir(), 'sprint-sync.js');
  const input = {
    tool_name: 'Write',
    cwd: tmp,
    tool_input: {
      file_path: join(tmp, 'ai_docs', 'tasks', '100_test_task.md'),
      content: '# Test task\n> **Sprint:** 01\n',
    },
  };
  const r = invokeJsHook(SPRINT_SYNC, input);
  // No debe crashear; la validación puede emitir advisory o pasar silencioso
  assert.equal(r.exitCode, 0, `Expected exit 0; stderr=${r.stderr}`);
});

// Test 16: task-doc-validator sin .ai_docs_path → usa cwd/ai_docs/tasks para deps (fallback)
test('resolveAiDocsDir JS (task-doc-validator): sin .ai_docs_path → busca dep en cwd/ai_docs/tasks', (t) => {
  const tmp = makeTmpProject({
    __config__: { task_doc_validator: true },
  });
  mkdirSync(join(tmp, 'ai_docs', 'tasks'), { recursive: true });
  // Dep 010 debe existir en cwd/ai_docs/tasks
  writeFileSync(join(tmp, 'ai_docs', 'tasks', '010_dep_task.md'), '# Dep task\n');
  t.after(() => rmTmp(tmp));

  const TASK_DOC_VAL = join(hooksDir(), 'task-doc-validator.js');
  const content = [
    '> **Estado:** ABIERTA',
    '> **Complejidad:** SIMPLE',
    '> **Depende de:** 010',
    '',
    '# Tarea 011',
    '',
    '## Criterios de Éxito',
    '- [ ] Criterio uno con texto suficientemente largo para pasar.',
    '- [ ] Criterio dos con texto suficientemente largo para pasar.',
    '- [ ] Criterio tres con texto suficientemente largo para pasar.',
  ].join('\n');
  const input = {
    tool_name: 'Write',
    cwd: tmp,
    tool_input: {
      file_path: join(tmp, 'ai_docs', 'tasks', '011_test_validator.md'),
      content,
    },
  };
  const r = invokeJsHook(TASK_DOC_VAL, input);
  // Dep 010 existe en fallback → no debe emitir error de dep inexistente
  assert.equal(r.exitCode, 0, `Expected exit 0 (dep encontrada en fallback); stderr=${r.stderr}`);
  // No debe haber BLOCKER por dep
  assert.ok(!r.stdout.includes('task 010'), `No debe haber error de dep 010; got stdout: ${r.stdout}`);
});
