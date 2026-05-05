"""Acceso a templates embebidos en el paquete vía `importlib.resources`.

Los templates viven en `src/madkit/templates/{claude,cursor,codex}/` y se
distribuyen dentro del wheel.
"""
from __future__ import annotations

from importlib.resources import files
from pathlib import Path

VALID_IDES = frozenset({"claude", "cursor", "codex", "cline", "continue", "windsurf"})


def templates_root_for(ide: str) -> Path:
    """Devuelve el path al directorio de templates embebidos del IDE.

    Levanta ValueError si el IDE no está reconocido. El path puede no contener
    archivos reales hasta que la sub-fase D del task 083 los embeba — los
    callers deben tolerar ausencia y reportar mensajes accionables.
    """
    if ide not in VALID_IDES:
        raise ValueError(f"IDE '{ide}' no reconocido. Válidos: {sorted(VALID_IDES)}")

    resource = files("madkit") / "templates" / ide
    # importlib.resources Traversable -> Path (válido para resource_dir installations)
    return Path(str(resource))
