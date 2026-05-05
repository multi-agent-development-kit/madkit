"""Comando `madkit listar-ides` — tabla de compatibilidad por IDE."""
from __future__ import annotations

import typer

from madkit.i18n import t


def run() -> None:
    """Muestra tabla de compatibilidad de features por IDE.

    Implementación real en sub-fase A.5+.
    """
    typer.echo(t("stub_msg"))
    raise typer.Exit(code=0)
