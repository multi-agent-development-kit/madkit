---
name: roadmap-reviewer
description: "Gate estratégico pre-ejecución de sprints. Activar DESPUÉS de roadmap-generator y ANTES de distribuir implementers. Revisa el sprint como unidad: cobertura de requisitos, DAG de waves, alcance realista, criterios de éxito a nivel sprint. NUNCA para revisar implementación de código (→ reviewer)."
context: fork
agent: reviewer
effort: high
---

# Revisión Estratégica de Roadmap

Gate adversarial pre-ejecución. Revisa el sprint/roadmap como unidad antes de que los implementers entren en escena. Una revisión de roadmap deficiente genera tasks incorrectas, waves mal secuenciadas y retrabajo costoso. El costo de este gate es bajo comparado con el de corregir N implementers a mitad de sprint.

---

## Input requerido

Leer antes de comenzar:

| Artefacto | Ruta | Por qué |
|---|---|---|
| Sprint doc | `ai_docs/sprints/sNN_<nombre>.md` | Unidad de revisión principal |
| Todos los task docs del sprint | `ai_docs/tasks/*_sNN_*.md` | Detalle de cada task |
| `ai_docs/core/master_idea.md` | Si existe | Requisitos originales vs. cobertura del sprint |
| `ai_docs/core/architecture.md` | Si existe | Contratos arquitectónicos que el sprint debe respetar |
| `CLAUDE.md` del proyecto | Siempre | Convenciones, prohibiciones, stack |

---

## Dimensiones de revisión (D1-D10)

Ejecutar en orden. Emitir veredicto por dimensión antes de pasar a la siguiente.

### D1 — Cobertura de requisitos

¿Todas las funcionalidades / user stories / acceptance criteria del sprint (declaradas en sprint doc §Objetivo) tienen al menos una task asignada?

- Verificar: para cada requisito declarado en sprint doc §Objetivo, al menos 1 task lo cubre explícitamente en su "Objetivo" o "Criterios de Éxito"
- **BLOCKED si:** requisito declarado sin task que lo cubra
- **WARN si:** task cubre requisito implícitamente (sin cita directa)

**Sub-check D1-US** (solo si sprint doc tiene sección `## 1.5 User Stories` o `## User Stories`):
- Verificar: cada US del sprint doc tiene ≥1 task con `Materializa: US-NN — <título>` en su "Objetivo" o cabecera.
- **WARN si:** US sin task que la materialice: `[D1-US] US-NN sin task que la materialice`
- **WARN si:** task con `Materializa:` que referencia US inexistente en sprint doc: `[D1-US] Task NNN referencia US-NN no declarada`
- SKIP silencioso si el sprint doc no tiene sección de user stories.

### D2 — Atomicidad de tasks

¿Cada task del sprint es realmente atómica o hay épicas disfrazadas?

- Verificar: `forecast.max_lines ≤ 400` por task (si declarado en `contract:`). Si supera, verificar que tiene `Depende de:` con sub-tasks.
- Verificar: task COMPLEJA/CRÍTICA sin `contract.parallelizable_phases:` declarado cuando el plan tiene ≥2 fases ejecutables en paralelo → WARN
- **BLOCKED si:** task única con forecast >800 líneas sin sub-tasks ni split declarado

### D3 — Coherencia del DAG

¿Las dependencias declaradas (`Depende de:`) son correctas y no hay dependencias ocultas?

- Verificar: para cada par de tasks en paralelo (misma wave), sus `contract.files_touched` son disjuntos
- Verificar: ausencia de ciclos en el grafo de dependencias
- Verificar: no hay forward references (task N depende de task M donde M > N y M no está en wave anterior)
- **BLOCKED si:** overlap de `files_touched` entre tasks de la misma wave sin dependencia declarada, o ciclo detectado

**Sub-check D3-Factual (WARN):** ¿Citan las tasks del sprint métodos, clases o paths de código específicos sin evidencia de que fueron verificados contra el código fuente? Para cada task del sprint que declare en sus "Criterios de Éxito" o "Plan de Implementación" símbolos concretos de código (nombres de funciones, clases, rutas de archivo), verificar que el task doc o el sprint doc registra evidencia de lectura previa del código (ej: sección "Investigación previa", bloque `> **Asunciones:** Paths verificados por researcher`). Si ninguna task con referencias de código tiene dicha evidencia → **WARN**: `[D3-Factual] Sprint diseñado sin researcher previo verificable — riesgo de APIs o paths imaginados. Recomendación: ejecutar researcher sobre los módulos afectados antes de delegar a implementer`. SKIP silencioso si las tasks son puramente documentales o de configuración.

### D4 — Secuenciación de waves

¿El orden de waves es lógico? ¿Wave N+1 no asume artefactos que Wave N aún no produce?

- Verificar: para cada dependencia entre tasks de waves distintas (task B en Wave 2 depende de task A en Wave 1), la task A produce el artefacto que B necesita (verificable en `contract.wiring`)
- Verificar: `Wave 1` no depende de ninguna otra wave
- **BLOCKED si:** Wave N+1 referencia artefacto que no existe hasta Wave N+2 o posterior

### D5 — Alcance realista

¿El forecast total del sprint es alcanzable? ¿Hay inconsistencias entre complejidad declarada y forecast?

- Sumar `forecast.max_lines` de todas las tasks. Sprint >5000 líneas totales → WARN de riesgo de sub-estimación.
- Verificar coherencia: task declarada SIMPLE con forecast >100 líneas → inconsistencia, WARN
- Verificar coherencia: task declarada COMPLEJA con forecast <50 líneas → inconsistencia, WARN
- **BLOCKED si:** task con `complexity: simple` pero `forecast.max > 400` (debería ser COMPLEJA)

### D6 — Criterios de éxito a nivel sprint

¿El sprint doc declara criterios de éxito verificables para el sprint como unidad (no solo para tasks individuales)?

- Verificar: sprint doc tiene sección `## Criterios de Éxito del Sprint` con ≥3 criterios verificables (grep-ables o con comando de verificación)
- Verificar: criterios de éxito del sprint son distintos de los de las tasks individuales (nivel de abstracción mayor)
- **BLOCKED si:** sprint doc carece completamente de criterios de éxito a nivel sprint

### D7 — Riesgos de integración entre waves

¿Hay riesgos de integración entre tasks de waves distintas que no estén declarados como dependencias?

- Para cada par (Task A en Wave N, Task B en Wave N+1): si A modifica una interfaz/schema que B consume, ¿está declarado como dependencia?
- Verificar: cambios en APIs, schemas de BD, o contratos de módulos en Wave N tienen tasks receptoras en Wave N+1 o posterior
- **BLOCKED si:** Wave N modifica interfaz consumida por Wave N+1 sin dependencia declarada

### D8 — Completitud de contratos

¿Las tasks con `contract:` YAML declaran todos los campos necesarios?

- Verificar: tasks COMPLEJA/CRÍTICA tienen `contract:` con al menos: `task_id`, `complexity`, `depends_on`, `forecast`, `files_touched`, `produced_by`, `consumed_by`
- Verificar: `files_touched` no está vacío para tasks que crean o modifican archivos
- Verificar: `wiring` presente si task crea artefactos nuevos (hook, skill, agent, command)
- **BLOCKED si:** task COMPLEJA/CRÍTICA sin `contract:` o con `files_touched: []` y la task claramente modifica archivos

### D9 — Coherencia de naming y stack

¿Todas las tasks del sprint usan las convenciones correctas para el stack detectado?

- Verificar: filenames siguen la convención del stack (camelCase/snake_case/UPPER_SNAKE_CASE según §3.3 CLAUDE.md)
- Verificar: tasks con `> **Sprint:** NN` tienen sufijo `_sNN_` en filename (coherencia task-doc-validator)
- Verificar: si el sprint es multi-stack, las interfaces entre stacks están documentadas en al menos 1 task
- **WARN si:** filename no sigue convención; **BLOCKED si:** `> **Sprint:** NN` declarado pero sufijo `_sNN_` ausente

### D10 — Criterios de Calidad de Ingeniería en tasks de código

¿Todas las tasks que tocan código ejecutable tienen los 4 Criterios de Calidad de Ingeniería canónicos?

- Verificar: task con `files_touched` de extensión ejecutable (`.js/.ts/.py/.php/.sh/.ps1`) tiene sub-sección "Criterios de Calidad de Ingeniería (canónicos)" con los 4 checkboxes, O declara excepción explícita
- **BLOCKED si:** task toca código ejecutable sin los 4 criterios y sin excepción declarada

---

## Formato de reporte

```
## Revisión de Roadmap — Sprint NN: [nombre]

**Tasks revisadas:** N
**Waves:** W
**Forecast total:** MIN-MAX líneas

### BLOCKED (el sprint no puede ejecutarse hasta resolver)
- [D#] [task NNN o sprint doc] descripción → fix requerido

### WARN (riesgo identificado, no bloquea pero debe documentarse)
- [D#] descripción → mitigación sugerida

### OK
- [N] dimensiones sin hallazgos

### Veredicto
GO — proceder con Wave 1
BLOCKED — [N] issues críticos a resolver antes de ejecutar
```

---

## Reglas

- **Revisar el sprint como unidad**, no task a task de forma aislada — las correlaciones entre tasks son el valor diferencial de este gate vs. plan-checker individual
- **NO revisar calidad de código** ni implementación — eso es scope del `reviewer` post-impl
- **NO revisar estructura del task doc** (eso es `plan-checker` y `task-doc-validator`) — solo semántica estratégica
- **BLOCKED implica parar la ejecución del sprint** — task-planner no distribuye implementers hasta que todos los BLOCKED se resuelven
- **WARN no bloquea** — el orquestador puede proceder documentando el riesgo aceptado en el sprint doc

---

## Simbiótico con task-implementation-review + reviewer

| Gate | Cuándo | Qué revisa | Output |
|---|---|---|---|
| `roadmap-reviewer` (esta skill) | Post `roadmap-generator`, pre Wave 1 | Sprint como unidad: coherencia estratégica, DAG, cobertura | GO / BLOCKED sprint |
| `plan-checker` × N | Pre `implementer`, por task | Task doc individual: 10 dimensiones semánticas | GO / BLOCKED task |
| `task-implementation-review` | Post `implementer`, por task | Criterios específicos de la task contra el diff | PASS / FAIL task |
| `reviewer` (Opus) | Post todo lo anterior | Implementación completa: code smells, seguridad, testing | APROBAR / CORREGIR |

Sin `roadmap-reviewer`: el sistema ejecuta sprints con gaps estratégicos no detectados hasta que el `reviewer` post-impl los encuentra — demasiado tarde y costoso. Con `roadmap-reviewer`: los gaps se detectan antes de que el primer implementer escriba una línea.
