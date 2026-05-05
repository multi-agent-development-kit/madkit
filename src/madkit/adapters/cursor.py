"""Adapter Cursor: despliega `.cursor/rules/` filtrado + tabla de compatibilidad.

Las reglas auto-activables (con `description:` no vacía) se distribuyen como
están desde el repo de gestión. Las primitivas Claude-Code-only (subagents,
hooks, `context: fork`) NO se traducen a Cursor — se documentan como
features degradados en `.cursor/MADKIT_COMPATIBILITY.md`.
"""
from __future__ import annotations

import shutil
from pathlib import Path

from madkit.adapters.base import IntegrationBase
from madkit.embeds import templates_root_for


class CursorAdapter(IntegrationBase):
    """Despliega scaffolding Cursor en el proyecto destino."""

    name = "cursor"

    def detect(self, project_path: Path) -> bool:
        """¿El proyecto ya tiene scaffolding Cursor?"""
        return (project_path / ".cursor" / "rules").exists() or (
            project_path / ".cursorrules"
        ).exists()

    def degraded_features(self) -> list[tuple[str, str]]:
        """Features Claude-Code-only que NO funcionan nativamente en Cursor.

        Mensajes orientados a acción (no técnicos) según task 082 §9.5.8.
        """
        return [
            (
                "subagents-with-model",
                "Para usar agentes con modelos distintos (Opus / Sonnet / Haiku) "
                "abre el proyecto en Claude Code. En Cursor los agentes están "
                "descritos como referencia en `.cursor/rules/CLAUDE_md_context.mdc`.",
            ),
            (
                "hooks",
                "Cursor no ejecuta hooks. Las protecciones de Claude Code "
                "(validación de commits, monitorización de contexto, defense-in-depth) "
                "no están activas. Para tenerlas, usa Claude Code.",
            ),
            (
                "context-fork",
                "Cursor no soporta `context: fork`. Las skills se distribuyen como "
                "documentación de referencia, no se ejecutan en sesiones aisladas con "
                "su propio modelo. Para ese flujo, usa Claude Code.",
            ),
            (
                "skills-auto-activation",
                "Cursor activa reglas por glob o description, no por descripción de "
                "skill. Las skills de Claude Code están listadas en "
                "`.cursor/rules/CLAUDE_md_context.mdc` para tu referencia, pero su "
                "auto-activación nativa solo funciona en Claude Code.",
            ),
        ]

    def deploy(self, project_path: Path, *, force: bool = False) -> list[Path]:
        """Despliega `.cursor/rules/` + `.cursor/MADKIT_COMPATIBILITY.md`."""
        templates_root = templates_root_for("cursor")
        rules_src = templates_root / "rules"
        if not rules_src.exists() or not list(rules_src.glob("*.mdc")):
            raise FileNotFoundError(
                f"templates/cursor/rules/ vacío en {templates_root}. "
                "Ejecuta scripts/generate_adapters.py para poblar."
            )

        created: list[Path] = []
        target_rules = project_path / ".cursor" / "rules"
        target_rules.mkdir(parents=True, exist_ok=True)

        for mdc in sorted(rules_src.glob("*.mdc")):
            target = target_rules / mdc.name
            if force or not target.exists():
                shutil.copy2(mdc, target)
                created.append(target)

        compat_target = project_path / ".cursor" / "MADKIT_COMPATIBILITY.md"
        if force or not compat_target.exists():
            compat_target.write_text(self._compatibility_doc(), encoding="utf-8")
            created.append(compat_target)

        return created

    def _compatibility_doc(self) -> str:
        """Renderiza el `.cursor/MADKIT_COMPATIBILITY.md` informativo."""
        lines = [
            "# Compatibilidad de madkit con Cursor",
            "",
            "Este archivo documenta los **features degradados** del framework MAD",
            "cuando se consume desde Cursor. Claude Code es la experiencia óptima",
            "por diseño — Cursor recibe lo que su modelo de primitivas soporta,",
            "sin fingir paridad imposible.",
            "",
            "## Features degradados",
            "",
        ]
        for feature, message in self.degraded_features():
            lines.append(f"### `{feature}`")
            lines.append("")
            lines.append(message)
            lines.append("")
        lines.append("---")
        lines.append("")
        lines.append("Auto-generado por `madkit iniciar --ide=cursor`. No editar a mano.")
        lines.append("")
        return "\n".join(lines)
