"""Adapter Codex / GitHub Copilot: genera AGENTS.md consolidado en raíz del proyecto.

`AGENTS.md` es el formato canónico que Codex y GitHub Copilot consumen como
contexto. El adapter consolida `CLAUDE.md.template` + descripciones de features
del framework MAD en un único archivo informativo. Codex no ejecuta agentes
ni hooks — el archivo es referencia para sus prompts.
"""
from __future__ import annotations

import shutil
from pathlib import Path

from madkit.adapters.base import IntegrationBase
from madkit.embeds import templates_root_for


class CodexAdapter(IntegrationBase):
    """Despliega AGENTS.md en la raíz del proyecto destino."""

    name = "codex"

    def detect(self, project_path: Path) -> bool:
        """¿El proyecto ya tiene un AGENTS.md?"""
        return (project_path / "AGENTS.md").exists()

    def degraded_features(self) -> list[tuple[str, str]]:
        """Features Claude-Code-only que Codex no ejecuta nativamente."""
        return [
            (
                "subagents-with-model",
                "Codex / GitHub Copilot no ejecuta agentes con modelos distintos. "
                "Para usar Opus / Sonnet / Haiku selectivamente, abre el proyecto en "
                "Claude Code. Codex consume `AGENTS.md` como contexto del proyecto.",
            ),
            (
                "hooks",
                "Codex no ejecuta hooks. Las protecciones de Claude Code "
                "(validación de commits, monitorización de contexto) no están activas. "
                "Para tenerlas, usa Claude Code.",
            ),
            (
                "context-fork",
                "Codex no soporta `context: fork`. Las skills se documentan en "
                "`AGENTS.md` como referencia, sin ejecución aislada. Para ese flujo, "
                "usa Claude Code.",
            ),
            (
                "skills-auto-activation",
                "Codex no auto-activa skills. Las skills del framework MAD están "
                "documentadas en `AGENTS.md` para que el modelo las tenga en contexto, "
                "pero su invocación es manual. Para auto-activación, usa Claude Code.",
            ),
        ]

    def deploy(self, project_path: Path, *, force: bool = False) -> list[Path]:
        """Despliega `AGENTS.md` en la raíz del proyecto destino."""
        templates_root = templates_root_for("codex")
        agents_template = templates_root / "AGENTS.md.template"
        if not agents_template.exists():
            raise FileNotFoundError(
                f"templates/codex/AGENTS.md.template no encontrado en {templates_root}. "
                "Ejecuta scripts/generate_adapters.py para generarlo."
            )

        target = project_path / "AGENTS.md"
        if not force and target.exists():
            return []

        shutil.copy2(agents_template, target)
        return [target]
