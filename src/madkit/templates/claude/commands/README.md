# Slash commands de claude-templates

> Categorización mental de los 14 slash commands en 3 familias para mejorar discoverability. **Los nombres físicos de archivo NO cambian** — el namespacing es organizativo.

---

## Familia `proyecto` — gestión del framework y del proyecto destino

Setup, sincronización y calibración del framework MAD en un proyecto.

| Slash | Para qué |
|---|---|
| `/setup_project` | Análisis profundo (Fases 0+2+3+4+5): reconocimiento, inventario calidad de docs core, drift, reporte. Tras `madkit iniciar` (que hace Fase 1 mecánica). |
| `/sync_upstream` | Wrapper de `madkit sincronizar`. Pull templates upstream + V1-V8 + report + decisión de calibrar. |
| `/calibrate_templates` | Adapta los templates al stack del proyecto. Auto-detecta INCREMENTAL (post-sync) o FULL-PASS. |
| `/testing_setup` | Setup inicial del framework de tests (pytest / jest / phpunit / etc.) según stack detectado. |

---

## Familia `tarea` — flujo de trabajo principal

Crear, planificar y documentar tareas. Incluye templates por stack que heredan del template base.

| Slash | Para qué |
|---|---|
| `/create_task` | Crea un task doc numerado (`ai_docs/tasks/NNN_*.md`) con triaje + alcance validado. Punto de entrada al ciclo de trabajo. |
| `/task_template` | Plantilla genérica fallback (Web/JavaScript). Convención: `XXX_camelCaseName.md`. |
| `/task_template_typescript` | Plantilla TypeScript/Next.js. Convención: `XXX_camelCaseName.md`. |
| `/task_template_python` | Plantilla Python. Convención: `XXX_snake_case_name.md`. |
| `/task_template_django` | Plantilla Django. Convención: `XXX_snake_case_name.md`. |
| `/task_template_php` | Plantilla PHP. Convención: `XXX_camelCaseName.md`. |
| `/task_template_adk` | Plantilla Google ADK. Convención: `XXX_UPPER_SNAKE_CASE.md`. |
| `/task_template_wordpress` | Plantilla WordPress. Convención: `XXX_camelCaseName.md`. |
| `/create_skill_template` | Asistente para crear nuevas skills (`claude-templates/skills/<nombre>/SKILL.md`). |
| `/adk_orchestrator_template` | Plantilla específica para orquestadores ADK (genera `DESIGN_*.md` por agente). |

---

## Familia `git` — operaciones git

Las operaciones git **no son slash commands en este folder** — son **skills** auto-activables. Documentadas aquí solo para coherencia mental con las otras dos familias.

| Skill | Para qué |
|---|---|
| `commit` | Commit git con scaffolding guard + format `<type>: <subject>` (skill, no slash) |
| `pr` | Revisión y creación de PRs con sub-flow stacking (T081) (skill, no slash) |
| `diff` | Análisis de diff (skill, no slash) |
| `worktree-management` | Setup y cleanup de git worktrees (skill, no slash) |

---

## Por qué namespacing conceptual y no físico

Renombrar los 14 archivos a `mad.proyecto.setup.md`, `mad.tarea.crear.md`, etc., requeriría:
- Mecanismo de aliases retrocompatibles que **Claude Code no soporta nativamente**.
- Update de ~30 cross-references entre templates (Reference Integrity §2.1 del CLAUDE.md raíz).
- Romper muscle memory de usuarios existentes.

El valor del namespacing es **discoverability mental**. Eso se logra con esta documentación organizada por familia. El autocompletado de Claude Code muestra los nombres actuales — el usuario los ve en su lista al escribir `/`.

Si en el futuro Claude Code añade soporte de aliases, evaluaremos renombrar.
