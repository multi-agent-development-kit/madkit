"""Adapter Cline: despliega `.clinerules` en la raíz del proyecto.

Cline acepta `.clinerules` (archivo plain markdown en raíz) o `.clinerules/`
(directorio con varios .md). El adapter usa la variante archivo único —
contenido derivado de `CLAUDE.md.template` adaptado.

Cline NO ejecuta hooks, subagents con `model:`, ni `context: fork` —
features Claude-Code-only se documentan como degradados en
`.cline_compat/MADKIT_COMPATIBILITY.md`.
"""
from __future__ import annotations

import shutil
from pathlib import Path

from madkit.adapters.base import IntegrationBase
from madkit.embeds import templates_root_for


class ClineAdapter(IntegrationBase):
    """Despliega scaffolding Cline en el proyecto destino."""

    name = "cline"

    def detect(self, project_path: Path) -> bool:
        """¿El proyecto ya tiene scaffolding Cline?"""
        return (project_path / ".clinerules").exists()

    def degraded_features(self) -> list[tuple[str, str]]:
        """Features Claude-Code-only que no funcionan nativamente en Cline."""
        return [
            (
                "subagents-with-model",
                "Cline no ejecuta agentes con modelos distintos. Para usar "
                "Opus / Sonnet / Haiku selectivamente, abre el proyecto en "
                "Claude Code. Cline lee `.clinerules` como contexto del proyecto.",
            ),
            (
                "hooks",
                "Cline no ejecuta hooks. Las protecciones de Claude Code "
                "(validación de commits, monitorización de contexto) no están "
                "activas. Para tenerlas, usa Claude Code.",
            ),
            (
                "context-fork",
                "Cline no soporta `context: fork`. Las skills se documentan en "
                "`.clinerules` como referencia, sin ejecución aislada. "
                "Para ese flujo, usa Claude Code.",
            ),
            (
                "skills-auto-activation",
                "Cline no auto-activa skills. Las skills del framework MAD "
                "están listadas en `.clinerules` como contexto, pero su "
                "invocación es manual. Para auto-activación, usa Claude Code.",
            ),
        ]

    def deploy(self, project_path: Path, *, force: bool = False) -> list[Path]:
        """Despliega `.clinerules` + `.cline_compat/MADKIT_COMPATIBILITY.md`."""
        templates_root = templates_root_for("cline")
        rules_template = templates_root / "clinerules.template"
        if not rules_template.exists():
            raise FileNotFoundError(
                f"templates/cline/clinerules.template no encontrado en {templates_root}. "
                "Ejecuta scripts/generate_adapters.py para generarlo."
            )

        created: list[Path] = []
        target_rules = project_path / ".clinerules"
        if force or not target_rules.exists():
            shutil.copy2(rules_template, target_rules)
            created.append(target_rules)

        compat_target = project_path / ".cline_compat" / "MADKIT_COMPATIBILITY.md"
        if force or not compat_target.exists():
            compat_target.parent.mkdir(parents=True, exist_ok=True)
            compat_target.write_text(self._compatibility_doc(), encoding="utf-8")
            created.append(compat_target)

        return created

    def _compatibility_doc(self) -> str:
        lines = [
            "# Compatibilidad de madkit con Cline",
            "",
            "Features Claude-Code-only del framework MAD que NO se ejecutan",
            "nativamente en Cline. Cline recibe `CLAUDE.md` como contexto en",
            "`.clinerules` — útil pero sin la orquestación ejecutable.",
            "",
            "## Features degradados",
            "",
        ]
        for feature, message in self.degraded_features():
            lines.extend([f"### `{feature}`", "", message, ""])
        lines.extend(["---", "", "Auto-generado por `madkit iniciar --ide=cline`. No editar a mano.", ""])
        return "\n".join(lines)
