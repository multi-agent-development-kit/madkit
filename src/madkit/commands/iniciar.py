"""Comando `madkit iniciar` — bootstrap mecánico del proyecto."""
from __future__ import annotations

import typer

from madkit.i18n import t


def run(
    path: str = typer.Argument(".", help="Ruta del proyecto destino."),
    ide: str = typer.Option(
        "auto",
        "--ide",
        help="auto | claude | cursor | codex | all",
    ),
    force: bool = typer.Option(
        False,
        "--force",
        help="Sobrescribir scaffolding preexistente.",
    ),
    quiet: bool = typer.Option(False, "--quiet", help="Solo errores."),
) -> None:
    """Crea ai_docs/, CLAUDE.md y el scaffolding del IDE seleccionado.

    Implementación real en sub-fase A.5 (adapter Claude) + B (Cursor) + C (Codex).
    """
    typer.echo(t("stub_msg"))
    raise typer.Exit(code=0)
