// Tests para sprint-doc-validator.js v1.0.0 (T139).
//
// Cubre las 5 validaciones del hook:
//   1. SPRINT_STATE_INVALID (Estado único parseable)
//   2. SPRINT_TABLE_MISSING (tabla §3 con ≥1 fila)
//   3. SPRINT_DAG_MISSING (bloque mermaid)
//   4. SPRINT_LIFECYCLE_MISSING (advisory)
//   5. Task count cabecera vs filas (advisory)
//
// Además: opt-in con/sin flag, path scoping, advisory vs block mode, retrocompat.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { invokeJsHook, makeTmpProject, hooksDir } from './helper.js';

function rmTmp(p) {
  try {
    rmSync(p, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 });
  } catch {
    // Cleanup best-effort
  }
}

const HOOK = join(hooksDir(), 'sprint-doc-validator.js');

function makeWriteInput({ cwd, filePath, content }) {
  return {
    tool_name: 'Write',
    cwd,
    tool_input: { file_path: filePath, content },
  };
}

const VALID_SPRINT = `# Sprint 04: Implement OAuth

> **Estado:** ABIERTA
> **Tasks:** 2 total

## 1. Visión y motivación
Necesitamos auth.

## 2. Alcance del sprint
Incluye OAuth, refresh tokens.

## 3. Tabla de tasks

| ID  | Título               | Estado | Wave | Depende de |
|-----|----------------------|--------|------|------------|
| 145 | Implement OAuth flow | ABIERTA | 1   | —          |
| 146 | Add refresh tokens   | ABIERTA | 2   | 145        |

## 4. DAG (Mermaid)

\`\`\`mermaid
graph LR
  T145[T145 OAuth]
  T146[T146 refresh]
  T145 --> T146
\`\`\`

## 5. Waves de ejecución
- Wave 1: T145
- Wave 2: T146

## 6. Reviews iterativas
Ronda 1: 0 fixes — CONVERGED.

## 7. Lifecycle
- **Apertura:** 2026-05-11.
- **Cierre esperado:** TBD.
`;

test('sprint-doc-validator: sprint válido completo → exit 0 sin findings', (t) => {
  const tmp = makeTmpProject({
    __config__: { sprint_doc_validator: true },
  });
  t.after(() => rmTmp(tmp));
  const filePath = join(tmp, 'ai_docs', 'sprints', '04_implement_oauth.md');
  const r = invokeJsHook(HOOK, makeWriteInput({ cwd: tmp, filePath, content: VALID_SPRINT }), { cwd: tmp });
  assert.equal(r.exitCode, 0, `Expected exit 0; stdout=${r.stdout}`);
  assert.equal(r.stdout, '', `Expected empty stdout for clean sprint; stdout=${r.stdout}`);
});

test('sprint-doc-validator: Estado duplicado → BLOCKER advisory (exit 0 con error)', (t) => {
  const tmp = makeTmpProject({
    __config__: { sprint_doc_validator: true },
  });
  t.after(() => rmTmp(tmp));
  const filePath = join(tmp, 'ai_docs', 'sprints', '03_path_canonico.md');
  // Replica Sprint 03 con cabecera Estado duplicada (caso real detectado)
  const content = VALID_SPRINT.replace(
    '> **Estado:** ABIERTA',
    '> **Estado:** ABIERTA\n> **Estado:** COMPLETADA'
  );
  const r = invokeJsHook(HOOK, makeWriteInput({ cwd: tmp, filePath, content }), { cwd: tmp });
  assert.equal(r.exitCode, 0, `Advisory mode: exit 0; stdout=${r.stdout}`);
  assert.match(r.stdout, /SPRINT_STATE_INVALID/);
  assert.match(r.stdout, /2 [\s\S]*Estado[\s\S]*headers/);
});

test('sprint-doc-validator: Estado ausente → BLOCKER advisory', (t) => {
  const tmp = makeTmpProject({
    __config__: { sprint_doc_validator: true },
  });
  t.after(() => rmTmp(tmp));
  const filePath = join(tmp, 'ai_docs', 'sprints', '05_no_state.md');
  const content = VALID_SPRINT.replace(/^> \*\*Estado:\*\* ABIERTA\s*$/m, '');
  const r = invokeJsHook(HOOK, makeWriteInput({ cwd: tmp, filePath, content }), { cwd: tmp });
  assert.equal(r.exitCode, 0);
  assert.match(r.stdout, /SPRINT_STATE_INVALID/);
  assert.match(r.stdout, /missing required header/);
});

test('sprint-doc-validator: Estado con valor inválido → WARN advisory', (t) => {
  const tmp = makeTmpProject({
    __config__: { sprint_doc_validator: true },
  });
  t.after(() => rmTmp(tmp));
  const filePath = join(tmp, 'ai_docs', 'sprints', '06_bad_state.md');
  const content = VALID_SPRINT.replace('> **Estado:** ABIERTA', '> **Estado:** EN_REVISION');
  const r = invokeJsHook(HOOK, makeWriteInput({ cwd: tmp, filePath, content }), { cwd: tmp });
  assert.equal(r.exitCode, 0);
  assert.match(r.stdout, /invalid value[\s\S]*EN_REVISION/);
});

test('sprint-doc-validator: Tabla §3 ausente → BLOCKER advisory', (t) => {
  const tmp = makeTmpProject({
    __config__: { sprint_doc_validator: true },
  });
  t.after(() => rmTmp(tmp));
  const filePath = join(tmp, 'ai_docs', 'sprints', '07_no_table.md');
  const content = VALID_SPRINT.replace(/## 3\. Tabla de tasks[\s\S]*?(?=\n## 4\.)/m, '');
  const r = invokeJsHook(HOOK, makeWriteInput({ cwd: tmp, filePath, content }), { cwd: tmp });
  assert.equal(r.exitCode, 0);
  assert.match(r.stdout, /SPRINT_TABLE_MISSING/);
});

test('sprint-doc-validator: Tabla §3 vacía (sin filas NNN) → BLOCKER advisory', (t) => {
  const tmp = makeTmpProject({
    __config__: { sprint_doc_validator: true },
  });
  t.after(() => rmTmp(tmp));
  const filePath = join(tmp, 'ai_docs', 'sprints', '08_empty_table.md');
  const content = VALID_SPRINT.replace(
    /\| 145 \| Implement OAuth flow \| ABIERTA \| 1   \| —          \|\n\| 146 \| Add refresh tokens   \| ABIERTA \| 2   \| 145        \|\n/,
    ''
  );
  const r = invokeJsHook(HOOK, makeWriteInput({ cwd: tmp, filePath, content }), { cwd: tmp });
  assert.equal(r.exitCode, 0);
  assert.match(r.stdout, /SPRINT_TABLE_MISSING/);
  assert.match(r.stdout, /zero parseable task rows/);
});

test('sprint-doc-validator: DAG Mermaid ausente → BLOCKER advisory', (t) => {
  const tmp = makeTmpProject({
    __config__: { sprint_doc_validator: true },
  });
  t.after(() => rmTmp(tmp));
  const filePath = join(tmp, 'ai_docs', 'sprints', '09_no_dag.md');
  const content = VALID_SPRINT.replace(/```mermaid[\s\S]*?```/, '');
  const r = invokeJsHook(HOOK, makeWriteInput({ cwd: tmp, filePath, content }), { cwd: tmp });
  assert.equal(r.exitCode, 0);
  assert.match(r.stdout, /SPRINT_DAG_MISSING/);
});

test('sprint-doc-validator: Lifecycle ausente → WARN advisory (no BLOCKER)', (t) => {
  const tmp = makeTmpProject({
    __config__: { sprint_doc_validator: true },
  });
  t.after(() => rmTmp(tmp));
  const filePath = join(tmp, 'ai_docs', 'sprints', '10_no_lifecycle.md');
  const content = VALID_SPRINT.replace(/## 7\. Lifecycle[\s\S]*$/m, '');
  const r = invokeJsHook(HOOK, makeWriteInput({ cwd: tmp, filePath, content }), { cwd: tmp });
  assert.equal(r.exitCode, 0);
  assert.match(r.stdout, /missing section[\s\S]*Lifecycle/);
  assert.doesNotMatch(r.stdout, /SPRINT_/, 'Lifecycle ausente NO debe ser BLOCKER');
});

test('sprint-doc-validator: cabecera Tasks N vs filas tabla discrepa → WARN', (t) => {
  const tmp = makeTmpProject({
    __config__: { sprint_doc_validator: true },
  });
  t.after(() => rmTmp(tmp));
  const filePath = join(tmp, 'ai_docs', 'sprints', '11_count_mismatch.md');
  const content = VALID_SPRINT.replace('> **Tasks:** 2 total', '> **Tasks:** 5 total');
  const r = invokeJsHook(HOOK, makeWriteInput({ cwd: tmp, filePath, content }), { cwd: tmp });
  assert.equal(r.exitCode, 0);
  assert.match(r.stdout, /does not match 2 parseable rows/);
});

test('sprint-doc-validator: mode block + Estado duplicado → exit 2 con decision block', (t) => {
  const tmp = makeTmpProject({
    __config__: { sprint_doc_validator: { enabled: true, mode: 'block' } },
  });
  t.after(() => rmTmp(tmp));
  const filePath = join(tmp, 'ai_docs', 'sprints', '12_block_mode.md');
  const content = VALID_SPRINT.replace(
    '> **Estado:** ABIERTA',
    '> **Estado:** ABIERTA\n> **Estado:** COMPLETADA'
  );
  const r = invokeJsHook(HOOK, makeWriteInput({ cwd: tmp, filePath, content }), { cwd: tmp });
  assert.equal(r.exitCode, 2, `Block mode: exit 2; stdout=${r.stdout}`);
  assert.match(r.stdout, /"decision":"block"/);
  assert.match(r.stdout, /SPRINT_DOC_STRUCTURE_INVALID/);
});

test('sprint-doc-validator: flag ausente → exit 0 silencioso (opt-in)', (t) => {
  const tmp = makeTmpProject({
    __config__: { otra_config: true },
  });
  t.after(() => rmTmp(tmp));
  const filePath = join(tmp, 'ai_docs', 'sprints', '13_flag_absent.md');
  // Sprint inválido — pero el flag está ausente, hook debe salir silencioso
  const content = '# Sprint roto sin nada';
  const r = invokeJsHook(HOOK, makeWriteInput({ cwd: tmp, filePath, content }), { cwd: tmp });
  assert.equal(r.exitCode, 0);
  assert.equal(r.stdout, '', `Hook desactivado debe ser silente; stdout=${r.stdout}`);
});

test('sprint-doc-validator: archivo fuera de ai_docs/sprints/ → skip silente', (t) => {
  const tmp = makeTmpProject({
    __config__: { sprint_doc_validator: true },
  });
  t.after(() => rmTmp(tmp));
  const filePath = join(tmp, 'ai_docs', 'tasks', '999_not_a_sprint.md');
  const r = invokeJsHook(HOOK, makeWriteInput({ cwd: tmp, filePath, content: '# random' }), { cwd: tmp });
  assert.equal(r.exitCode, 0);
  assert.equal(r.stdout, '');
});

test('sprint-doc-validator: ai_docs/sprints/README.md → skip (no es sprint doc)', (t) => {
  const tmp = makeTmpProject({
    __config__: { sprint_doc_validator: true },
  });
  t.after(() => rmTmp(tmp));
  const filePath = join(tmp, 'ai_docs', 'sprints', 'README.md');
  const r = invokeJsHook(HOOK, makeWriteInput({ cwd: tmp, filePath, content: '# Readme' }), { cwd: tmp });
  assert.equal(r.exitCode, 0);
  assert.equal(r.stdout, '');
});
