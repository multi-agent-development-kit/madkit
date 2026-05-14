# /project_alignment — Diagnóstico y Alineación del Proyecto

> Analiza el estado del proyecto detectando inconsistencias entre commits, documentación y sprints. Formula preguntas de alineación y ofrece recomendaciones priorizadas.

---

## Fase 1: Recolección de contexto

Leer en este orden. Si hay >5 archivos a correlacionar simultáneamente, delegar a `researcher` con prompt comprimido; de lo contrario, leer directo.

### 1.1 Documentación core

```bash
# Leer todos los docs canónicos presentes
```
- `ai_docs/core/master_idea.md` — visión, problema, MVP, scope negativo
- `ai_docs/core/architecture.md` — capas, contratos, stack
- `ai_docs/core/decisions.md` — ADRs (si existe)
- `CLAUDE.md` — convenciones, routing, prohibiciones

Si alguno no existe, registrarlo como GAP. No abortar.

### 1.2 Historial reciente

```bash
git log --oneline -50
git status --short
git diff --stat HEAD~5..HEAD
```

Extraer patrones:
- Tipos de commits predominantes (`fix`, `update`, `create`, etc.)
- Frecuencia de cambios por área (`src/`, `ai_docs/`, `claude-templates/`, etc.)
- Presencia de commits de tipo "wip", "temp", "fixup" o sin formato válido

### 1.3 Tasks activas y recientes

```bash
# Glob ai_docs/tasks/*.md — ordenar por mtime, tomar los 10 últimos
```

Para cada task leída, extraer: `status`, `complexity`, `lifecycle`, fecha de creación vs `started_at`.

Señales de alerta:
- Task con `status: in_progress` sin commits relacionados en los últimos 5 días
- Task con `status: completada` pero sin commit de cierre en git log
- Tasks con IDs consecutivos pero estado inconsistente (gap en numeración)

### 1.4 Sprints (si existen)

```bash
# Glob ai_docs/sprints/*.md
```

Si no hay sprints → registrar y saltar esta sub-fase.

Para cada sprint: estado (`ABIERTA|EN_PROGRESO|COMPLETADA`), tasks declaradas vs tasks que existen en `ai_docs/tasks/`, waves completadas.

---

## Fase 2: Detección de inconsistencias

Correlacionar los datos de Fase 1 en estas categorías. Formato de hallazgo: `[CAT] descripción breve — evidencia citable (archivo:línea o commit SHA)`.

| Categoría | Qué buscar |
|---|---|
| **DRIFT** | `master_idea.md` o `architecture.md` describen algo que el código/commits contradicen o que ya no existe |
| **ORPHAN** | Commits sin task asociada · Tasks sin commits relacionados |
| **STALE** | Tasks `in_progress` sin actividad >7 días · Sprints `EN_PROGRESO` con waves bloqueadas |
| **GAP** | Docs core ausentes (`master_idea`, `architecture`) · Tasks referenciadas en commits que no existen |
| **FORMAT** | Commits sin tipo válido · Tasks sin `completed_at` pese a estar cerradas |
| **DEBT** | Patrones de `fix:` recurrentes en el mismo área (indica raíz no resuelta) · `TODO`/`FIXME` en commits recientes |

Clasificar cada hallazgo por severidad:
- **CRÍTICO** — bloquea desarrollo o implica pérdida de trazabilidad
- **IMPORTANTE** — afecta calidad pero no bloquea
- **INFORMATIVO** — inconsistencia menor, buena práctica a adoptar

---

## Fase 3: Preguntas de alineación

**Protocolo:** una pregunta por turno, cerrada (opción A / opción B), solo si la respuesta cambia materialmente las recomendaciones de Fase 4. Máximo 3 preguntas en total por sesión. No interrogar — orientar.

Preguntar solo si alguna de estas condiciones aplica:

1. **Pivot de visión:** `master_idea.md` describe un producto pero los últimos 20 commits apuntan a un área distinta → preguntar si el scope cambió.
2. **Deuda vs feature:** hay >3 hallazgos DEBT en la misma área → preguntar si el usuario prefiere abordarla antes de nuevas features.
3. **Sprint abandonado:** hay sprint `EN_PROGRESO` con >14 días sin commits → preguntar si se continúa o se cierra formalmente.

Formato de pregunta:
```
[ALINEACIÓN] {1 frase contextualizando el hallazgo}
¿Es {opción A} o {opción B}?
```

---

## Fase 4: Recomendaciones

Emitir **después** de recibir las respuestas de Fase 3 (o directamente si no hubo preguntas).

Estructurar en 3 categorías, ordenadas por urgencia:

### A — Acciones inmediatas (esta semana)

Para hallazgos CRÍTICOS e IMPORTANTES detectados en Fase 2. Cada acción:
- Qué hacer exactamente
- Qué comando/slash command usar
- Criterio de "hecho"

### B — Deuda técnica priorizad

Para patrones DEBT y hallazgos STALE. Proponer como tasks atómicas numeradas:
```
Deuda técnica sugerida:
- [TNNN] {título}: {descripción en 1 línea} — Complejidad estimada: SIMPLE|ESTÁNDAR
```

### C — Oportunidades de desarrollo

Basado en `master_idea.md` (visión y MVP pendiente) y en el estado de los sprints:
- Features que el estado actual del proyecto ya habilitaría implementar
- Mejoras de escalabilidad detectadas en `architecture.md` aún no abordadas
- Integraciones o automatizaciones que reducirían fricciones recurrentes (detectadas en DEBT/FORMAT)

**Formato de cada oportunidad:**
```
[OPP] {nombre corto}: {descripción en 1-2 frases}. Valor estimado: ALTO|MEDIO|BAJO.
Skill/agente sugerido para implementar: {nombre}.
```

---

## Reglas de ejecución

1. **Sin paralizar al usuario** — si hay 20 hallazgos, agrupar por categoría y mostrar los 3 más críticos primero. El resto en una sección "Ver también".
2. **Evidencia citable siempre** — cada hallazgo tiene un `archivo:línea` o SHA de commit.
3. **No modificar nada** — este comando es read-only. Si el usuario acepta una recomendación, delegar a `task-planner` (nueva task) o al skill/agente apropiado.
4. **Degradación graceful:** proyecto sin `ai_docs/` → informar estado "pre-bootstrap" y sugerir `/setup_project`. Proyecto sin sprints → omitir Fase 1.4 y 4C sprint-related.
