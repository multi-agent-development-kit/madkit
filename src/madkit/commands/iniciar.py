"""Comando `madkit iniciar` — bootstrap mecánico del proyecto."""
from __future__ import annotations

from pathlib import Path

import typer

from madkit.adapters.claude import ClaudeAdapter
from madkit.adapters.cline import ClineAdapter
from madkit.adapters.codex import CodexAdapter
from madkit.adapters.continue_dev import ContinueAdapter
from madkit.adapters.cursor import CursorAdapter
from madkit.adapters.detector import detect_ide
from madkit.adapters.windsurf import WindsurfAdapter
from madkit.i18n import t

VALID_IDE_OPTIONS = frozenset(
    {"auto", "claude", "cursor", "codex", "cline", "continue", "windsurf", "all"}
)

# IDEs implementados en esta versión.
IMPLEMENTED_ADAPTERS = {
    "claude": ClaudeAdapter,
    "cursor": CursorAdapter,
    "codex": CodexAdapter,
    "cline": ClineAdapter,
    "continue": ContinueAdapter,
    "windsurf": WindsurfAdapter,
}

# Subdirectorios de ai_docs/ creados por bootstrap
AI_DOCS_SUBDIRS = ("core", "tasks", "refs")


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
    """Crea ai_docs/, CLAUDE.md y el scaffolding del IDE seleccionado."""
    project_path = Path(path).expanduser().resolve()

    # Validar path
    if not project_path.is_dir():
        typer.echo(t("init_err_path_not_dir", path=str(project_path)), err=True)
        raise typer.Exit(code=1)

    # Validar opción ide
    if ide not in VALID_IDE_OPTIONS:
        typer.echo(t("init_err_ide_unsupported", ide=ide), err=True)
        raise typer.Exit(code=1)

    # Resolver --ide=auto
    if ide == "auto":
        detected = detect_ide(project_path)
        if detected in IMPLEMENTED_ADAPTERS:
            ide = detected
        elif detected == "mixed":
            ide = "all"
        else:
            ide = "claude"  # default según task 082 §3.6

    if not quiet:
        typer.echo(t("init_starting", path=str(project_path)))
        typer.echo(t("init_detected_ide", ide=t(f"ide_label_{detect_ide(project_path)}")))

    # Crear estructura ai_docs/
    if not quiet:
        typer.echo(t("init_creating_structure"))
    _ensure_ai_docs(project_path)

    # Desplegar adapter(s)
    adapters_to_run: list[str] = list(IMPLEMENTED_ADAPTERS.keys()) if ide == "all" else [ide]

    deployed_paths: list[Path] = []
    for adapter_key in adapters_to_run:
        if adapter_key not in IMPLEMENTED_ADAPTERS:
            # cursor + codex llegan en sub-fases B/C — silently skip por ahora
            continue
        adapter = IMPLEMENTED_ADAPTERS[adapter_key]()

        # Detección de scaffolding preexistente sin --force
        if adapter.detect(project_path) and not force:
            typer.echo(t("init_err_already_initialized"), err=True)
            raise typer.Exit(code=1)

        if not quiet:
            typer.echo(t(f"init_copying_{adapter_key}"))

        try:
            deployed_paths.extend(adapter.deploy(project_path, force=force))
        except FileNotFoundError:
            typer.echo(t("init_err_no_templates"), err=True)
            raise typer.Exit(code=1) from None

    # .gitignore con ai_docs/
    if not quiet:
        typer.echo(t("init_writing_gitignore"))
    _ensure_gitignore_entry(project_path, "ai_docs/")

    # Resumen final
    if not quiet:
        typer.echo("")
        typer.echo(t("init_done"))
        for adapter_key in adapters_to_run:
            if adapter_key in IMPLEMENTED_ADAPTERS:
                typer.echo(t(f"init_next_step_{adapter_key}"))

    raise typer.Exit(code=0)


def _ensure_ai_docs(project_path: Path) -> None:
    """Crea ai_docs/{core,tasks,refs}/ idempotente."""
    base = project_path / "ai_docs"
    for subdir in AI_DOCS_SUBDIRS:
        (base / subdir).mkdir(parents=True, exist_ok=True)


def _ensure_gitignore_entry(project_path: Path, entry: str) -> None:
    """Añade una entrada al .gitignore si no existe ya."""
    gitignore = project_path / ".gitignore"
    if gitignore.exists():
        existing = gitignore.read_text(encoding="utf-8")
        if any(line.strip() == entry for line in existing.splitlines()):
            return
        if not existing.endswith("\n"):
            existing += "\n"
        gitignore.write_text(existing + entry + "\n", encoding="utf-8")
    else:
        gitignore.write_text(entry + "\n", encoding="utf-8")
