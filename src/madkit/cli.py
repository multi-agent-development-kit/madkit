"""Entry point del CLI madkit."""
from __future__ import annotations

import typer

from madkit import __version__
from madkit.commands import doctor, estado, iniciar, listar_ides, sincronizar
from madkit.i18n import t

app = typer.Typer(
    name="madkit",
    help=t("cli_help"),
    no_args_is_help=True,
    context_settings={"help_option_names": ["--help", "-h"]},
    add_completion=False,
)

app.command("iniciar", help=t("cmd_iniciar_help"))(iniciar.run)
app.command("init", hidden=True)(iniciar.run)
app.command("sincronizar", help=t("cmd_sincronizar_help"))(sincronizar.run)
app.command("sync", hidden=True)(sincronizar.run)
app.command("doctor", help=t("cmd_doctor_help"))(doctor.run)
app.command("estado", help=t("cmd_estado_help"))(estado.run)
app.command("status", hidden=True)(estado.run)
app.command("listar-ides", help=t("cmd_listar_ides_help"))(listar_ides.run)
app.command("list-ides", hidden=True)(listar_ides.run)


def _version_callback(value: bool) -> None:
    if value:
        typer.echo(f"madkit {__version__}")
        raise typer.Exit()


@app.callback()
def main(
    version: bool = typer.Option(
        False,
        "--version",
        "-V",
        help=t("opt_version_help"),
        callback=_version_callback,
        is_eager=True,
    ),
) -> None:
    """madkit — gestiona el scaffolding de tu proyecto multi-agente."""


if __name__ == "__main__":
    app()
