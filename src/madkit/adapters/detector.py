"""Detector heurístico de IDE en un proyecto destino.

Implementa la tabla del task 082 §3.6: indicadores en CWD → IDE detectado.
"""
from __future__ import annotations

from pathlib import Path

DetectedIDE = str  # "claude" | "cursor" | "codex" | "mixed" | "unknown"


def detect_ide(project_path: Path) -> DetectedIDE:
    """Devuelve el IDE detectado según artefactos en project_path.

    Reglas (orden de prioridad):
    - .claude/ con agents/ o commands/ → "claude"
    - .cursor/rules/ o .cursorrules → "cursor"
    - AGENTS.md sin .claude/ ni .cursor/ → "codex"
    - .claude/ + .cursor/ → "mixed"
    - nada → "unknown"
    """
    has_claude = (project_path / ".claude" / "agents").exists() or (
        project_path / ".claude" / "commands"
    ).exists()
    has_cursor = (project_path / ".cursor" / "rules").exists() or (
        project_path / ".cursorrules"
    ).exists()
    has_codex = (project_path / "AGENTS.md").exists()

    if has_claude and has_cursor:
        return "mixed"
    if has_claude:
        return "claude"
    if has_cursor:
        return "cursor"
    if has_codex:
        return "codex"
    return "unknown"
