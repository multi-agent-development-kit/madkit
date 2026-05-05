"""Smoke tests del CLI: --version, --help, comandos cargados."""
from __future__ import annotations

from typer.testing import CliRunner

from madkit import __version__
from madkit.cli import app

runner = CliRunner()


def test_version() -> None:
    result = runner.invoke(app, ["--version"])
    assert result.exit_code == 0
    assert __version__ in result.stdout


def test_help_es() -> None:
    result = runner.invoke(app, ["--help"])
    assert result.exit_code == 0
    assert "Multi-Agent" in result.stdout


def test_iniciar_returns_zero(tmp_path) -> None:
    result = runner.invoke(app, ["iniciar", str(tmp_path), "--ide", "claude"])
    assert result.exit_code == 0


def test_alias_init_works(tmp_path) -> None:
    result = runner.invoke(app, ["init", str(tmp_path), "--ide", "claude"])
    assert result.exit_code == 0


def test_listar_ides_stub() -> None:
    result = runner.invoke(app, ["listar-ides"])
    assert result.exit_code == 0


def test_no_args_shows_help() -> None:
    result = runner.invoke(app, [])
    assert result.exit_code != 0  # typer no_args_is_help → exit 2
    assert "Usage" in result.stdout or "Uso" in result.stdout or "Multi-Agent" in result.stdout
