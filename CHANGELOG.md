# Changelog

Todas las versiones notables se documentan aquí. Sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y [SemVer](https://semver.org/lang/es/).

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
