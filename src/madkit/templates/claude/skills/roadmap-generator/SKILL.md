---
name: roadmap-generator
description: "Genera y revisa roadmap sprint/épica: tasks atómicas, DAG, waves paralelas. Activar con 'crear sprint', 'épica', 'roadmap', 'feature completa' o ≥4 funcionalidades en una solicitud. NO para tareas atómicas (→ task-planner)."
context: fork
agent: task-planner
effort: high
---

# Roadmap-Generator — Generación de Sprints/Épicas

> **Rol:** Descompone una solicitud épica en un sprint coherente (N tasks atómicas + DAG + waves) con revisión iterativa adversarial antes de emitir cualquier task. Output: `ai_docs/sprints/NN_*.md` + N task docs vinculados.

---

## Invocación

**Auto-activación desde main session únicamente.** Issue [#38719](https://github.com/anthropics/claude-code/issues/38719) impide que subagents invoquen Skill tool — si `task-planner` detecta una épica en Paso 0.4, **escala al usuario**.

| Activar cuando | NO activar cuando |
|---|---|
| Usuario pide "sprint/épica/roadmap/feature completa/iniciativa/milestone" | Tarea atómica (1-3 archivos) → `task-planner` directo |
| ≥4 funcionalidades independientes en una solicitud | Bugfix → `bugfix` skill |
| `/sprint <descripción>` | Operaciones git → `git-guardian` |

---

## Carga de contexto inicial

Antes de Fase A, leer en orden:

1. `ai_docs/STATE.md` (si existe) — breadcrumb del context-monitor hook.
2. `ai_docs/core/*.md` — documentación viva (master_idea, architecture, data_models).
3. `CLAUDE.md` del proyecto — convenciones, prohibiciones, stack.
4. `ai_docs/sprints/*.md` — sprints existentes (no sobreescribir; citar como `Depende de:` cruzado si aplica).
5. `ai_docs/tasks/` — listar para detectar el siguiente número de task disponible.
6. **Archivos de código de los módulos que el sprint modificará** — para cada módulo identificado en la solicitud del usuario:
   - Si el módulo tiene ≤5 archivos principales: leerlos directamente con `Read`.
   - Si el módulo tiene >5 archivos o el sprint cita >3 módulos distintos: delegar a `researcher` con scope preciso antes de continuar. No emitir el sprint doc hasta recibir el reporte.
   - **Regla de oro:** ningún símbolo de código (método, clase, path, variable) se cita en un task doc sin haberlo visto en el código real. Si el símbolo no aparece en ningún archivo leído → no citarlo; usar descripción funcional en su lugar.
   - Si el sprint es puramente documental o de configuración (sin tocar código fuente) → SKIP este punto, sin penalización.

---

## Adversarial Stance (Fase B)

**Asumo que el roadmap va a fallar** hasta que cada task tenga alcance disjunto verificable, dependencias declaradas y coverage del criterio del sprint que materializa.

No acepto: "Este sprint cubre auth completo" sin enumerar tasks · tasks que tocan los mismos archivos sin coordinación · coupling implícito sin `Depende de:` · "Edge cases se ven después" · métodos o clases citados por nombre sin haberlos visto en el código fuente · "el bug es X" sin evidencia en logs o código leído.

---

## Fase A.0 — Extracción de User Stories

**Propósito:** capturar el "qué" desde perspectiva de usuario antes del "cómo" técnico. Previene tasks sin trazabilidad a requisito de usuario y ACs vagos que plan-checker D1 bloquea en implementación.

**Skip (declarar en §1 del sprint doc):** input ya en formato de user stories, o sprint puramente técnico sin actor de usuario visible.

### A.0.1 — Extraer user stories del input

Para cada funcionalidad del input del usuario, emitir en formato:

    US-NN: Como [rol], quiero [acción observable], para [beneficio de negocio medible].
    Acceptance criteria:
    - El sistema DEBE <comportamiento observable y verificable>

Agrupar por módulo funcional. Emitir tabla en §1.5 del sprint doc:

| ID | User Story | Acceptance Criteria | Módulo |
|---|---|---|---|
| US-01 | Como [rol], quiero... | DEBE retornar... | [módulo] |

### A.0.2 — Validar ACs antes de continuar

Para cada user story: verificar que cada AC usa verbo EARS verificable (`DEBE`, `retorna`, `redirige`, `lanza`, `acepta`, `rechaza`) + resultado concreto. Story sin AC verificable → reformular antes de continuar.

### A.0.3 — Traza US → task

Al emitir cada task doc en Fase C, declarar en la sección "Objetivo" del task doc:
`Materializa: US-NN — <título de la user story>`

Esta traza permite a `roadmap-reviewer` D1 verificar cobertura bidireccional.

### A.0.4 — Preview y confirmación

Presentar tabla de user stories al usuario antes de Fase A. Esperar confirmación o correcciones. Una US puede expandirse a >1 task si sus ACs requieren módulos disjuntos — documentar en §"6. Reviews iterativas" del sprint doc.

---

## Fase A — Generación

**Input:** solicitud épica del usuario. **Output:** roadmap draft + N task IDs propuestos (no emitidos).

1. **Descomponer en N tasks atómicas** por módulos disjuntos. Si dos tasks tocan el mismo archivo: fusionar O declarar `Depende de:` explícito. Cada task es ESTÁNDAR+.

2. **Mapear dependencias (DAG):** task A crea artifact X → task B que lo importa tiene `Depende de: A`. Regla: producer → consumer, contrato → implementación.

3. **Asignar waves** con Kahn topological sort (mismo algoritmo que `task-planner` Paso 0.6):
   - Wave 1 = tasks sin dependencias.
   - Wave K+1 = tasks cuyas deps están todas en waves ≤ K.

4. **Detectar fases paralelas** (paralelización fractal). Para tasks COMPLEJA+ con ≥3 fases, emitir `parallelizable_phases:` proactivamente en `contract:` SOLO si **los 3 criterios** se cumplen simultáneamente para las fases candidatas a la misma wave interna:
   - **C1 — Archivos disjuntos verificados:** las fases de la wave interna candidata tocan archivos sin solape (verificado leyendo el Plan de Implementación).
   - **C2 — Sin dependencia lógica obligatoria:** ninguna fase espera output runtime de otra (no schema→migration, no producer→consumer, no contrato→implementación).
   - **C3 — Sin tests cross-fase:** ninguna fase de la wave incluye tests del código producido por otra fase de la misma wave interna.

   Si los 3 → emitir `parallelizable_phases: [[<fases_wave1>], ...]`. Si alguno NO → declarar serial `[[1], [2], [3], ...]` Y documentar la razón concreta de la serialización en el "Plan de Implementación" del task doc emitido (ej: "Fase 2 espera <símbolo concreto> producido en Fase 1"). NO emitir para tasks SIMPLE de 1 sola fase.

   **Refuerzo cross-task del roadmap:** al cierre de Fase A, evaluar si dos tasks de la misma wave externa del DAG podrían **fusionarse en una sola task con `parallelizable_phases:` interno** (cuando comparten archivos pero los cambios son segregables por fase) en lugar de declararlas como hermanas con `Depende de:`. Heurística de fusión: tasks ≤200 líneas cada una, scope altamente relacionado, archivos compartidos pero segregables por fase. Documentar la decisión (fusionar vs separar) en sección "6. Reviews iterativas" del sprint doc. Si NO comparten archivos: mantenerlas separadas en la misma wave del DAG (paralelizan a nivel implementer del orquestador, **un solo worktree con N implementers paralelos** — NO N worktrees separados salvo aislamiento explícito del usuario).

   Cuando tasks comparten archivos pero los cambios son segregables por fase, considerar fusión con `parallelizable_phases:` interno en vez de declarar `Depende de:` cruzado.

5. **Generar `ai_docs/sprints/NN_*.md`** con la estructura del §Estructura del archivo de sprint. NO emitir tasks aún.

6. **Preview al usuario:** roadmap draft + lista de tasks + waves esperadas.

---

## Fase B — Revisión iterativa adversarial (mín. 2 rondas, máx. 3)

**Bounded loop max 3** — Opus 4.7 produce ~35% más tokens que 4.6; 3 rondas son suficientes con rigor.

### 5 ejes de auditoría por ronda

| Eje | Qué buscar | Formato de hallazgo |
|---|---|---|
| Overlap | Dos tasks tocan el mismo archivo sin coordinación | `[Sprint Review K] Tasks X e Y modifican <archivo> sin Depende de: → fix: fusionar O declarar dep` |
| Coupling | Task A asume comportamiento que solo B introduce, sin dep declarada | `[Sprint Review K] Task X asume helper de Y sin Depende de: Y → fix: añadir dep` |
| Gap | Criterio del sprint sin task que lo materialice | `[Sprint Review K] Criterio "<criterio>" sin task → fix: añadir task NNN` |
| Edge case | Fallo a mitad de wave, rollback, concurrency, inputs vacíos en handoffs | `[Sprint Review K] ¿Qué pasa si task X falla? → fix: declarar rollback O riesgo aceptado` |
| Regression | Cambio rompe paths/funcionalidades no listadas en el sprint | `[Sprint Review K] Task X elimina <path> con consumer no declarado → fix: ampliar alcance O deprecar` |
| Factual Accuracy | Task cita path inexistente, método imaginado, o asunción técnica sin evidencia en código leído | `[Sprint Review K] Task X cita <símbolo> en <path> — verificar existencia con grep O sustituir por descripción funcional` |

### Criterio de salida

| Condición | Acción |
|---|---|
| Ronda con 0 fixes | CONVERGED → pasar a Fase C |
| Ronda 3 con fixes activos | Detener, emitir roadmap "as-is" + lista persistente de gaps; usuario decide |
| Mínimo 2 rondas siempre | Aunque ronda 1 reporte 0 fixes, ejecutar ronda 2 con foco en edge cases |

---

## Fase C — Emisión de task docs

**Solo si Fase B retornó CONVERGED.** Si ronda 3 con fixes activos, esperar decisión del usuario.

Para cada task del roadmap final, **`task-planner` (host fork de esta skill por `context: fork`) crea físicamente** `ai_docs/tasks/NNN_sNN_<descriptor>.md` (numeración global con padding 3 dígitos + sufijo de sprint con padding 2 dígitos) con:

- **Filename con sufijo `_sNN_`** derivado del sprint emitido (ej: sprint 04 → `145_s04_implement_oauth.md`). El sufijo es validado mecánicamente por `task-doc-validator.js` (mismatch contra cabecera `> **Sprint:**` es BLOCKER `SPRINT_SUFFIX_MISMATCH`).
- Cabecera blockquote: `> **Sprint:** NN`, `> **Depende de:** ...` (si aplica), `> **Asunciones:** ...` (si aplica).
- Plantilla del stack detectado o `task_template.md` genérico.
- Bloque `contract:` con `task_id`, `complexity`, `depends_on`, `forecast` , `wiring`, `parallelizable_phases:` si aplica.

**Emisión paralela:** tasks sin archivos compartidos → DEBES lanzar N forks de `task-planner`, donde N = número de tasks de la wave actual cuyos `files_touched:` son disjuntos (sin solape entre paths). Si todos los files_touched están solapados, fusionar en una sola task con `parallelizable_phases:` interno (ver Fase A). Lanzar en una sola respuesta. Tasks con deps entre sí → emitir secuencialmente para que `Depende de:` apunte a IDs ya creados. **NUNCA delegar la emisión a `implementer` u otro agente** — rompe trazabilidad, salta plantilla por stack, viola la regla canónica de "Responsabilidad de creación de task docs" en `CLAUDE.md` del proyecto (sección "Cuándo delegar").

**Validación post-emisión paralela:** tras emitir N task docs de una wave, lanzar `plan-checker × N` en paralelo (skill `context: fork` → reviewer) en una sola respuesta del orquestador. Cada plan-checker valida 10 dimensiones D1-D10 sobre su task doc específico. BLOCKED → reabrir solo esa task (bounded loop max 2 reaperturas por task; 3ª escala al usuario). Regla canónica: sección "Paralelización de auditoría/revisión" en `CLAUDE.md` del proyecto.

---

## Fase D — Sincronización inicial

1. Actualizar `ai_docs/sprints/NN_*.md` con la tabla final (IDs reales) y el DAG Mermaid (relaciones del `contract:` de cada task).
2. Estado del sprint: `ABIERTA`. Timestamp de apertura.
3. Si hook `sprint-sync.js` desplegado, las próximas escrituras validarán bidireccionalidad mecánica.
4. Emitir en el output: `[ROADMAP-GENERATOR COMPLETE] Sprint NN · M tasks · K waves. NEXT: invocar \`roadmap-reviewer\` en la sesión principal antes de Wave 1.` — esta skill no puede invocar `roadmap-reviewer` desde este fork (limitación #38719); la sesión principal es el punto de invocación obligatorio.

---

## Estructura del archivo de sprint

`ai_docs/sprints/NN_*.md` — máx. 400 líneas. Si excede, proponer subdividir.

Secciones requeridas:
- `## 1. Visión y motivación` — qué problema cierra, outcome cuantificable.
- `## 2. Alcance del sprint` — Incluye / No incluye / Asunciones declaradas.
- `## 3. Tabla de tasks` — ID · Título · Estado · Wave · Depende de.
- `## 4. DAG (Mermaid)` — grafo `graph LR`.
- `## 5. Waves de ejecución` — lista de waves con IDs y si son paralelas.
- `## 6. Reviews iterativas` — una sub-sección por ronda con los 5 ejes + Decisión.
- `## 7. Lifecycle del sprint` — Apertura / Cierre estimado / Cierre real.

Cabecera blockquote: `> **Estado:** ABIERTA | EN_PROGRESO | COMPLETADA` · `> **Creado:** YYYY-MM-DD` · `> **Tasks:** N total · X completadas · Y en progreso`.

---

## Regla canónica de scope

- El sprint doc es un **ÍNDICE**: lista las tasks del sprint, el DAG y las waves. No es fuente de verdad del scope individual de cada task.
- El task doc es la **FUENTE DE VERDAD** del scope de cada task: criterios de éxito, alcance, `contract:`.
- Si sprint doc y task doc describen el mismo scope de forma divergente: **task doc gana**. El sprint doc debe actualizarse para reflejar la descripción correcta.
- Esta regla es aplicada semánticamente por `plan-checker` D7 paso 5 (WARNING si divergencia detectada) y mecánicamente por `sprint-sync` (overlap en `files_touched:`).

---

## Fase E — Modo extender (opt-in, `mode: extend`)

**Trigger:** invocación explícita con `mode: extend` + `sprint_id: NN` + descripción de tasks a añadir. **NO se auto-activa por descripción del input** — requiere declaración explícita o comando `/sprint extend NN <descripción>`.

### Precondiciones

1. Leer `ai_docs/sprints/NN_*.md`. Si no existe → abortar con error claro.
2. Leer estado del sprint:
   - `ABIERTA` o `EN_PROGRESO` → continuar.
   - `COMPLETADA` → **ABORTAR**: "No se puede extender sprint cerrado. Para añadir trabajo relacionado, crear sprint nuevo con `Depende de:` cruzados si las tasks nuevas dependen de las completadas."

### E.1 — Revisión parcial adversarial (bounded loop max 1 reapertura)

El contexto del sprint ya fue validado en su creación (a diferencia de CREATE con max 3 rondas). Foco específico de esta Fase B parcial:

| Eje | Qué buscar |
|---|---|
| Overlap | Tasks nuevas vs tasks existentes del sprint que tocan los mismos archivos. Si `files_touched:` declarado en ambas: comparar listas. Si overlap → **BLOCKER antes de emitir task docs**. |
| Coupling | Tasks nuevas asumen comportamiento que aún no existe en tasks del sprint. Si hay asunción implícita → declarar `Depende de:` explícito. |
| Gap | Descripción de la extensión sin task que la materialice completamente. |

**Si tasks nuevas tienen `files_touched:` overlap con tasks existentes del sprint → BLOCKER antes de emitir.** Esta es validación semántica; el hook `sprint-sync` hace la validación mecánica.

**Si tasks existentes del sprint no declaran `files_touched:` → emitir WARNING**: "N tasks del sprint sin `files_touched:` — overlap check incompleto. Considerar añadir `files_touched:` al bloque `contract:` de las tasks existentes." NO bloquear — el campo es opcional retroactivamente.

### E.2 — Emisión de tasks nuevas

Solo si la revisión parcial retorna CONVERGED (o max 1 reapertura agotado sin convergencia + decisión del usuario):

- **`task-planner` (host fork de esta skill) crea físicamente** `ai_docs/tasks/NNN_sNN_<descriptor>.md` con sufijo `_sNN_` derivado del sprint extendido y cabeceras:
  - `> **Sprint:** NN`
  - `> **Wave:** W+1` donde W = última wave en ejecución o declarada en el sprint.
  - `> **Depende de:** ...` si aplica (puede depender de tasks de la wave W o anteriores).
- Si sprint está EN_PROGRESO con wave W ya ejecutada: las tasks nuevas se asignan a wave W+1. **NO renumerar waves completadas.**

### E.3 — Actualización del sprint doc

Tras emitir las tasks nuevas:

1. Añadir filas a "3. Tabla de tasks" con los IDs reales.
2. Actualizar "4. DAG (Mermaid)" con las aristas nuevas.
3. Añadir wave(s) nueva(s) a "5. Waves de ejecución".
4. Actualizar cabecera: `> **Tasks:** N+M total · X completadas · Y en progreso`.
5. Anunciar al usuario: Nº tasks añadidas, nueva wave asignada, DAG actualizado.

---

## Reglas operativas

| Regla | Detalle |
|---|---|
| NO emitir tasks hasta CONVERGED | Fase C solo tras Fase B con criterio de salida cumplido (o decisión explícita del usuario tras ronda 3) |
| NO modificar tasks ya emitidas en sprints anteriores | Sprints nuevos citan en `Depende de:`, no reeditan |
| NO sobreescribir sprint existente | Si `ai_docs/sprints/NN_*.md` ya existe → abortar y avisar |
| NO crear sub-sprints (anidamiento) | >30 tasks → partir en 2+ sprints con `Depende de:` cruzados |
| NO renumerar tasks de sprints anteriores | Tasks son inmutables tras emitidas |
| NO hardcodear número de sprint | Detectar max(NN)+1 leyendo `ai_docs/sprints/` |

---

## Anti-patterns

- ❌ Generar tasks sin DAG (dependencias implícitas → implementer descubre couplings tarde).
- ❌ Saltar Fase B por velocidad (la revisión iterativa diferencia un sprint coherente de un dump de tasks).
- ❌ Tasks vagas sin criterios verificables ("implementar X", "actualizar Y").
- ❌ Usar la skill para una tarea atómica (1-3 archivos) — eso es `task-planner` directo.
- ❌ Auto-activar Fase E por descripción del input — solo activar con `mode: extend` declarado explícitamente o comando `/sprint extend NN <descripción>`.
- ❌ Invocar Fase E mientras otra sesión está ejecutando Fase B de CREATE sobre el mismo sprint — se asume invocación serializada por el usuario. La concurrencia de fases no está soportada.

---

## Encadenamiento esperado

**Encadenamiento:** Ver "Encadenamiento canónico" en `CLAUDE.md` del proyecto. Mi rol específico: descomposición de épicas (Fase A descomposición + Fase B revisión adversarial + Fase C emisión task docs + Fase D sync sprint doc + Fase E extend opcional).
