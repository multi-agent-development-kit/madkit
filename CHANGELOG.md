# Changelog

Todas las versiones notables se documentan aquí. Sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y [SemVer](https://semver.org/lang/es/).

## [Unreleased] — 0.1.0.dev0

Sub-fases A.1 a A.6 del task 083 completas. Próxima parada: Fase B (adapter Cursor).

### Añadido

#### Sub-fase A.1 — Org y repos
- Org GitHub `multi-agent-development-kit` creada.
- Repo `multi-agent-development-kit/madkit` (público, MIT) con código del CLI.
- Repo `multi-agent-development-kit/.github` con landing page (`profile/README.md`).
- 9 labels convencionales (`area:cli`, `area:adapter-{claude,cursor,codex,new}`, `area:templates`, `area:ci`, `area:docs`, `auto-sync`).
- Discussions habilitadas con 6 categorías default.
- 3 issue templates (bug-report, adapter-request, template-issue).

#### Sub-fase A.2 — Scaffolding del paquete
- `pyproject.toml` con typer + rich + platformdirs, entry point `madkit`, build hatchling.
- 5 comandos: `iniciar`, `sincronizar`, `doctor`, `estado`, `listar-ides` con aliases EN.
- Sistema i18n bilingüe ES/EN.
- Detector heurístico de IDE (claude / cursor / codex / mixed / unknown).
- Workflow CI cross-platform (Ubuntu/macOS/Windows × Python 3.11/3.12).

#### Sub-fase A.3 + A.5 — Adapter Claude funcional
- `IntegrationBase` interface para los 3 adapters.
- `ClaudeAdapter` con deploy real desde templates embebidos vía `importlib.resources`.
- `CLAUDE.md.template` embebido (165 líneas, base estable).
- Comando `iniciar` integrado: detector + adapter + ai_docs/ + .gitignore + mensajes accionables.
- 30+ keys en i18n con paridad ES/EN garantizada por test.

#### Sub-fase A.4 — Validators V1-V7
- Port estricto de `scripts/sync_templates.{ps1,sh}` del repo de gestión.
- 6 reglas ABORT (V1-V6) + 1 WARN (V7). V8 reservada para futuro (no implementada en script actual).
- API: `parse_frontmatter()`, `get_field()`, `validate_skill()`, `validate_agent()`, `validate_frontmatter()`, `has_abort()`, `has_warn()`.

#### Sub-fase A.6 — Cobertura y release
- Tests de subdirs poblados (mock de `templates_root_for`).
- Test de build de wheel con verificación de templates embebidos.
- README ES + EN.
- Cobertura global: **88%**.

### Pendiente para v0.1.0
- **Fase B:** adapter Cursor + `scripts/generate_adapters.py` con filtro auto-detect description.
- **Fase C:** adapter Codex / AGENTS.md.
- **Fase D:** workflows CI `sync_from_management.yml` + `release.yml` + `scripts/sanitize_template_refs.py` ya stub.
- **Fase E:** verificación end-to-end desde máquina limpia + tag v0.1.0.
