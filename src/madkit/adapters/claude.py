"""Adapter Claude Code: despliega .claude/{commands,agents,skills,hooks}/ + CLAUDE.md.

Lee templates embebidos desde `madkit/templates/claude/` y los copia al
proyecto destino. Coexiste con otros adapters (cursor, codex) sin pisarse.
"""
from __future__ import annotations

import shutil
from pathlib import Path

from madkit.adapters.base import IntegrationBase
from madkit.embeds import templates_root_for


class ClaudeAdapter(IntegrationBase):
    """Despliega scaffolding Claude Code en el proyecto destino."""

    name = "claude"

    # Subdirectorios bajo `templates/claude/` que se copian a `.claude/` del proyecto
    SUBDIRS = ("commands", "agents", "skills", "hooks")

    def detect(self, project_path: Path) -> bool:
        """¿El proyecto ya tiene scaffolding Claude Code?"""
        return (project_path / ".claude" / "agents").exists() or (
            project_path / ".claude" / "commands"
        ).exists()

    def degraded_features(self) -> list[tuple[str, str]]:
        """Claude Code es la experiencia óptima — cero features degradados."""
        return []

    def deploy(self, project_path: Path, *, force: bool = False) -> list[Path]:
        """Despliega CLAUDE.md + .claude/{...}/ desde templates embebidos.

        Devuelve la lista de paths creados o sobrescritos. Levanta
        FileNotFoundError si los templates Claude no están embebidos en el wheel
        (estado alpha — los rellena la sub-fase D del task 083).
        """
        templates_root = templates_root_for("claude")
        claude_md_template = templates_root / "CLAUDE.md.template"
        if not claude_md_template.exists():
            raise FileNotFoundError(
                f"templates/claude/CLAUDE.md.template no encontrado en {templates_root}"
            )

        created: list[Path] = []

        # 1. CLAUDE.md (solo si no existe o force)
        target_claude_md = project_path / "CLAUDE.md"
        if force or not target_claude_md.exists():
            shutil.copy2(claude_md_template, target_claude_md)
            created.append(target_claude_md)

        # 2. .claude/{subdirs}/
        target_claude_dir = project_path / ".claude"
        for subdir in self.SUBDIRS:
            src_subdir = templates_root / subdir
            if not src_subdir.exists():
                continue
            dst_subdir = target_claude_dir / subdir
            dst_subdir.mkdir(parents=True, exist_ok=True)
            created.extend(_copytree_collect(src_subdir, dst_subdir, force=force))

        return created


def _copytree_collect(src: Path, dst: Path, *, force: bool) -> list[Path]:
    """Copia recursiva de `src` a `dst` y devuelve los paths creados/sobrescritos.

    Salta archivos `.gitkeep` (placeholders de versionado).
    """
    created: list[Path] = []
    for item in src.rglob("*"):
        if item.is_dir():
            continue
        if item.name == ".gitkeep":
            continue
        rel = item.relative_to(src)
        target = dst / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        if force or not target.exists():
            shutil.copy2(item, target)
            created.append(target)
    return created
