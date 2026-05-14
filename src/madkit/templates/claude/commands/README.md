# Slash commands de claude-templates

> Categorización mental de los 5 slash commands canónicos + familia de skills relacionadas. **Los nombres físicos de archivo NO cambian** — el namespacing es organizativo. Las plantillas por stack viven en `references/` y las carga `task-planner` automáticamente — NO son slash commands invocables.

---

## Familia `proyecto` — gestión del framework y del proyecto destino

Setup y sincronización del framework de templates en un proyecto.

| Slash | Para qué |
|---|---|
| `/setup_project` | Bootstrap completo (Fase 1 mecánica + Fases 0/2/3/4/5 analíticas): estructura `ai_docs/`, copia `CLAUDE.md.template`, scaffolding, reconocimiento, inventario calidad de docs core, drift, reporte. |
| `/sync-upstream-trigger` | Post-sync inmediato: activa hooks nuevos en `config.json`, elimina archivos `[LOCAL]`, verifica bidireccionalidad sprint-sync, emite resumen. Invocado por `scripts/sync_templates.{ps1,sh}` en Sesión 1/4. |

**Skills auto-activables de la familia `proyecto`**:

| Skill | Trigger | Para qué |
|---|---|---|
| `calibrate-templates` | Usuario menciona "calibrar templates" o post-setup_project | Adapta los templates al stack del proyecto. Auto-detecta INCREMENTAL (post-sync) o FULL-PASS. Fork → `task-planner` (xhigh). |
| `testing-setup` | Usuario menciona "configurar tests" o proyecto sin framework testing | Setup inicial del framework de tests (pytest / jest / phpunit / etc.) según stack detectado. Fork → `implementer` (high). |

---

## Familia `tarea` — flujo de trabajo principal

Crear, planificar y documentar tareas. Incluye templates por stack que heredan del template base.

| Slash | Para qué |
|---|---|
| `/create_task` | Delegador 1-párrafo a `task-planner` subagent (solo `task-planner` crea task docs). |
| `/task_template` | Plantilla genérica fallback (Web/JavaScript) o uso manual sin task-planner. Convención: `XXX_camelCaseName.md`. |
| `/adk_orchestrator_template` | Diseño multi-turno de orquestador ADK con auditoría exhaustiva pre-fase 0 (validación contra falsos positivos y asunciones erróneas). Genera `DESIGN_*.md`. Permanece como command porque su flujo interactivo es incompatible con `context: fork`. |

**Skills auto-activables de la familia `tarea`**:

| Skill | Trigger | Para qué |
|---|---|---|
| `create-skill` | Usuario pide "crear skill nueva", "añadir skill X" | Asistente para crear nuevas skills (`.claude/skills/<nombre>/SKILL.md`). |

### References (cargadas por task-planner según stack detectado, NO son slash commands)

| Reference | Stack | Convención naming |
|---|---|---|
| `references/task_template_typescript.md` | TypeScript/Next.js | `XXX_camelCaseName.md` |
| `references/task_template_python.md` | Python | `XXX_snake_case_name.md` |
| `references/task_template_django.md` | Django | `XXX_snake_case_name.md` |
| `references/task_template_php.md` | PHP | `XXX_camelCaseName.md` |
| `references/task_template_adk.md` | Google ADK | `XXX_UPPER_SNAKE_CASE.md` |
| `references/task_template_wordpress.md` | WordPress | `XXX_camelCaseName.md` |

---

## Familia `épica/sprint` — roadmaps y descomposición de épicas

Entry point para épicas multi-task. Genera sprints con waves del DAG y task docs vinculados vía `roadmap-generator` skill.

| Slash | Para qué |
|---|---|
| `/sprint <descripción>` | Genera (CREATE) o extiende (EXTEND) un sprint. Activa `roadmap-generator` (fork → `task-planner`, effort: high) para descomposición adversarial + emisión de task docs. Sub-comandos: `LIST`, `SHOW NN`. |

---

## Familia `git` — operaciones git

Las operaciones git **no son slash commands en este folder** — son **skills** auto-activables. Documentadas aquí solo para coherencia mental con las otras dos familias.

| Skill | Para qué |
|---|---|
| `commit` | Commit git con scaffolding guard + format `<type>: <subject>` (skill, no slash) |
| `pr` | Revisión y creación de PRs con sub-flow stacking (skill, no slash) |
| `diff` | Análisis de diff (skill, no slash) |
| `worktree-management` | Setup y cleanup de git worktrees (skill, no slash) |

---

## Por qué namespacing conceptual y no físico

Renombrar los archivos a `mad.proyecto.setup.md`, `mad.tarea.crear.md`, etc., requeriría:
- Mecanismo de aliases retrocompatibles que **Claude Code no soporta nativamente**.
- Update de cross-references entre templates (Reference Integrity §2.1 del CLAUDE.md raíz).
- Romper muscle memory de usuarios existentes.

El valor del namespacing es **discoverability mental**. Eso se logra con esta documentación organizada por familia. El autocompletado de Claude Code muestra los nombres actuales — el usuario los ve en su lista al escribir `/`.

Si en el futuro Claude Code añade soporte de aliases, evaluaremos renombrar.

---

## Por qué 3 operaciones viven como skills, no como commands

`calibrate-templates`, `testing-setup` y `create-skill` son skills auto-activables porque:
1. **Auto-activación contextual** — se disparan sin invocación explícita del usuario (proyecto sin tests, post-setup, etc.).
2. **Sesión aislada con modelo apropiado** — `calibrate-templates` usa `context: fork` + `task-planner` (xhigh) para razonamiento profundo sin contaminar el hilo del usuario.
3. **Commands canónicos: 5** — `setup_project`, `sync-upstream-trigger`, `create_task`, `task_template` y `adk_orchestrator_template` requieren invocación explícita del usuario como entry points de flujo. `sync-upstream-trigger` es command (no skill) porque el script lo invoca directamente con `claude -p "/sync-upstream-trigger"` para control total del pipeline. `adk_orchestrator_template` se mantiene como command porque su flujo multi-turno (auditoría → input/clarificación → diseño) es incompatible con `context: fork` (issue #17283 lo agrava — fork ignorado en invocación explícita).
