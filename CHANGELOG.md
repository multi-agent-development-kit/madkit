# Changelog

Todas las versiones notables se documentan aquí. Sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y [SemVer](https://semver.org/lang/es/).

## [Unreleased] — 0.1.0.dev0

### Añadido
- Scaffolding inicial del paquete Python `madkit`.
- Estructura de comandos: `iniciar`, `sincronizar`, `doctor`, `estado`, `listar-ides` (stubs).
- Aliases EN: `init`, `sync`, `status`, `list-ides`.
- Sistema i18n bilingüe ES/EN con keys mínimas.
- Detector heurístico de IDE (claude / cursor / codex / mixed / unknown).
- Interface base `IntegrationBase` para adapters.
- Smoke tests del CLI (`--version`, `--help`, comandos cargados).
- Tests del detector con 6 casos.
- Workflow CI cross-platform (Ubuntu / macOS / Windows × Python 3.11 / 3.12).
- Pyproject.toml con typer, rich, platformdirs.
- README ES con quickstart `uvx` + `uv tool install`, tabla de compatibilidad.
- LICENSE MIT.

### Próximas sub-fases del task 083
- A.4: validators V1-V8 portados de T073 (frontmatter.py).
- A.5: adapter Claude completo + hooks opt-in interactivo.
- B: adapter Cursor + filtro auto-detect description.
- C: adapter Codex / AGENTS.md.
- D: workflow CI `sync_from_management.yml` + sanitización.
- E: README EN, CHANGELOG, tag v0.1.0, verificación end-to-end.
