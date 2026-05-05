"""Adapter Continue: despliega `.continue/config.yaml` en el proyecto.

`continue` es palabra reservada en Python — el módulo se llama `continue_dev`.

Continue acepta config en `.continue/config.yaml` (proyecto) o
`~/.continue/config.json` (global). El adapter usa el path de proyecto con
`systemMessage` derivado de `CLAUDE.md.template`.

Continue NO ejecuta hooks, subagents con `model:`, ni `context: fork`.
"""
from __future__ import annotations

import shutil
from pathlib import Path

from madkit.adapters.base import IntegrationBase
from madkit.embeds import templates_root_for


class ContinueAdapter(IntegrationBase):
    """Despliega scaffolding Continue en el proyecto destino."""

    name = "continue"

    def detect(self, project_path: Path) -> bool:
        """¿El proyecto ya tiene scaffolding Continue?"""
        return (project_path / ".continue").is_dir()

    def degraded_features(self) -> list[tuple[str, str]]:
        return [
            (
                "subagents-with-model",
                "Continue no ejecuta agentes con modelos distintos como subagents "
                "aislados. Para usar Opus / Sonnet / Haiku con sesiones aisladas, "
                "abre el proyecto en Claude Code. Continue lee `systemMessage` de "
                "config.yaml como contexto del modelo activo.",
            ),
            (
                "hooks",
                "Continue no ejecuta hooks. Las protecciones de Claude Code "
                "(validación de commits, monitorización de contexto) no están "
                "activas. Para tenerlas, usa Claude Code.",
            ),
            (
                "context-fork",
                "Continue no soporta `context: fork`. Las skills se documentan en "
                "`systemMessage` como referencia. Para ejecución aislada con "
                "modelo distinto, usa Claude Code.",
            ),
            (
                "skills-auto-activation",
                "Continue auto-activa via `customCommands` del usuario, no via "
                "descripción de skill como Claude Code. Las skills del framework "
                "están listadas en config.yaml como referencia.",
            ),
        ]

    def deploy(self, project_path: Path, *, force: bool = False) -> list[Path]:
        """Despliega `.continue/config.yaml` + `.continue/MADKIT_COMPATIBILITY.md`."""
        templates_root = templates_root_for("continue")
        config_template = templates_root / "continue_config.yaml.template"
        if not config_template.exists():
            raise FileNotFoundError(
                f"templates/continue/continue_config.yaml.template no encontrado "
                f"en {templates_root}. Ejecuta scripts/generate_adapters.py."
            )

        created: list[Path] = []
        target_dir = project_path / ".continue"
        target_dir.mkdir(parents=True, exist_ok=True)

        target_config = target_dir / "config.yaml"
        if force or not target_config.exists():
            shutil.copy2(config_template, target_config)
            created.append(target_config)

        compat_target = target_dir / "MADKIT_COMPATIBILITY.md"
        if force or not compat_target.exists():
            compat_target.write_text(self._compatibility_doc(), encoding="utf-8")
            created.append(compat_target)

        return created

    def _compatibility_doc(self) -> str:
        lines = [
            "# Compatibilidad de madkit con Continue",
            "",
            "Features Claude-Code-only del framework MAD que NO se ejecutan",
            "nativamente en Continue. Continue recibe `CLAUDE.md` como `systemMessage`",
            "en `.continue/config.yaml` — útil pero sin la orquestación ejecutable.",
            "",
            "## Features degradados",
            "",
        ]
        for feature, message in self.degraded_features():
            lines.extend([f"### `{feature}`", "", message, ""])
        lines.extend(["---", "", "Auto-generado por `madkit iniciar --ide=continue`. No editar a mano.", ""])
        return "\n".join(lines)
