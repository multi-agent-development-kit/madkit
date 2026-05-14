// Tests para sprint-sync.js (versión 1.0.0, T099).
//
// El hook valida bidireccionalidad task↔sprint en PreToolUse Write/Edit:
//   - Si task doc declara `> **Sprint:** NN`, valida que ai_docs/sprints/NN_*.md
//     existe y lista el ID en su tabla "## 3. Tabla de tasks".
//   - Si sprint doc se escribe, valida que cada task ID en su tabla existe en
//     ai_docs/tasks/.
//
// Modos: "advisory" (default cuando flag activo, exit 0 + WARN), "block"
// ({decision, code, reason} + exit 2). Flag ausente → silencio total.
//
// Casos cubiertos (≥4):
//   1. Task con Sprint válido (sprint existe + lista ID) → exit 0 sin output.
//   2. Task con Sprint inexistente → exit 0 + WARN advisory.
//   3. Sprint con task ID válido → exit 0 sin output.
//   4. Sprint con task ID inexistente → exit 0 + WARN advisory.
//   5. Flag ausente → exit 0 silencioso.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { invokeJsHook, makeTmpProject, hooksDir } from './helper.js';

function rmTmp(p) {
  try {
    rmSync(p, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 });
  } catch {
    // best-effort
  }
}

const HOOK = join(hooksDir(), 'sprint-sync.js');

function makeWriteInput({ cwd, filePath, content }) {
  return {
    tool_name: 'Write',
    cwd,
    tool_input: {
      file_path: filePath,
      content,
    },
  };
}

// Sprint fixture con tabla de tasks que lista 100 y 101
const SPRINT_FIXTURE = `# Sprint 01: Test sprint

> **Estado:** ABIERTA
> **Creado:** 2026-05-07
> **Tasks:** 2 total · 0 completadas · 0 en progreso

## 1. Visión y motivación

Test fixture.

## 2. Alcance del sprint

- **Incluye:** test
- **No incluye:** producción

## 3. Tabla de tasks

| ID  | Título    | Estado    | Wave | Depende de |
|-----|-----------|-----------|------|------------|
| 100 | Task uno  | ABIERTA   | 1    | —          |
| 101 | Task dos  | ABIERTA   | 1    | —          |

## 4. DAG (Mermaid)

\`\`\`mermaid
graph LR
  100
  101
\`\`\`
`;

test('sprint-sync: task con Sprint válido → exit 0 sin output', (t) => {
  const tmp = makeTmpProject({
    __config__: { sprint_sync: { mode: 'advisory' } },
    'ai_docs/sprints/01_test.md': SPRINT_FIXTURE,
  });
  t.after(() => rmTmp(tmp));

  const taskPath = join(tmp, 'ai_docs', 'tasks', '100_test_task.md');
  const taskContent = '# Tarea 100: Test\n\n> **Sprint:** 01\n\n## 1. Resumen\n';

  const r = invokeJsHook(HOOK, makeWriteInput({
    cwd: tmp,
    filePath: taskPath,
    content: taskContent,
  }), { cwd: tmp });

  assert.equal(r.exitCode, 0);
  assert.equal(r.stdout, '');
});

test('sprint-sync: task con Sprint inexistente → exit 0 + WARN', (t) => {
  const tmp = makeTmpProject({
    __config__: { sprint_sync: { mode: 'advisory' } },
  });
  t.after(() => rmTmp(tmp));

  const taskPath = join(tmp, 'ai_docs', 'tasks', '105_test_task.md');
  const taskContent = '# Tarea 105: Test\n\n> **Sprint:** 99\n\n## 1. Resumen\n';

  const r = invokeJsHook(HOOK, makeWriteInput({
    cwd: tmp,
    filePath: taskPath,
    content: taskContent,
  }), { cwd: tmp });

  assert.equal(r.exitCode, 0);
  assert.notEqual(r.stdout, '', 'Esperado stdout no vacío con WARN');
  assert.match(r.stdout, /sprint-sync WARN/);
  assert.match(r.stdout, /Sprint 99/);
});

test('sprint-sync: sprint con task ID válido → exit 0 sin output', (t) => {
  const tmp = makeTmpProject({
    __config__: { sprint_sync: { mode: 'advisory' } },
    'ai_docs/tasks/100_existing.md': '# Tarea 100\n',
    'ai_docs/tasks/101_existing.md': '# Tarea 101\n',
  });
  t.after(() => rmTmp(tmp));

  const sprintPath = join(tmp, 'ai_docs', 'sprints', '01_test.md');

  const r = invokeJsHook(HOOK, makeWriteInput({
    cwd: tmp,
    filePath: sprintPath,
    content: SPRINT_FIXTURE,
  }), { cwd: tmp });

  assert.equal(r.exitCode, 0);
  assert.equal(r.stdout, '');
});

test('sprint-sync: sprint con task ID inexistente → exit 0 + WARN', (t) => {
  const tmp = makeTmpProject({
    __config__: { sprint_sync: { mode: 'advisory' } },
    // Solo creamos 100, no 101 — el sprint listará ambas pero 101 falta
    'ai_docs/tasks/100_existing.md': '# Tarea 100\n',
  });
  t.after(() => rmTmp(tmp));

  const sprintPath = join(tmp, 'ai_docs', 'sprints', '01_test.md');

  const r = invokeJsHook(HOOK, makeWriteInput({
    cwd: tmp,
    filePath: sprintPath,
    content: SPRINT_FIXTURE,
  }), { cwd: tmp });

  assert.equal(r.exitCode, 0);
  assert.notEqual(r.stdout, '', 'Esperado stdout no vacío con WARN');
  assert.match(r.stdout, /sprint-sync WARN/);
  assert.match(r.stdout, /101/);
});

test('T106: sprint-sync mode block con Sprint inexistente → exit 2 + schema canónico', (t) => {
  // Cubre la rama block-mode (decision/code/reason + exit 2) que en advisory
  // solo emite WARN. Verifica el schema canónico consistente con prompt-guard.
  const tmp = makeTmpProject({
    __config__: { sprint_sync: { mode: 'block' } },
  });
  t.after(() => rmTmp(tmp));

  const taskPath = join(tmp, 'ai_docs', 'tasks', '110_block_test.md');
  const taskContent = '# Tarea 110: Test\n\n> **Sprint:** 99\n\n## 1. Resumen\n';

  const r = invokeJsHook(HOOK, makeWriteInput({
    cwd: tmp,
    filePath: taskPath,
    content: taskContent,
  }), { cwd: tmp });

  assert.equal(r.exitCode, 2, `Expected exit 2 (block mode); stdout=${r.stdout}`);
  assert.match(r.stdout, /"decision":\s*"block"/);
  assert.match(r.stdout, /"code":/);
  assert.match(r.stdout, /"reason":/);
});

test('sprint-sync: flag ausente → exit 0 silencioso', (t) => {
  const tmp = makeTmpProject({
    __config__: { context_monitor: true }, // sin sprint_sync
  });
  t.after(() => rmTmp(tmp));

  const taskPath = join(tmp, 'ai_docs', 'tasks', '105_test_task.md');
  const taskContent = '# Tarea 105: Test\n\n> **Sprint:** 99\n\n## 1. Resumen\n';

  const r = invokeJsHook(HOOK, makeWriteInput({
    cwd: tmp,
    filePath: taskPath,
    content: taskContent,
  }), { cwd: tmp });

  assert.equal(r.exitCode, 0);
  assert.equal(r.stdout, '');
});

// ---------------------------------------------------------------------------
// Tests v1.1.0 (T114): validación de overlap de files_touched
// ---------------------------------------------------------------------------

// Sprint fixture con 2 tasks en wave 1 sin dependencia entre ellas
const SPRINT_OVERLAP_FIXTURE = `# Sprint 01: Overlap test sprint

> **Estado:** ABIERTA

## 3. Tabla de tasks

| ID  | Título    | Estado    | Wave | Depende de |
|-----|-----------|-----------|------|------------|
| 200 | Task A    | ABIERTA   | 1    | —          |
| 201 | Task B    | ABIERTA   | 1    | —          |

## 4. DAG
`;

// Task doc de task hermana (201) con files_touched
const SIBLING_TASK_201 = `# Tarea 201: Task B

> **Sprint:** 01

## Criterios de Éxito

- [ ] Criterio 1
- [ ] Criterio 2
- [ ] Criterio 3

\`\`\`yaml
contract:
  task_id: "201"
  complexity: "SIMPLE"
  depends_on: []
  files_touched:
    - "claude-templates/commands/setup_project.md"
\`\`\`
`;

// Task doc con files_touched que overlapa con task 201
function makeTask200Content(dependsOn) {
  const depsLine = dependsOn ? `> **Depende de:** ${dependsOn}\n\n` : '';
  return `# Tarea 200: Task A

> **Sprint:** 01
${depsLine}
## Criterios de Éxito

- [ ] Criterio 1
- [ ] Criterio 2
- [ ] Criterio 3

\`\`\`yaml
contract:
  task_id: "200"
  complexity: "SIMPLE"
  depends_on: []
  files_touched:
    - "claude-templates/commands/setup_project.md"
\`\`\`
`;
}

test('sprint-sync v1.1.0: overlap tasks misma wave sin Depende de → WARN', (t) => {
  // Task 200 y 201 en wave 1, mismo archivo, sin dependencia → debe emitir WARN
  const tmp = makeTmpProject({
    __config__: { sprint_sync: { mode: 'advisory' } },
    'ai_docs/sprints/01_overlap_test.md': SPRINT_OVERLAP_FIXTURE,
    'ai_docs/tasks/201_task_b.md': SIBLING_TASK_201,
  });
  t.after(() => rmTmp(tmp));

  const taskPath = join(tmp, 'ai_docs', 'tasks', '200_task_a.md');
  const taskContent = makeTask200Content(null);

  const r = invokeJsHook(HOOK, makeWriteInput({
    cwd: tmp,
    filePath: taskPath,
    content: taskContent,
  }), { cwd: tmp });

  assert.equal(r.exitCode, 0, `Expected exit 0 (advisory); stdout=${r.stdout}`);
  assert.notEqual(r.stdout, '', 'Esperado WARN por overlap');
  assert.match(r.stdout, /sprint-sync WARN/);
  assert.match(r.stdout, /200/);
  assert.match(r.stdout, /201/);
  assert.match(r.stdout, /setup_project\.md/);
});

test('sprint-sync v1.1.0: overlap tasks misma wave CON Depende de → sin WARN', (t) => {
  // Sprint fixture con Depende de: entre task 200 y 201
  const sprintWithDep = `# Sprint 01: Dep test sprint

> **Estado:** ABIERTA

## 3. Tabla de tasks

| ID  | Título    | Estado    | Wave | Depende de |
|-----|-----------|-----------|------|------------|
| 200 | Task A    | ABIERTA   | 1    | 201        |
| 201 | Task B    | ABIERTA   | 1    | —          |

## 4. DAG
`;
  const tmp = makeTmpProject({
    __config__: { sprint_sync: { mode: 'advisory' } },
    'ai_docs/sprints/01_dep_test.md': sprintWithDep,
    'ai_docs/tasks/201_task_b.md': SIBLING_TASK_201,
  });
  t.after(() => rmTmp(tmp));

  const taskPath = join(tmp, 'ai_docs', 'tasks', '200_task_a.md');
  // Task 200 tiene Depende de: 201 en su cabecera blockquote (para que el sprint
  // table ya declare la dependencia vía la columna "Depende de" del sprint fixture)
  const taskContent = makeTask200Content(null);

  const r = invokeJsHook(HOOK, makeWriteInput({
    cwd: tmp,
    filePath: taskPath,
    content: taskContent,
  }), { cwd: tmp });

  assert.equal(r.exitCode, 0);
  // No debe haber WARN de overlap (la dependencia justifica el toque secuencial)
  if (r.stdout !== '') {
    // Puede haber output de v1.0.0 si sprint no lista correctamente — pero no debe ser overlap
    assert.doesNotMatch(r.stdout, /sprint-sync WARN.*200.*201.*setup_project/s);
  }
});

test('sprint-sync v1.1.0: sprint con 1 sola task → no WARN overlap', (t) => {
  // Sprint con una sola task — no hay par con quien cruzar
  const sprintSingle = `# Sprint 01: Single task sprint

> **Estado:** ABIERTA

## 3. Tabla de tasks

| ID  | Título    | Estado    | Wave | Depende de |
|-----|-----------|-----------|------|------------|
| 200 | Task A    | ABIERTA   | 1    | —          |

## 4. DAG
`;
  const tmp = makeTmpProject({
    __config__: { sprint_sync: { mode: 'advisory' } },
    'ai_docs/sprints/01_single.md': sprintSingle,
  });
  t.after(() => rmTmp(tmp));

  const taskPath = join(tmp, 'ai_docs', 'tasks', '200_task_a.md');
  const taskContent = makeTask200Content(null);

  const r = invokeJsHook(HOOK, makeWriteInput({
    cwd: tmp,
    filePath: taskPath,
    content: taskContent,
  }), { cwd: tmp });

  assert.equal(r.exitCode, 0);
  // No debe haber WARN de overlap
  if (r.stdout !== '') {
    assert.doesNotMatch(r.stdout, /sprint-sync WARN.*200.*201/s);
  }
});

test('sprint-sync v1.1.0: files_touched ausente en contract → skip silencioso', (t) => {
  // Task con contract válido pero sin files_touched → no debe emitir WARN de overlap
  const tmp = makeTmpProject({
    __config__: { sprint_sync: { mode: 'advisory' } },
    'ai_docs/sprints/01_overlap_test.md': SPRINT_OVERLAP_FIXTURE,
    'ai_docs/tasks/201_task_b.md': SIBLING_TASK_201,
  });
  t.after(() => rmTmp(tmp));

  const taskPath = join(tmp, 'ai_docs', 'tasks', '200_task_a.md');
  const taskContent = `# Tarea 200: Task A

> **Sprint:** 01

## Criterios de Éxito

- [ ] Criterio 1
- [ ] Criterio 2
- [ ] Criterio 3

\`\`\`yaml
contract:
  task_id: "200"
  complexity: "SIMPLE"
  depends_on: []
\`\`\`
`;

  const r = invokeJsHook(HOOK, makeWriteInput({
    cwd: tmp,
    filePath: taskPath,
    content: taskContent,
  }), { cwd: tmp });

  assert.equal(r.exitCode, 0);
  // No debe haber WARN de overlap (files_touched ausente = skip silencioso)
  if (r.stdout !== '') {
    assert.doesNotMatch(r.stdout, /setup_project\.md/);
  }
});

test('sprint-sync v1.1.0: bloque contract ausente → skip silencioso, v1.0.0 sigue', (t) => {
  // Task sin bloque contract (formato pre-T087) → no crashea, no emite WARN de overlap
  // Sprint existe y lista la task → v1.0.0 no emite WARN tampoco
  const tmp = makeTmpProject({
    __config__: { sprint_sync: { mode: 'advisory' } },
    'ai_docs/sprints/01_overlap_test.md': SPRINT_OVERLAP_FIXTURE,
    'ai_docs/tasks/201_task_b.md': SIBLING_TASK_201,
  });
  t.after(() => rmTmp(tmp));

  const taskPath = join(tmp, 'ai_docs', 'tasks', '200_task_a.md');
  const taskContent = `# Tarea 200: Task A

> **Sprint:** 01

## Criterios de Éxito

- [ ] Criterio 1
- [ ] Criterio 2
- [ ] Criterio 3

Sin bloque contract.
`;

  const r = invokeJsHook(HOOK, makeWriteInput({
    cwd: tmp,
    filePath: taskPath,
    content: taskContent,
  }), { cwd: tmp });

  assert.equal(r.exitCode, 0);
  // v1.0.0: sprint existe y lista task 200 → sin WARN
  assert.equal(r.stdout, '', `Expected silencio; stdout=${r.stdout}`);
});

test('sprint-sync v1.1.0: no-regresión v1.0.0 (Sprint inexistente + sin files_touched)', (t) => {
  // Task con Sprint que no existe Y sin files_touched → solo WARN de v1.0.0
  // No debe haber ruido de overlap encima
  const tmp = makeTmpProject({
    __config__: { sprint_sync: { mode: 'advisory' } },
  });
  t.after(() => rmTmp(tmp));

  const taskPath = join(tmp, 'ai_docs', 'tasks', '200_task_a.md');
  const taskContent = `# Tarea 200: Task A

> **Sprint:** 99

## Criterios de Éxito

- [ ] Criterio 1
- [ ] Criterio 2
- [ ] Criterio 3
`;

  const r = invokeJsHook(HOOK, makeWriteInput({
    cwd: tmp,
    filePath: taskPath,
    content: taskContent,
  }), { cwd: tmp });

  assert.equal(r.exitCode, 0);
  // Debe haber WARN de v1.0.0 (sprint inexistente)
  assert.notEqual(r.stdout, '', 'Esperado WARN de v1.0.0');
  assert.match(r.stdout, /sprint-sync WARN/);
  assert.match(r.stdout, /Sprint 99/);
  // No debe mencionar overlap (files_touched ausente → skip silencioso)
  assert.doesNotMatch(r.stdout, /modifican el mismo archivo/);
});

test('sprint-sync v1.1.0: bloque contract con YAML malformado → skip silencioso, no crashea', (t) => {
  // Task con bloque contract con YAML inválido → extractFilesTouched devuelve []
  // hook no crashea, valida v1.0.0 normalmente (sprint existe y lista task → sin WARN)
  const tmp = makeTmpProject({
    __config__: { sprint_sync: { mode: 'advisory' } },
    'ai_docs/sprints/01_overlap_test.md': SPRINT_OVERLAP_FIXTURE,
    'ai_docs/tasks/201_task_b.md': SIBLING_TASK_201,
  });
  t.after(() => rmTmp(tmp));

  const taskPath = join(tmp, 'ai_docs', 'tasks', '200_task_a.md');
  // YAML inválido: indentación rota y campo duplicado
  const taskContent = `# Tarea 200: Task A

> **Sprint:** 01

## Criterios de Éxito

- [ ] Criterio 1
- [ ] Criterio 2
- [ ] Criterio 3

\`\`\`yaml
contract:
  task_id: "200"
    complexity: BAD_INDENT   # indentación rota — YAML inválido
  files_touched:
    - "claude-templates/commands/setup_project.md"
      extra_bad_field: yes   # campo anidado inesperado
\`\`\`
`;

  const r = invokeJsHook(HOOK, makeWriteInput({
    cwd: tmp,
    filePath: taskPath,
    content: taskContent,
  }), { cwd: tmp });

  // No debe crashear (exit 0 o cualquier código — lo importante es no exit ≠ 0 por crash)
  assert.notEqual(r.exitCode, null, 'Hook no debe crashear');
  // Si el hook sigue sin emitir WARN de v1.0.0 (sprint válido), stdout debe ser ''
  // Si la heurística regex extrae files_touched a pesar del YAML malformado, puede haber WARN
  // Lo que NO debe ocurrir es un crash del proceso (exitCode null o stderr con uncaught exception)
  assert.doesNotMatch(r.stderr ?? '', /uncaughtException|TypeError|ReferenceError/);
});

// ---------------------------------------------------------------------------
// Test T154: sprint_close_doc_sync advisory con COMPLETADA
// ---------------------------------------------------------------------------

const SPRINT_COMPLETADA = `# Sprint 01: Test cierre

> **Estado:** COMPLETADA
> **Creado:** 2026-05-01

## 1. Visión y motivación

Test fixture de sprint cerrado.

## 2. Alcance del sprint

- **Incluye:** test
- **No incluye:** producción

## 3. Tabla de tasks

| ID  | Título    | Estado      | Wave | Depende de |
|-----|-----------|-------------|------|------------|
| 100 | Task uno  | COMPLETADA  | 1    | —          |

## 4. DAG (Mermaid)

\`\`\`mermaid
graph LR
  100
\`\`\`
`;

test('sprint-sync: sprint_close_doc_sync + COMPLETADA → advisory INFO emitido', (t) => {
  const tmp = makeTmpProject({
    __config__: { sprint_sync: { mode: 'advisory' }, sprint_close_doc_sync: true },
    'ai_docs/tasks/100_existing.md': '# Tarea 100\n',
  });
  t.after(() => rmTmp(tmp));

  const sprintPath = join(tmp, 'ai_docs', 'sprints', '01_test_cierre.md');

  const r = invokeJsHook(HOOK, makeWriteInput({
    cwd: tmp,
    filePath: sprintPath,
    content: SPRINT_COMPLETADA,
  }), { cwd: tmp });

  assert.equal(r.exitCode, 0, `Expected exit 0; stdout=${r.stdout}`);
  assert.notEqual(r.stdout, '', 'advisory INFO debe emitirse');
  assert.match(r.stdout, /sprint-sync INFO/);
  assert.match(r.stdout, /COMPLETADA/);
});

test('sprint-sync: sprint_close_doc_sync desactivado + COMPLETADA → sin advisory', (t) => {
  const tmp = makeTmpProject({
    __config__: { sprint_sync: { mode: 'advisory' }, sprint_close_doc_sync: false },
    'ai_docs/tasks/100_existing.md': '# Tarea 100\n',
  });
  t.after(() => rmTmp(tmp));

  const sprintPath = join(tmp, 'ai_docs', 'sprints', '01_test_cierre.md');

  const r = invokeJsHook(HOOK, makeWriteInput({
    cwd: tmp,
    filePath: sprintPath,
    content: SPRINT_COMPLETADA,
  }), { cwd: tmp });

  assert.equal(r.exitCode, 0);
  assert.equal(r.stdout, '', 'sin advisory cuando sprint_close_doc_sync: false');
});
