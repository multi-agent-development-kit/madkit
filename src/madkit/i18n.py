"""Internacionalización ES/EN.

Strings centralizados. Mensajes orientados a acción (no técnicos) según
task 082 §9.5.8.
"""
from __future__ import annotations

import os

DEFAULT_LANG = "ES"

_STRINGS: dict[str, dict[str, str]] = {
    "ES": {
        # CLI
        "cli_help": (
            "Multi-Agent Development Kit. Bootstrap, sincronización y validación "
            "de scaffolding multi-IDE para proyectos asistidos por agentes."
        ),
        "cmd_iniciar_help": (
            "Bootstrap mecánico: crea ai_docs/, CLAUDE.md y el scaffolding del IDE elegido."
        ),
        "cmd_sincronizar_help": "Sincroniza templates locales con la versión del wheel instalado.",
        "cmd_doctor_help": (
            "Valida el proyecto local: frontmatter, references, IDE detectado, "
            "features degradados respecto al IDE."
        ),
        "cmd_estado_help": "Snapshot del proyecto: tareas activas, contadores, IDE detectado.",
        "cmd_listar_ides_help": "Tabla de compatibilidad por IDE.",
        "opt_version_help": "Muestra la versión y termina.",
        "stub_msg": "[stub] Comando aún no implementado. Llegará en una sub-fase posterior.",
        # iniciar — progreso
        "init_starting": "Iniciando bootstrap en: {path}",
        "init_detected_ide": "IDE detectado: {ide}",
        "init_creating_structure": "Creando estructura ai_docs/...",
        "init_copying_claude": "Copiando scaffolding Claude Code...",
        "init_copying_cursor": "Copiando reglas Cursor + tabla de compatibilidad...",
        "init_copying_codex": "Generando AGENTS.md para Codex...",
        "init_copying_cline": "Generando .clinerules + tabla de compatibilidad...",
        "init_copying_continue": "Generando .continue/config.yaml + tabla de compatibilidad...",
        "init_copying_windsurf": "Generando .windsurfrules + tabla de compatibilidad...",
        "init_writing_gitignore": "Actualizando .gitignore...",
        "init_done": "Listo. Próximo paso recomendado:",
        "init_next_step_claude": "  abre tu proyecto en Claude Code y ejecuta `/setup_project` para análisis de docs.",
        "init_next_step_cursor": "  abre tu proyecto en Cursor; las reglas activas están en `.cursor/rules/`.",
        "init_next_step_codex": "  Codex / GitHub Copilot leerán `AGENTS.md` automáticamente como contexto.",
        "init_next_step_cline": "  abre tu proyecto en Cline; el contexto del framework está en `.clinerules`.",
        "init_next_step_continue": "  abre tu proyecto en Continue; el systemMessage está en `.continue/config.yaml`.",
        "init_next_step_windsurf": "  abre tu proyecto en Windsurf; el contexto está en `.windsurfrules`.",
        # iniciar — errores
        "init_err_path_not_dir": "La ruta '{path}' no es un directorio existente.",
        "init_err_already_initialized": (
            "El proyecto ya tiene scaffolding Claude Code en '.claude/'. "
            "Usa `--force` si quieres sobrescribir (no recomendado)."
        ),
        "init_err_ide_unsupported": (
            "El IDE '{ide}' no está soportado en esta versión. "
            "Disponibles: claude, cursor, codex, all, auto."
        ),
        "init_err_no_templates": (
            "Los templates Claude Code todavía no están embebidos en este wheel "
            "(`templates/claude/CLAUDE.md.template` falta). Esta versión es alpha; "
            "se completarán en la sub-fase D del task 083."
        ),
        # detector — labels para el usuario
        "ide_label_claude": "Claude Code",
        "ide_label_cursor": "Cursor",
        "ide_label_codex": "Codex / GitHub Copilot",
        "ide_label_cline": "Cline",
        "ide_label_continue": "Continue",
        "ide_label_windsurf": "Windsurf",
        "ide_label_mixed": "varios IDEs detectados (mixto)",
        "ide_label_unknown": "ninguno detectado",
    },
    "EN": {
        # CLI
        "cli_help": (
            "Multi-Agent Development Kit. Bootstrap, sync and validation of "
            "multi-IDE scaffolding for agent-assisted projects."
        ),
        "cmd_iniciar_help": (
            "Mechanical bootstrap: creates ai_docs/, CLAUDE.md and the chosen IDE scaffolding."
        ),
        "cmd_sincronizar_help": "Sync local templates with the installed wheel version.",
        "cmd_doctor_help": (
            "Validate local project: frontmatter, references, detected IDE, degraded features."
        ),
        "cmd_estado_help": "Project snapshot: active tasks, counts, detected IDE.",
        "cmd_listar_ides_help": "Per-IDE compatibility table.",
        "opt_version_help": "Show version and exit.",
        "stub_msg": "[stub] Command not implemented yet. Coming in a later sub-phase.",
        # iniciar — progress
        "init_starting": "Starting bootstrap at: {path}",
        "init_detected_ide": "Detected IDE: {ide}",
        "init_creating_structure": "Creating ai_docs/ structure...",
        "init_copying_claude": "Copying Claude Code scaffolding...",
        "init_copying_cursor": "Copying Cursor rules + compatibility table...",
        "init_copying_codex": "Generating AGENTS.md for Codex...",
        "init_copying_cline": "Generating .clinerules + compatibility table...",
        "init_copying_continue": "Generating .continue/config.yaml + compatibility table...",
        "init_copying_windsurf": "Generating .windsurfrules + compatibility table...",
        "init_writing_gitignore": "Updating .gitignore...",
        "init_done": "Done. Recommended next step:",
        "init_next_step_claude": "  open your project in Claude Code and run `/setup_project` for doc analysis.",
        "init_next_step_cursor": "  open your project in Cursor; active rules live in `.cursor/rules/`.",
        "init_next_step_codex": "  Codex / GitHub Copilot will read `AGENTS.md` automatically as context.",
        "init_next_step_cline": "  open your project in Cline; framework context lives in `.clinerules`.",
        "init_next_step_continue": "  open your project in Continue; systemMessage is in `.continue/config.yaml`.",
        "init_next_step_windsurf": "  open your project in Windsurf; context is in `.windsurfrules`.",
        # iniciar — errors
        "init_err_path_not_dir": "Path '{path}' is not an existing directory.",
        "init_err_already_initialized": (
            "Project already has Claude Code scaffolding under '.claude/'. "
            "Use `--force` to overwrite (not recommended)."
        ),
        "init_err_ide_unsupported": (
            "IDE '{ide}' is not supported in this version. "
            "Available: claude, cursor, codex, all, auto."
        ),
        "init_err_no_templates": (
            "Claude Code templates are not yet embedded in this wheel "
            "(`templates/claude/CLAUDE.md.template` missing). This is an alpha "
            "release; it will be completed in sub-phase D of task 083."
        ),
        # detector — user-facing labels
        "ide_label_claude": "Claude Code",
        "ide_label_cursor": "Cursor",
        "ide_label_codex": "Codex / GitHub Copilot",
        "ide_label_cline": "Cline",
        "ide_label_continue": "Continue",
        "ide_label_windsurf": "Windsurf",
        "ide_label_mixed": "multiple IDEs detected (mixed)",
        "ide_label_unknown": "none detected",
    },
}


def get_lang() -> str:
    """Devuelve el idioma activo (env MADKIT_LANG, default ES)."""
    return os.environ.get("MADKIT_LANG", DEFAULT_LANG).upper()


def t(key: str, lang: str | None = None, **format_kwargs: object) -> str:
    """Traduce una key al idioma activo. Soporta substitución {placeholder}."""
    selected = (lang or get_lang()).upper()
    if selected not in _STRINGS:
        selected = DEFAULT_LANG
    template = _STRINGS[selected].get(key, key)
    if format_kwargs:
        try:
            return template.format(**format_kwargs)
        except (KeyError, IndexError):
            return template
    return template
