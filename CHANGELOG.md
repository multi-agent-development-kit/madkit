# Changelog

Todas las versiones notables se documentan aquí. Sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y [SemVer](https://semver.org/lang/es/).

## [0.1.4] — 2026-05-05

### Cambiado

- Sync automático tras tasks 086+087 del repo de gestión:
  - **T086 (namespacing conceptual `/mad.*`)**: nuevo `claude-templates/commands/README.md` (categorización de los 14 slash commands en 3 familias mentales `proyecto` / `tarea` / `git`); `CLAUDE.md.template` con bloque "Slash commands por familia" en sección de modelo.
  - **T087 (bloque `contract:` opcional)**: schema YAML estructurado al final de task docs para handoffs entre subagents — coexiste con cabeceras blockquote y sub-bullets actuales. `task_template.md` §20 con plantilla del bloque. `plan-checker/SKILL.md` Dimension 3 lee `contract.forecast.max_lines` con prioridad sobre el sub-bullet "Tamaño estimado". `task-agent.md` documenta cuándo emitir el bloque.
- 10 archivos sincronizados desde `claude-templates/`. Sin cambios al código del CLI — solo templates embebidos.

## [0.1.3] — 2026-05-05

### Añadido — Capa 3: adapters multi-IDE adicionales (task 088)

- **3 adapters nuevos** en `src/madkit/adapters/`:
  - `cline.py` (`ClineAdapter`): despliega `.clinerules` (markdown plano en raíz) + `.cline_compat/MADKIT_COMPATIBILITY.md`.
  - `continue_dev.py` (`ContinueAdapter`): despliega `.continue/config.yaml` con `systemMessage` derivado de `CLAUDE.md` + `.continue/MADKIT_COMPATIBILITY.md`.
  - `windsurf.py` (`WindsurfAdapter`): despliega `.windsurfrules` (markdown plano en raíz) + `.windsurf_compat/MADKIT_COMPATIBILITY.md`.
- Cada adapter implementa `IntegrationBase` con 4 features degradados documentados (subagents-with-model, hooks, context-fork, skills-auto-activation).
- `madkit iniciar . --ide={cline,continue,windsurf}` funciona end-to-end.
- `madkit iniciar . --ide=all` ahora despliega los **6 IDEs** (Claude Code + Cursor + Codex + Cline + Continue + Windsurf) coexistiendo.
- `madkit iniciar . --ide=auto` detecta `.clinerules`, `.continue/`, `.windsurfrules` correctamente.
- 6 keys nuevas en i18n con paridad ES/EN (3 copying + 3 next-step).
- `scripts/generate_adapters.py` extendido con 3 funciones nuevas que producen los templates desde `CLAUDE.md.template`.
- 23 tests nuevos (8 cline + 7 continue + 8 windsurf) — todos al 100% cobertura.

### Cambiado

- Detector heurístico (`adapters/detector.py`): regla refinada — Claude domina sobre AGENTS.md (informativo) pero combina como "mixed" con `.cursor/`, `.cline*`, `.continue/`, `.windsurfrules` (scaffolding ejecutable de otros IDEs).
- Total adapters: **3 → 6**. Total IDEs reconocidos por detector: 6 + mixed/unknown.
- 120 → **146 tests** verde (1 deselected: build wheel slow). Cobertura: **95%**, los 6 adapters al 100%.

## [0.1.2] — 2026-05-05

### Añadido

- **Agent `orientador`** (sonnet, effort medium) — primer agent de Capa 2 (task 085). Detecta el estado del proyecto y sugiere UN solo siguiente paso accionable cuando el usuario expresa duda sin pedir algo concreto. Activación natural ante "qué hago ahora", "estoy empezando", "no sé por dónde", "ayuda", "estoy perdido", "por dónde empiezo". Tools read-only. Output orientado a acción para usuarios no técnicos: ≤10 líneas, lenguaje sin jerga, una sola sugerencia de comando concreto (madkit iniciar / /setup_project / /task-creator / /status según el estado detectado).

### Cambiado

- Conteo de subagents desplegables: **7 → 8** (sonnet×3 → sonnet×4). Distribución actual: opus×3 (task-planner, reviewer, adk) + sonnet×4 (implementer, doc-syncer, researcher, orientador) + haiku×1 (git-guardian).
- Conteo de templates: **49 → 50** (14 commands + 27 skills + 8 agents + 1 CLAUDE.md.template).

## [0.1.1] — 2026-05-05

### Cambiado

- Primer sync automático desde el repo de gestión (workflow `sync_from_management.yml` con SSH deploy key configurado): los subdirectorios `templates/claude/{commands,agents,skills,hooks}/` ahora están poblados en el wheel con todos los templates reales (14 commands + 7 agents + 27 skills + 5 hooks). v0.1.0 solo embebía `CLAUDE.md.template`.
- `madkit iniciar --ide=claude` ahora despliega scaffolding Claude Code completo (no solo `CLAUDE.md`).

### Corregido

- `sync_from_management.yml` línea de clone usaba `gmoncor/AI-Coding-Resources` (sin sufijo); ahora correcto `gmoncor/AI-Coding-Resources-v2`.

## [0.1.0] — 2026-05-05

Primera release verificable end-to-end. Multi-IDE coverage en alpha pero
estable: Claude Code (experiencia óptima), Cursor (31 reglas técnicas auto-
activables + tabla de compat), Codex / GitHub Copilot (AGENTS.md consolidado).

### Añadido — Estructura del paquete y CLI

- Paquete Python `madkit` con typer + rich + platformdirs.
- 5 comandos: `iniciar`, `sincronizar`, `doctor`, `estado`, `listar-ides`.
- Aliases EN: `init`, `sync`, `status`, `list-ides`.
- i18n bilingüe ES/EN con paridad garantizada por test (40+ keys).
- Detector heurístico de IDE (claude / cursor / codex / mixed / unknown).
- Validators V1-V7 portados de `scripts/sync_templates.{ps1,sh}` (T073).
- Mensajes orientados a acción según task 082 §9.5.8.

### Añadido — Adapters

- **ClaudeAdapter**: despliega `.claude/{commands,agents,skills,hooks}/` + `CLAUDE.md` desde templates embebidos.
- **CursorAdapter**: despliega `.cursor/rules/` (filtrado a 31 reglas con `description:` no vacía) + `MADKIT_COMPATIBILITY.md` con tabla de features degradados.
- **CodexAdapter**: despliega `AGENTS.md` consolidado en raíz del proyecto.
- `IntegrationBase` interface común con `deploy() / detect() / degraded_features()`.

### Añadido — Scripts

- `scripts/generate_adapters.py`: filtra reglas Cursor por `description:` no vacía y genera `CLAUDE_md_context.mdc` + `AGENTS.md.template` desde `CLAUDE.md.template`.
- `scripts/sanitize_template_refs.py`: bloquea URLs concretas al repo privado (`repos/gmoncor/AI-Coding-Resources-v2`); sanea menciones narrativas; excluye `README.md` y `sync_upstream.md` del embed.

### Añadido — CI

- `tests.yml`: cross-platform (Ubuntu/macOS/Windows × Python 3.11/3.12) con cobertura mínima 60%.
- `release.yml`: trigger en tag `v*.*.*`, build wheel + sdist con verificación de embed (CLAUDE.md.template, AGENTS.md.template, ≥10 cursor rules).
- `sync_from_management.yml`: cron diario que sincroniza templates desde `AI-Coding-Resources` vía SSH read-only deploy key. Guard de secret evita runs rojos hasta setup.
- `docs/CI_SETUP.md`: pasos para configurar deploy key.

### Añadido — Org y branding

- Org GitHub `multi-agent-development-kit` con landing page (`profile/README.md`).
- Repo público `multi-agent-development-kit/madkit` (MIT).
- Discussions habilitadas, 3 issue templates, 9 labels convencionales (`area:*` + `auto-sync`).
- README ES + EN.

### Métricas

- 120 tests cross-platform verde.
- Cobertura: **95%** (los 3 adapters al 100%; validators 99%).
- 7 commits en `main` desde scaffolding inicial hasta v0.1.0.

### Conocido / Pendiente

- Sub-task 084: reescritura del slash `claude-templates/commands/sync_upstream.md` como wrapper de `madkit sincronizar` (actualmente excluido del embed por tener URLs al repo privado).
- Capa 2 del task 082: agent `orientador` para usuarios no técnicos, namespacing `/mad.*`, contratos formales entre subagents.
- Capa 3: adapters ricos para Cline / Continue / Windsurf.
- GitHub avisa de deprecation de Node.js 20 en `actions/checkout@v4`, `setup-python@v5`, `setup-uv@v3` (efectivo junio 2026). Migración pendiente cuando salgan versiones compatibles con Node 24.
