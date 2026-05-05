"""Internacionalización mínima ES/EN.

Strings centralizados para todos los comandos. Las sub-fases A.5 + posteriores
añadirán mensajes orientados a acción (no técnicos) según task 082 §9.5.8.
"""
from __future__ import annotations

import os

DEFAULT_LANG = "ES"

_STRINGS: dict[str, dict[str, str]] = {
    "ES": {
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
    },
    "EN": {
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
    },
}


def get_lang() -> str:
    """Devuelve el idioma activo (env MADKIT_LANG, default ES)."""
    return os.environ.get("MADKIT_LANG", DEFAULT_LANG).upper()


def t(key: str, lang: str | None = None) -> str:
    """Traduce una key al idioma activo. Si la key no existe, devuelve la propia key."""
    selected = (lang or get_lang()).upper()
    if selected not in _STRINGS:
        selected = DEFAULT_LANG
    return _STRINGS[selected].get(key, key)
