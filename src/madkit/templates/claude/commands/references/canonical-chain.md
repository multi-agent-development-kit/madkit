# Encadenamiento canónico de subagents

> Citado desde: `CLAUDE.md` §"Cuándo delegar". Single source of truth del flujo subagent→subagent. Cada subagent y skill cita este archivo sin reescribirlo.

## Flujo principal

```
usuario → task-planner (triaje, waves DAG)
  → plan-checker × N por wave del DAG (paralelo; fork → reviewer Opus; gate adversarial 10 dim)
    GO → implementer × N (paralelo si módulos disjuntos o parallelizable_phases internas)
         → reviewer × 1 (Opus, correlacionado, NUNCA fragmentar)
         → doc-syncer (sonnet, sync ai_docs/core/ + verdict 1:1 criterios)
         → git-guardian (haiku, commit + opcionalmente PR)
    BLOCKED → task-planner reabre (max 2 reaperturas)
```

## Variantes

- **Sprint closure** → ver §Sprint closure más abajo.
- **Bugfix** → fork inicial reviewer (Opus, análisis causa raíz adversarial) → unit-testing → reviewer.
- **ADK** → adk-agent reemplaza task-planner en Wave 1 cuando la épica es agentes multi-tool.
- **Investigación pura** → researcher (sonnet, read-only) sin encadenamiento posterior.

## Sprint closure (al completar todas las waves del sprint)

```
[todas las waves completadas: plan-checker → implementer → reviewer × 1 por wave]
  → reviewer (Opus, un pase sobre el diff COMPLETO del sprint)
       Checklist:
       (a) Dead code cross-task: código de wave K que wave K+1 ya no usa
       (b) Integración: contratos entre módulos de distintas waves — incompatibilidades silenciosas
       (c) Oportunidades: patrones repetidos que merecen abstracción; deuda visible desde el sprint
       Output: informe CIERRE con sección "## Oportunidades futuras" para el backlog
  → doc-syncer (actualiza ai_docs/core/ + marca sprint COMPLETADO en sprint doc)
  → git-guardian (Sprint PR único agrupando todas las waves)
```

**Cómo invocar:** llamar directamente al subagent `reviewer` con el prompt:
`"Sprint closure review: diff completo del sprint. Checklist: (a) dead code cross-task, (b) incompatibilidades de integración entre waves, (c) oportunidades para el backlog."`

**Distinción con reviewer por wave:** el reviewer de wave revisa calidad de código de esa wave. El reviewer de sprint-closure revisa cohesión del sprint como unidad — no sustituye al de wave.

## Garantía de presencia

`setup_project` copia `CLAUDE.md.template` íntegro al raíz del proyecto destino antes de cualquier
invocación de subagents. Por tanto, esta sección (vía cita desde CLAUDE.md del proyecto) está
garantizada presente. Subagents que la citan no requieren fallback hard-coded.

---

## Reglas de encadenamiento

### Reglas positivas (DEBES)

- **plan-checker × N en paralelo por wave:** cuando el sprint despliega N tasks en wave K, lanzar N `plan-checker` en una sola respuesta. Tras todos GO → implementers.
- **implementer × N en paralelo:** si las N tasks/fases tienen archivos disjuntos verificados (sin solape, sin dep lógica).
- **reviewer × 1 correlacionado al cierre:** un solo pase sobre el diff completo de la wave/sprint. NUNCA fragmentar por áreas.
- **doc-syncer tras reviewer:** sincroniza `ai_docs/core/` y verifica criterios 1:1 contra task doc.
- **git-guardian al final:** orquesta commit + PR. Limpia `ai_docs/STATE.md` al cerrar el último commit del task.

### Reglas negativas (NUNCA)

- **NUNCA fragmentar reviewer por áreas funcionales:** pierde correlaciones cross-área (smell de seguridad puede coincidir con hueco de testing). Dividir por archivos sí; por áreas no.
- **NUNCA saltarse plan-checker antes de implementer:** el gate adversarial D1-D10 es la única barrera estructural contra implementación sobre asunciones incorrectas.
- **NUNCA crear task docs desde implementer u otros agentes:** solo `task-planner` (directo o vía fork desde `roadmap-generator`). Ver §"Responsabilidad de creación de task docs" en CLAUDE.md del proyecto.
- **NUNCA lanzar Agent Teams automáticamente:** los agentes pueden sugerirlo al usuario; la activación es manual (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`).

---

## Responsabilidades por subagent en el flujo

| Subagent | Entrada | Salida | Encadena a |
|---|---|---|---|
| `task-planner` | Solicitud del usuario | Task doc + contract | `plan-checker × N` |
| `plan-checker` | Task doc | GO / BLOCKED | `implementer × N` (si GO) / `task-planner` (si BLOCKED) |
| `implementer` | Task doc + contract | Diff implementado | `reviewer × 1` |
| `reviewer` | Diff completo | Veredicto OK / BLOCKER | `doc-syncer` (si OK) |
| `doc-syncer` | Diff + task doc + core/ | core/ actualizado + verdict 1:1 | `git-guardian` |
| `git-guardian` | Diff validado | Commit + PR opcional | — (cierre del flujo) |
| `reviewer` (sprint-closure) | Diff completo del sprint | Informe CIERRE + Oportunidades | `doc-syncer` |
