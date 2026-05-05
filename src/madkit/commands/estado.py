"""Comando `madkit estado` — snapshot del proyecto."""
from __future__ import annotations

import typer

from madkit.i18n import t


def run(
    path: str = typer.Argument(".", help="Ruta del proyecto destino."),
    json_output: bool = typer.Option(False, "--json", help="Output parseable JSON."),
) -> None:
    """Lista tareas activas, contadores y IDE detectado.

    Implementación real en sub-fase A.5+.
    """
    typer.echo(t("stub_msg"))
    raise typer.Exit(code=0)
