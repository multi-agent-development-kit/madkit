"""Adapter Windsurf: despliega `.windsurfrules` en la raíz del proyecto.

Windsurf acepta `.windsurfrules` (archivo plain markdown en raíz, similar a
`.cursorrules`). El adapter copia el contenido derivado de `CLAUDE.md.template`.

Windsurf NO ejecuta hooks, subagents con `model:`, ni `context: fork`.
"""
from __future__ import annotations

import shutil
from pathlib import Path

from madkit.adapters.base import IntegrationBase
from madkit.embeds import templates_root_for


class WindsurfAdapter(IntegrationBase):
    """Despliega scaffolding Windsurf en el proyecto destino."""

    name = "windsurf"

    def detect(self, project_path: Path) -> bool:
        """¿El proyecto ya tiene scaffolding Windsurf?"""
        return (project_path / ".windsurfrules").exists()

    def degraded_features(self) -> list[tuple[str, str]]:
        return [
            (
                "subagents-with-model",
                "Windsurf no ejecuta agentes con modelos distintos como subagents. "
                "Para usar Opus / Sonnet / Haiku selectivamente, abre el proyecto "
                "en Claude Code. Windsurf lee `.windsurfrules` como contexto del "
                "proyecto.",
            ),
            (
                "hooks",
                "Windsurf no ejecuta hooks. Las protecciones de Claude Code "
                "(validación de commits, monitorización de contexto) no están "
                "activas. Para tenerlas, usa Claude Code.",
            ),
            (
                "context-fork",
                "Windsurf no soporta `context: fork`. Las skills se documentan en "
                "`.windsurfrules` como referencia, sin ejecución aislada con "
                "modelo distinto. Para ese flujo, usa Claude Code.",
            ),
            (
                "skills-auto-activation",
                "Windsurf no auto-activa skills por descripción como Claude Code. "
                "Las skills del framework MAD están listadas en `.windsurfrules` "
                "como contexto, pero su invocación es manual.",
            ),
        ]

    def deploy(self, project_path: Path, *, force: bool = False) -> list[Path]:
        """Despliega `.windsurfrules` + `.windsurf_compat/MADKIT_COMPATIBILITY.md`."""
        templates_root = templates_root_for("windsurf")
        rules_template = templates_root / "windsurfrules.template"
        if not rules_template.exists():
            raise FileNotFoundError(
                f"templates/windsurf/windsurfrules.template no encontrado en "
                f"{templates_root}. Ejecuta scripts/generate_adapters.py."
            )

        created: list[Path] = []
        target_rules = project_path / ".windsurfrules"
        if force or not target_rules.exists():
            shutil.copy2(rules_template, target_rules)
            created.append(target_rules)

        compat_target = project_path / ".windsurf_compat" / "MADKIT_COMPATIBILITY.md"
        if force or not compat_target.exists():
            compat_target.parent.mkdir(parents=True, exist_ok=True)
            compat_target.write_text(self._compatibility_doc(), encoding="utf-8")
            created.append(compat_target)

        return created

    def _compatibility_doc(self) -> str:
        lines = [
            "# Compatibilidad de madkit con Windsurf",
            "",
            "Features Claude-Code-only del framework MAD que NO se ejecutan",
            "nativamente en Windsurf. Windsurf recibe `CLAUDE.md` como contexto en",
            "`.windsurfrules` — útil pero sin la orquestación ejecutable.",
            "",
            "## Features degradados",
            "",
        ]
        for feature, message in self.degraded_features():
            lines.extend([f"### `{feature}`", "", message, ""])
        lines.extend(["---", "", "Auto-generado por `madkit iniciar --ide=windsurf`. No editar a mano.", ""])
        return "\n".join(lines)
