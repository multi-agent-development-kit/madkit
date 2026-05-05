"""Comando `madkit sincronizar` — pull templates desde wheel + diff + report."""
from __future__ import annotations

import typer

from madkit.i18n import t


def run(
    path: str = typer.Argument(".", help="Ruta del proyecto destino."),
    ide: str = typer.Option("auto", "--ide", help="auto | claude | cursor | codex | all"),
    check_update: bool = typer.Option(
        False,
        "--check-update",
        help="Falla si no hay conexión a GitHub para verificar updates.",
    ),
    dry_run: bool = typer.Option(False, "--dry-run", help="Mostrar acciones sin aplicarlas."),
) -> None:
    """Aplica V1-V8 (port T073) y produce .claude/.sync_report.txt.

    Implementación real en sub-fase D (CI workflows) + posteriores.
    """
    typer.echo(t("stub_msg"))
    raise typer.Exit(code=0)
