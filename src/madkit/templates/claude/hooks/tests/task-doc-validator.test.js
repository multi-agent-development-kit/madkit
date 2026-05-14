// Tests para task-doc-validator.js (versión 1.1.0 tras T089).
//
// El validator se invoca como subprocess `node task-doc-validator.js` con stdin
// JSON simulando un PreToolUse para Write/Edit a ai_docs/tasks/*.md.
//
// Casos cubiertos (≥6):
//   1. Task doc real 087 del repo pasa con exit 0.
//   2. Filename inválido (no NNN_descriptor.md) → exit 2 + TASK_DOC_FILENAME_INVALID.
//   3. Sin sección "Criterios de Éxito" → exit 2 + TASK_DOC_STRUCTURE_INVALID.
//   4. `Depende de:` referenciando task inexistente → exit 2.
//   5. Criterios de Éxito como h3 (no h2) es aceptado tras T089 → exit 0.
//   6. Flag task_doc_validator: false → exit silencioso.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { invokeJsHook, makeTmpProject, hooksDir } from './helper.js';

// Cleanup robusto cross-platform — Windows EBUSY puede ocurrir si un proceso
// hijo aún tiene un handle. force + maxRetries + retryDelay mitigan.
function rmTmp(p) {
  try {
    rmSync(p, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 });
  } catch {
    // Cleanup best-effort: si el FS sigue ocupado, no rompemos el test.
  }
}

const HOOK = join(hooksDir(), 'task-doc-validator.js');
// import.meta.url da `file:///C:/.../task-doc-validator.test.js`. Resolvemos a path Win.
const TESTS_DIR = new URL('.', import.meta.url).pathname.replace(/^\/(\w):\//, '$1:/');
const FIXTURES_DIR = join(TESTS_DIR, 'fixtures');

// Real T087 task doc — regression test específica del bug T089.
const REPO_ROOT_FROM_HOOKS = join(hooksDir(), '..', '..');
const REAL_087_PATH = join(REPO_ROOT_FROM_HOOKS, 'ai_docs', 'tasks', '087_contratos_formales_subagents.md');

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

test('task-doc-validator: T089 regression — h3 "Criterios de Éxito" reconocido en task doc real 087', (t) => {
  // Regression test del bug T089: CRITERIA_SECTION_REGEX no matchea h3 (solo
  // h2). T087 usa h3, debía pasar tras T089.
  //
  // Tras T133 v1.3.0: T087 cita código ejecutable sin los 4 Criterios de
  // Calidad de Ingeniería canónicos (es task doc antiguo) → falla por D10
  // BLOCKER. Ese fallo es esperado e intencional — el comportamiento nuevo
  // exige los 4 criterios en task docs nuevos. Lo que ESTE test verifica es
  // específicamente que el bug T089 NO ha vuelto: el regex de h3 "Criterios
  // de Éxito" sigue funcionando (no debe aparecer el error histórico).
  const real087 = readFileSync(REAL_087_PATH, 'utf8');
  const tmp = makeTmpProject({
    __config__: { task_doc_validator: true },
    'ai_docs/tasks/085_namespacing_conceptual.md': '# Tarea 085: stub\n',
  });
  t.after(() => rmTmp(tmp));
  const filePath = join(tmp, 'ai_docs', 'tasks', '087_contratos_formales_subagents.md');
  const input = makeWriteInput({ cwd: tmp, filePath, content: real087 });
  const r = invokeJsHook(HOOK, input, { cwd: tmp });
  // El bug histórico T089 emitía 'Missing required section "Criterios de
  // Éxito"' por no detectar h3. Verificar que ese error NO aparece.
  assert.doesNotMatch(
    r.stdout,
    /Missing required section "Criterios de [ÉE]xito"/,
    `Bug T089 ha vuelto: el regex no detecta h3. stdout=${r.stdout}`
  );
});

test('task-doc-validator: bloquea filename inválido (sin NNN_)', (t) => {
  const tmp = makeTmpProject({
    __config__: { task_doc_validator: true },
  });
  t.after(() => rmTmp(tmp));
  const filePath = join(tmp, 'ai_docs', 'tasks', 'abc.md');
  const input = makeWriteInput({
    cwd: tmp,
    filePath,
    content: '# fake\n\n## Criterios de Éxito\n- [ ] ok\n- [ ] ok\n- [ ] ok\n',
  });
  const r = invokeJsHook(HOOK, input, { cwd: tmp });
  assert.equal(r.exitCode, 2, `Expected exit 2; stdout=${r.stdout}`);
  assert.match(r.stdout, /TASK_DOC_FILENAME_INVALID/, `Esperado código TASK_DOC_FILENAME_INVALID en stdout: ${r.stdout}`);
});

test('task-doc-validator: bloquea cuando falta "Criterios de Éxito"', (t) => {
  const tmp = makeTmpProject({
    __config__: { task_doc_validator: true },
  });
  t.after(() => rmTmp(tmp));
  const content = readFileSync(join(FIXTURES_DIR, 'missing-criteria.md'), 'utf8');
  const filePath = join(tmp, 'ai_docs', 'tasks', '998_missing_criteria.md');
  const input = makeWriteInput({ cwd: tmp, filePath, content });
  const r = invokeJsHook(HOOK, input, { cwd: tmp });
  assert.equal(r.exitCode, 2, `Expected exit 2; stdout=${r.stdout}`);
  assert.match(r.stdout, /TASK_DOC_STRUCTURE_INVALID/);
  assert.match(r.stdout, /Criterios de [ÉE]xito/i);
});

test('task-doc-validator: bloquea Depende de: con task inexistente', (t) => {
  // El validator solo comprueba existencia si ai_docs/tasks/ existe en cwd.
  // Sembramos el directorio (con solo el archivo bajo análisis para que el
  // listado del dir esté vivo) sin incluir el 999 referenciado.
  const tmp = makeTmpProject({
    __config__: { task_doc_validator: true },
    // Un archivo "ancla" para que el dir exista — pero NO 999.
    'ai_docs/tasks/100_anchor.md': '# Tarea 100\n',
  });
  t.after(() => rmTmp(tmp));
  const filePath = join(tmp, 'ai_docs', 'tasks', '500_test_dep.md');
  const content = `# Tarea 500: dep test

> **Depende de:** 999

## Criterios de Éxito
- [ ] uno
- [ ] dos
- [ ] tres
`;
  const input = makeWriteInput({ cwd: tmp, filePath, content });
  const r = invokeJsHook(HOOK, input, { cwd: tmp });
  assert.equal(r.exitCode, 2, `Expected exit 2; stdout=${r.stdout}`);
  assert.match(r.stdout, /Depende de/);
  assert.match(r.stdout, /999/);
});

test('task-doc-validator: detecta "Criterios de Éxito" en h3 (no h2)', (t) => {
  const tmp = makeTmpProject({
    __config__: { task_doc_validator: true },
  });
  t.after(() => rmTmp(tmp));
  const content = readFileSync(join(FIXTURES_DIR, 'valid-task-doc.md'), 'utf8');
  const filePath = join(tmp, 'ai_docs', 'tasks', '999_valid_h3.md');
  const input = makeWriteInput({ cwd: tmp, filePath, content });
  const r = invokeJsHook(HOOK, input, { cwd: tmp });
  assert.equal(r.exitCode, 0, `Expected exit 0 con h3; stdout=${r.stdout}`);
});

test('task-doc-validator: exit silencioso cuando flag task_doc_validator es false', (t) => {
  const tmp = makeTmpProject({
    __config__: { task_doc_validator: false },
  });
  t.after(() => rmTmp(tmp));
  const filePath = join(tmp, 'ai_docs', 'tasks', 'abc.md'); // filename inválido a propósito
  const input = makeWriteInput({
    cwd: tmp,
    filePath,
    content: '# nada\n',
  });
  const r = invokeJsHook(HOOK, input, { cwd: tmp });
  assert.equal(r.exitCode, 0, `Expected exit 0 (flag false); stdout=${r.stdout}`);
  assert.equal(r.stdout, '', `Esperado stdout vacío con flag desactivada, got: ${r.stdout}`);
});

// ============================================================================
// T102 — Tests para Dimension 8 "Failure Mode Coverage"
// ============================================================================

test('T102 D8: SIMPLE sin sección "Casos límite" y sin artifact ejecutable → ADVISORY (exit 0)', (t) => {
  const tmp = makeTmpProject({
    __config__: { task_doc_validator: true },
  });
  t.after(() => rmTmp(tmp));
  const filePath = join(tmp, 'ai_docs', 'tasks', '600_simple_no_failure_modes.md');
  const content = `# Tarea 600: edit puntual SIMPLE

> **Complejidad:** SIMPLE

## 1. Resumen
Cambio de typo en archivo existente.

## Criterios de Éxito
- [ ] Typo corregido
- [ ] Sin regresiones
- [ ] Cero refs rotas

## 3. Impactos esperados
- archivo (modificado, +1 línea typo fix)
`;
  const input = makeWriteInput({ cwd: tmp, filePath, content });
  const r = invokeJsHook(HOOK, input, { cwd: tmp });
  assert.equal(r.exitCode, 0, `Expected exit 0 (advisory only); stdout=${r.stdout}`);
  // Advisory warning emitted, but not blocking
  assert.match(r.stdout, /casos\s+l[íi]mite/i, `Esperado warning sobre "Casos límite": ${r.stdout}`);
});

test('T102 D8: ESTÁNDAR creando hook nuevo SIN sección "Casos límite" → BLOCKER (exit 2)', (t) => {
  const tmp = makeTmpProject({
    __config__: { task_doc_validator: true },
  });
  t.after(() => rmTmp(tmp));
  const filePath = join(tmp, 'ai_docs', 'tasks', '601_new_hook_no_failure.md');
  const content = `# Tarea 601: hook nuevo sin modos de fallo

## 1. Resumen
Crear hook nuevo \`new-hook.js\`.

## Criterios de Éxito
- [ ] Hook \`new-hook.js\` creado en claude-templates/hooks/
- [ ] Test verde
- [ ] Documentado en README

## 3. Impactos esperados
- claude-templates/hooks/new-hook.js (creado, ~80 líneas)
- claude-templates/hooks/README.md (modificado, +1 fila)
`;
  const input = makeWriteInput({ cwd: tmp, filePath, content });
  const r = invokeJsHook(HOOK, input, { cwd: tmp });
  assert.equal(r.exitCode, 2, `Expected exit 2 (BLOCKER); stdout=${r.stdout}`);
  assert.match(r.stdout, /TASK_DOC_STRUCTURE_INVALID/);
  assert.match(r.stdout, /Failure Modes|Casos l[íi]mite/i);
  assert.match(r.stdout, /Dimension 8/i);
});

test('T102 D8: ESTÁNDAR creando hook nuevo CON sección pero <3 entradas concretas → BLOCKER (exit 2)', (t) => {
  const tmp = makeTmpProject({
    __config__: { task_doc_validator: true },
  });
  t.after(() => rmTmp(tmp));
  const filePath = join(tmp, 'ai_docs', 'tasks', '602_new_hook_short_failure.md');
  const content = `# Tarea 602: hook nuevo con sección incompleta

## Criterios de Éxito
- [ ] Hook creado
- [ ] Test verde
- [ ] Doc actualizada

## Casos límite mínimos

- TODO

## 3. Impactos esperados
- claude-templates/hooks/short-hook.js (creado, ~50 líneas)
`;
  const input = makeWriteInput({ cwd: tmp, filePath, content });
  const r = invokeJsHook(HOOK, input, { cwd: tmp });
  assert.equal(r.exitCode, 2, `Expected exit 2 (BLOCKER por <3 entradas); stdout=${r.stdout}`);
  assert.match(r.stdout, /concrete entries/i);
});

test('T106: task-doc-validator Edit con replace_all valida resultado simulado', (t) => {
  // Cubre la rama replace_all:true (línea ~155 del validator) que estaba sin
  // tests dedicados. Crea un archivo válido, simula Edit replace_all que NO
  // rompe la estructura → exit 0.
  const tmp = makeTmpProject({
    __config__: { task_doc_validator: true },
  });
  t.after(() => rmTmp(tmp));
  const filePath = join(tmp, 'ai_docs', 'tasks', '700_replace_all.md');
  const original = `# Tarea 700: replace_all test

## Criterios de Éxito
- [ ] criterio uno
- [ ] criterio dos
- [ ] criterio tres
`;
  // Escribir el archivo previamente — el validator lee fs en Edit.
  mkdirSync(join(tmp, 'ai_docs', 'tasks'), { recursive: true });
  writeFileSync(filePath, original);

  // Edit con replace_all sustituyendo "criterio" por "criterio mejorado"
  const editInput = {
    tool_name: 'Edit',
    cwd: tmp,
    tool_input: {
      file_path: filePath,
      old_string: 'criterio',
      new_string: 'criterio mejorado',
      replace_all: true,
    },
  };
  const r = invokeJsHook(HOOK, editInput, { cwd: tmp });
  assert.equal(r.exitCode, 0, `Expected exit 0 con Edit replace_all válido; stdout=${r.stdout}`);
});

test('T102 D8: ESTÁNDAR creando hook con sección y ≥3 entradas concretas → exit 0', (t) => {
  const tmp = makeTmpProject({
    __config__: { task_doc_validator: true },
  });
  t.after(() => rmTmp(tmp));
  const filePath = join(tmp, 'ai_docs', 'tasks', '603_new_hook_complete.md');
  // Tras T133 v1.3.0: el content cita .js ejecutable, debe incluir los 4
  // Criterios de Calidad de Ingeniería canónicos para no fallar D10 BLOCKER.
  const content = `# Tarea 603: hook nuevo con casos límite completos

## Criterios de Éxito
- [ ] Hook creado funcional
- [ ] Test verde
- [ ] Documentado

### Criterios de Calidad de Ingeniería (canónicos)

- [ ] Cleanup exhaustivo de comentarios: sin TODO/FIXME residual.
- [ ] Sin dead/legacy code: callers verificados.
- [ ] DRY/KISS/early returns aplicados: revisión humana confirma.
- [ ] TDD reutilizando infra existente: test reusa helper cross-platform.

## Casos límite mínimos

- Input vacío: cuando stdin recibe payload vacío, hook exit 0 sin output (degradación silenciosa)
- Fallo de dependencia externa: si fs.readFileSync falla por permisos, hook captura error y exit 0 (no bloquea)
- Estado tras error parcial: si JSON.parse falla a mitad de stdin, hook descarta payload y exit 0

## 3. Impactos esperados
- claude-templates/hooks/complete-hook.js (creado, ~120 líneas)
`;
  const input = makeWriteInput({ cwd: tmp, filePath, content });
  const r = invokeJsHook(HOOK, input, { cwd: tmp });
  assert.equal(r.exitCode, 0, `Expected exit 0 con sección completa + 4 criterios canónicos; stdout=${r.stdout}`);
});

// ============================================================================
// T125 — Tests para marker ampliado (W2): (nuevo), (added), (new)
// ============================================================================

test('T125 W2: marker (nuevo) con extensión .js → D8 dispara igual que (creado)', (t) => {
  const tmp = makeTmpProject({
    __config__: { task_doc_validator: true },
  });
  t.after(() => rmTmp(tmp));
  const filePath = join(tmp, 'ai_docs', 'tasks', '800_marker_nuevo.md');
  // Usa (nuevo) en lugar de (creado) — debe disparar D8 igual
  const content = `# Tarea 800: test marker nuevo

## Criterios de Éxito
- [ ] hook creado
- [ ] tests verde
- [ ] doc ok

## 3. Impactos esperados
- claude-templates/hooks/foo.js (nuevo, ~80 líneas)
`;
  const input = makeWriteInput({ cwd: tmp, filePath, content });
  const r = invokeJsHook(HOOK, input, { cwd: tmp });
  // Sin sección Casos límite → BLOCKER (D8 detectó artifact nuevo con marker "(nuevo)")
  assert.equal(r.exitCode, 2, `Expected exit 2 (BLOCKER por marker "(nuevo)"); stdout=${r.stdout}`);
  assert.match(r.stdout, /TASK_DOC_STRUCTURE_INVALID/);
});

test('T125 W2: marker (added) con extensión .sh → D8 dispara igual que (creado)', (t) => {
  const tmp = makeTmpProject({
    __config__: { task_doc_validator: true },
  });
  t.after(() => rmTmp(tmp));
  const filePath = join(tmp, 'ai_docs', 'tasks', '801_marker_added.md');
  const content = `# Tarea 801: test marker added

## Criterios de Éxito
- [ ] script creado
- [ ] tests verde
- [ ] doc ok

## 3. Impactos esperados
- claude-templates/hooks/bar.sh (added, ~30 líneas)
`;
  const input = makeWriteInput({ cwd: tmp, filePath, content });
  const r = invokeJsHook(HOOK, input, { cwd: tmp });
  assert.equal(r.exitCode, 2, `Expected exit 2 con marker "(added)"; stdout=${r.stdout}`);
  assert.match(r.stdout, /TASK_DOC_STRUCTURE_INVALID/);
});

test('T125 W2: marker (new) con extensión .mjs y .cjs → D8 dispara para ambas', (t) => {
  const tmp = makeTmpProject({
    __config__: { task_doc_validator: true },
  });
  t.after(() => rmTmp(tmp));
  const filePath = join(tmp, 'ai_docs', 'tasks', '802_marker_new_mjs.md');
  // .mjs es extensión ejecutable — debe disparar D8 con marker (new)
  const content = `# Tarea 802: test marker new con mjs

## Criterios de Éxito
- [ ] módulo ESM creado
- [ ] tests verde
- [ ] doc ok

## 3. Impactos esperados
- claude-templates/hooks/esm-hook.mjs (new, ~60 líneas)
`;
  const input = makeWriteInput({ cwd: tmp, filePath, content });
  const r = invokeJsHook(HOOK, input, { cwd: tmp });
  assert.equal(r.exitCode, 2, `Expected exit 2 con marker "(new)" y .mjs; stdout=${r.stdout}`);
  assert.match(r.stdout, /TASK_DOC_STRUCTURE_INVALID/);
});

// ============================================================================
// T133 — Tests para Dimension 10 "Engineering Hygiene Criteria" (v1.3.0)
// ============================================================================

test('T133 D10: task con código ejecutable y 4 criterios canónicos presentes → exit 0', (t) => {
  const tmp = makeTmpProject({
    __config__: { task_doc_validator: true },
  });
  t.after(() => rmTmp(tmp));
  const content = readFileSync(join(FIXTURES_DIR, 'valid-task-doc-with-hygiene.md'), 'utf8');
  const filePath = join(tmp, 'ai_docs', 'tasks', '900_hygiene_complete.md');
  const input = makeWriteInput({ cwd: tmp, filePath, content });
  const r = invokeJsHook(HOOK, input, { cwd: tmp });
  assert.equal(r.exitCode, 0, `Expected exit 0 con 4 criterios canónicos; stdout=${r.stdout}`);
});

test('T133 D10: task con .ts file pero "Cleanup exhaustivo de comentarios" ausente → BLOCKER (exit 2)', (t) => {
  const tmp = makeTmpProject({
    __config__: { task_doc_validator: true },
  });
  t.after(() => rmTmp(tmp));
  const filePath = join(tmp, 'ai_docs', 'tasks', '901_hygiene_missing_cleanup.md');
  const content = `# Tarea 901: hygiene missing cleanup

## Criterios de Éxito
- [ ] feature implementada
- [ ] tests verde
- [ ] doc ok

### Criterios de Calidad de Ingeniería (canónicos)
- [ ] Sin dead/legacy code: callers verificados.
- [ ] DRY/KISS/early returns aplicados: revisión humana confirma.
- [ ] TDD reutilizando infra existente: test reusa helper cross-platform.

## Casos límite mínimos
- Input vacío: feature retorna error tipado al recibir input null o vacío correctamente.
- Fallo de dependencia externa: feature captura excepción y degrada graceful.
- Estado tras error parcial: feature es idempotente sin estado mutable global.

## Impactos esperados
- src/feature.ts (modificado, ~30 líneas)
`;
  const input = makeWriteInput({ cwd: tmp, filePath, content });
  const r = invokeJsHook(HOOK, input, { cwd: tmp });
  assert.equal(r.exitCode, 2, `Expected exit 2 (BLOCKER por D10 cleanup ausente); stdout=${r.stdout}`);
  assert.match(r.stdout, /Cleanup exhaustivo de comentarios/);
  assert.match(r.stdout, /Engineering Hygiene/);
});

test('T133 D10: task con código ejecutable y 0 de 4 criterios canónicos → 4 errores BLOCKER', (t) => {
  const tmp = makeTmpProject({
    __config__: { task_doc_validator: true },
  });
  t.after(() => rmTmp(tmp));
  const filePath = join(tmp, 'ai_docs', 'tasks', '902_hygiene_zero.md');
  const content = `# Tarea 902: hygiene cero

## Criterios de Éxito
- [ ] feature implementada
- [ ] tests verde
- [ ] doc ok

## Casos límite mínimos
- Input vacío: feature retorna error tipado al recibir input null o vacío correctamente.
- Fallo de dependencia externa: feature captura excepción y degrada graceful.
- Estado tras error parcial: feature es idempotente sin estado mutable global.

## Impactos esperados
- src/feature.ts (modificado, ~30 líneas)
`;
  const input = makeWriteInput({ cwd: tmp, filePath, content });
  const r = invokeJsHook(HOOK, input, { cwd: tmp });
  assert.equal(r.exitCode, 2, `Expected exit 2 con 0 criterios; stdout=${r.stdout}`);
  // Cada uno de los 4 criterios canónicos debe aparecer como error BLOCKER
  assert.match(r.stdout, /Cleanup exhaustivo de comentarios/);
  assert.match(r.stdout, /Sin dead\/legacy code/);
  assert.match(r.stdout, /DRY\/KISS\/early returns/);
  assert.match(r.stdout, /TDD reutilizando infra/);
});

test('T133 D10: task con declaración "Excepción a Criterios de Calidad de Ingeniería" en "Riesgos aceptados" → exit 0 sin validar hygiene', (t) => {
  const tmp = makeTmpProject({
    __config__: { task_doc_validator: true },
  });
  t.after(() => rmTmp(tmp));
  const filePath = join(tmp, 'ai_docs', 'tasks', '903_hygiene_exception.md');
  const content = `# Tarea 903: documentación pura con paths ejecutables solo de cita

## Criterios de Éxito
- [ ] doc actualizada
- [ ] refs verificadas
- [ ] sin gaps

## Casos límite mínimos
- Doc con typo: corrección inmediata sin afectar refs cruzadas.
- Refs rotas tras rename: grep sobre nombre antiguo retorna 0 hits post-cambio.
- Doc en idioma mixto: sección consistente en español por convención global.

## Riesgos aceptados

Excepción a Criterios de Calidad de Ingeniería: task no toca código ejecutable (solo docs/config). Las menciones de src/feature.ts en este doc son citas explicativas.

## Impactos
- README.md (modificado, +50 líneas; cita src/feature.ts como referencia).
`;
  const input = makeWriteInput({ cwd: tmp, filePath, content });
  const r = invokeJsHook(HOOK, input, { cwd: tmp });
  assert.equal(r.exitCode, 0, `Expected exit 0 con excepción declarada; stdout=${r.stdout}`);
});

test('T133 D10: task puramente documental (solo .md, sin paths ejecutables) → exit 0 sin validar hygiene', (t) => {
  const tmp = makeTmpProject({
    __config__: { task_doc_validator: true },
  });
  t.after(() => rmTmp(tmp));
  const filePath = join(tmp, 'ai_docs', 'tasks', '904_only_docs.md');
  const content = `# Tarea 904: actualización de documentación

## Criterios de Éxito
- [ ] README actualizado
- [ ] CHANGELOG sincronizado
- [ ] Refs cruzadas válidas

## Casos límite mínimos
- Doc con typo: corrección inmediata sin afectar refs cruzadas.
- Refs rotas: grep verifica cero hits del término antiguo post-cambio.
- Doc inconsistente: revisor humano valida coherencia narrativa.

## Impactos
- README.md (modificado, +20 líneas)
- CHANGELOG.md (modificado, +5 líneas)
`;
  const input = makeWriteInput({ cwd: tmp, filePath, content });
  const r = invokeJsHook(HOOK, input, { cwd: tmp });
  assert.equal(r.exitCode, 0, `Expected exit 0 sin paths ejecutables; stdout=${r.stdout}`);
});

// =============================================================================
// T139 — Sprint Suffix Coherence (v1.4.0)
// =============================================================================
//
// Filename "_sNN_" en task doc opcional; debe coincidir con cabecera
// "> **Sprint:** NN". Tests cubren: matching, mismatch BLOCKER, sufijo huérfano
// BLOCKER, header sin sufijo WARN advisory, retrocompat tasks legacy.

test('T139 sprint suffix: filename con sufijo + cabecera matching → exit 0', (t) => {
  const tmp = makeTmpProject({
    __config__: { task_doc_validator: true },
  });
  t.after(() => rmTmp(tmp));
  const filePath = join(tmp, 'ai_docs', 'tasks', '910_s04_implement_oauth.md');
  const content = `# Tarea 910: implementar oauth flow

> **Sprint:** 04
> **Estado:** ABIERTA

## Criterios de Éxito
- [ ] flow funcional
- [ ] tests verde
- [ ] doc ok

## Casos límite mínimos
- Input vacío: el provider retorna 401 con cuerpo tipado y log estructurado.
- Token expirado: el servicio refresca silenciosamente o redirige a /login con flag.
- Estado post-error: rollback transactional + audit log; sin tokens huérfanos.
`;
  const input = makeWriteInput({ cwd: tmp, filePath, content });
  const r = invokeJsHook(HOOK, input, { cwd: tmp });
  assert.equal(r.exitCode, 0, `Expected exit 0 con sufijo coherente; stdout=${r.stdout}`);
  assert.doesNotMatch(r.stdout, /SPRINT_SUFFIX_MISMATCH/);
});

test('T139 sprint suffix: filename con sufijo NN + cabecera Sprint MM distinto → BLOCKER', (t) => {
  const tmp = makeTmpProject({
    __config__: { task_doc_validator: true },
  });
  t.after(() => rmTmp(tmp));
  const filePath = join(tmp, 'ai_docs', 'tasks', '911_s04_mismatch.md');
  const content = `# Tarea 911: sprint mismatch

> **Sprint:** 07
> **Estado:** ABIERTA

## Criterios de Éxito
- [ ] uno
- [ ] dos
- [ ] tres
`;
  const input = makeWriteInput({ cwd: tmp, filePath, content });
  const r = invokeJsHook(HOOK, input, { cwd: tmp });
  assert.equal(r.exitCode, 2, `Expected exit 2 por mismatch sufijo/cabecera; stdout=${r.stdout}`);
  assert.match(r.stdout, /SPRINT_SUFFIX_MISMATCH/);
  assert.match(r.stdout, /_s04_[\s\S]*does not match[\s\S]*Sprint[\s\S]*07/);
});

test('T139 sprint suffix: filename con sufijo + sin cabecera Sprint → BLOCKER', (t) => {
  const tmp = makeTmpProject({
    __config__: { task_doc_validator: true },
  });
  t.after(() => rmTmp(tmp));
  const filePath = join(tmp, 'ai_docs', 'tasks', '912_s05_orphan_suffix.md');
  const content = `# Tarea 912: sufijo sin cabecera

> **Estado:** ABIERTA

## Criterios de Éxito
- [ ] uno
- [ ] dos
- [ ] tres
`;
  const input = makeWriteInput({ cwd: tmp, filePath, content });
  const r = invokeJsHook(HOOK, input, { cwd: tmp });
  assert.equal(r.exitCode, 2, `Expected exit 2 con sufijo huérfano; stdout=${r.stdout}`);
  assert.match(r.stdout, /SPRINT_SUFFIX_MISMATCH/);
  assert.match(r.stdout, /body lacks[\s\S]*Sprint[\s\S]*header/);
});

test('T139 sprint suffix: filename sin sufijo + cabecera Sprint NN → WARN advisory (exit 0)', (t) => {
  const tmp = makeTmpProject({
    __config__: { task_doc_validator: true },
  });
  t.after(() => rmTmp(tmp));
  const filePath = join(tmp, 'ai_docs', 'tasks', '913_missing_suffix.md');
  const content = `# Tarea 913: cabecera sin sufijo en filename

> **Sprint:** 06
> **Estado:** ABIERTA

## Criterios de Éxito
- [ ] uno
- [ ] dos
- [ ] tres
`;
  const input = makeWriteInput({ cwd: tmp, filePath, content });
  const r = invokeJsHook(HOOK, input, { cwd: tmp });
  assert.equal(r.exitCode, 0, `Expected exit 0 con WARN advisory; stdout=${r.stdout}`);
  assert.match(r.stdout, /lacks suffix[\s\S]*_s06_/);
});

test('T139 sprint suffix: tarea atómica sin sufijo y sin cabecera → exit 0 sin warnings sprint', (t) => {
  // Retrocompat: tasks 001-138 NO tienen sufijo ni cabecera Sprint — deben
  // seguir pasando sin warnings nuevos por sprint suffix.
  const tmp = makeTmpProject({
    __config__: { task_doc_validator: true },
  });
  t.after(() => rmTmp(tmp));
  const filePath = join(tmp, 'ai_docs', 'tasks', '914_atomic_task.md');
  const content = `# Tarea 914: tarea atómica sin sprint

> **Estado:** ABIERTA

## Criterios de Éxito
- [ ] uno
- [ ] dos
- [ ] tres
`;
  const input = makeWriteInput({ cwd: tmp, filePath, content });
  const r = invokeJsHook(HOOK, input, { cwd: tmp });
  assert.equal(r.exitCode, 0, `Expected exit 0 para tarea atómica; stdout=${r.stdout}`);
  assert.doesNotMatch(r.stdout, /SPRINT_SUFFIX_MISMATCH/);
  assert.doesNotMatch(r.stdout, /lacks suffix/);
});

test('T133 D10: variante DRY+KISS+"early returns" en líneas separadas → acepta como criterio presente', (t) => {
  const tmp = makeTmpProject({
    __config__: { task_doc_validator: true },
  });
  t.after(() => rmTmp(tmp));
  const filePath = join(tmp, 'ai_docs', 'tasks', '905_hygiene_variant.md');
  // Variante: DRY, KISS y early returns aparecen en líneas separadas dentro
  // de la sección, no como header canónico junto. El regex con lookaheads
  // multi-línea debe aceptarlo.
  const content = `# Tarea 905: variante DRY+KISS+early returns separados

## Criterios de Éxito
- [ ] feature implementada
- [ ] tests verde
- [ ] doc ok

### Criterios de Calidad de Ingeniería (canónicos)
- [ ] Cleanup exhaustivo de comentarios: sin TODO/FIXME residual.
- [ ] Sin dead/legacy code: callers verificados.
- [ ] DRY: sin duplicación >3L.
- [ ] KISS: sin abstracciones para 1 callsite.
- [ ] Early returns aplicados: guards tempranos en validación.
- [ ] TDD reutilizando infra existente: test reusa helper cross-platform.

## Casos límite mínimos
- Input vacío: feature retorna error tipado al recibir input null o vacío correctamente.
- Fallo de dependencia externa: feature captura excepción y degrada graceful.
- Estado tras error parcial: feature es idempotente sin estado mutable global.

## Impactos esperados
- src/feature.ts (modificado, ~30 líneas)
`;
  const input = makeWriteInput({ cwd: tmp, filePath, content });
  const r = invokeJsHook(HOOK, input, { cwd: tmp });
  assert.equal(r.exitCode, 0, `Expected exit 0 con variantes DRY+KISS+early-returns separadas; stdout=${r.stdout}`);
});
