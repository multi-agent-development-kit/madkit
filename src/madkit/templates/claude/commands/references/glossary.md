# Glosario canónico de términos

> Citado desde: `CLAUDE.md` §"Glosario canónico". Single source of truth de la terminología del workflow.

Términos preferidos en task docs, sprint docs, commits y prosa de subagents/skills:

| Concepto | Término canónico | Evitar |
|---|---|---|
| Ejecución paralela de tasks en sprint | `wave` | "ola", "oleada", "fase" |
| Wave interna de fases de un task (`parallelizable_phases`) | `phase` (en código) / `fase interna` (en prosa ES) | "wave interna", "sub-wave" |
| Veredicto de plan-checker negativo | `BLOCKER` (nominal en criterios), `BLOCKED` (adjetivo en veredicto final) | mezclar contextos |
| Activar otro subagent | `delegar` (en prosa) / `fork` (cuando hay context fork) | "lanzar", "invocar", "encadenar" si no es transición |
| Encadenamiento secuencial de subagents | `encadenar a` | "lanzar después", "pasar a" |
| Documento de tarea | `task doc` (anglicismo aceptado) | "documento de tarea" salvo prosa narrativa |
| Documento de sprint | `sprint doc` | "documento de sprint" salvo prosa narrativa |
| Skill `plan-checker` | `plan-checker` (kebab-case literal) | "PlanChecker", "plan_checker" |

---

## Notas de aplicación

### BLOCKER vs BLOCKED

- `BLOCKER` es nominal: aparece en listas de criterios, severidades, output de dimensiones del plan-checker. Ejemplo: `D3 — BLOCKER: tamaño estimado supera umbral`.
- `BLOCKED` es adjetivo de veredicto final: aparece en la línea de conclusión del plan-checker. Ejemplo: `Veredicto: BLOCKED — D3 no supera gate`.
- Los dos conviven en el mismo archivo pero en contextos sintácticos distintos. No son intercambiables.

### wave vs fase interna

- `wave` refiere siempre a un grupo de tasks del DAG de sprint que pueden ejecutarse en paralelo (topological sort de `Depende de:`).
- `fase interna` (o `phase` en código) refiere a divisiones dentro de una sola task declaradas en `contract.parallelizable_phases:`.
- Usar "fase" sin calificativo es ambiguo: puede confundirse con "Wave del sprint" o con "fase del plan de implementación". Calificar siempre.

### delegar vs fork vs encadenar

- `delegar a <subagent>`: el agente padre pide al subagent que asuma la responsabilidad. El padre espera el resumen comprimido.
- `fork a <subagent>`: mecanismo técnico de `context: fork` en skills — sesión aislada con modelo propio. Subconjunto de "delegar".
- `encadenar a <subagent>`: el agente actual transfiere el output como input directo del siguiente sin intervención del usuario.
- Si la transición es técnicamente un fork (skill con `context: fork` + `agent:`), preferir "fork" sobre "delegar" en prosa técnica.

---

## Aplicación por archivo

| Tipo de archivo | Términos más frecuentes | Verificar |
|---|---|---|
| `task doc` (`.md` en `ai_docs/tasks/`) | `wave`, `BLOCKER`, `task doc`, `plan-checker` | `grep -E "ola\b\|oleada\b\|plan_checker"` → cero hits |
| `sprint doc` (`.md` en `ai_docs/sprints/`) | `wave`, `sprint doc`, `BLOCKER` | Mismo grep |
| Frontmatter de skills y agents (`.md`) | `fork`, `delegar`, `plan-checker` | `grep "plan_checker\|PlanChecker"` → cero hits |
| Commits y PR bodies | formato `T<NNN>`, `Sprint <NN>`, `Wave <W>` | Scaffolding guard valida el formato |
