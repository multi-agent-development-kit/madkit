"""Comando `madkit doctor` — validación V1-V8 + tabla de features degradados."""
from __future__ import annotations

import typer

from madkit.i18n import t


def run(
    path: str = typer.Argument(".", help="Ruta del proyecto destino."),
    ide: str = typer.Option("auto", "--ide", help="auto | claude | cursor | codex | all"),
) -> None:
    """Valida el proyecto y reporta features degradados con mensajes accionables.

    Implementación real en sub-fase A.4 (validators) + A.5+.
    """
    typer.echo(t("stub_msg"))
    raise typer.Exit(code=0)
