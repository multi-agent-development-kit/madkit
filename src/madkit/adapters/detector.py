"""Detector heurístico de IDE en un proyecto destino.

Implementa la tabla del task 082 §3.6 ampliada con T088 (Cline / Continue /
Windsurf): indicadores en CWD → IDE detectado.
"""
from __future__ import annotations

from pathlib import Path

DetectedIDE = str  # "claude" | "cursor" | "codex" | "cline" | "continue" | "windsurf" | "mixed" | "unknown"


def detect_ide(project_path: Path) -> DetectedIDE:
    """Devuelve el IDE detectado según artefactos en project_path.

    Reglas (orden de prioridad):
    - .claude/ con agents/ o commands/ → "claude"
    - .cursor/rules/ o .cursorrules → "cursor"
    - .cline/ o .clinerules → "cline"
    - .continue/ → "continue"
    - .windsurfrules → "windsurf"
    - AGENTS.md sin .claude/ ni .cursor/ → "codex"
    - 2+ tipos de scaffolding presentes → "mixed"
    - nada → "unknown"

    Si .claude/ está presente, gana sobre el resto (Claude Code es la
    experiencia óptima por diseño). Las combinaciones de los demás se
    reportan como "mixed" para que el comando pregunte al usuario.
    """
    has_claude = (project_path / ".claude" / "agents").exists() or (
        project_path / ".claude" / "commands"
    ).exists()
    has_cursor = (project_path / ".cursor" / "rules").exists() or (
        project_path / ".cursorrules"
    ).exists()
    has_cline = (project_path / ".clinerules").exists()
    has_continue = (project_path / ".continue").is_dir()
    has_windsurf = (project_path / ".windsurfrules").exists()
    has_codex = (project_path / "AGENTS.md").exists()

    # Scaffolding "ejecutable" — IDEs que tienen su propia configuración activa.
    # AGENTS.md (codex) es informativo: muchos proyectos lo generan junto con
    # otro scaffolding como referencia, así que NO cuenta como conflicto con Claude.
    has_other_executable = has_cursor or has_cline or has_continue or has_windsurf

    if has_claude and has_other_executable:
        return "mixed"
    if has_claude:
        return "claude"
    # Claude no presente.
    other_count = sum([has_cursor, has_cline, has_continue, has_windsurf, has_codex])
    if other_count >= 2:
        return "mixed"
    if has_cursor:
        return "cursor"
    if has_cline:
        return "cline"
    if has_continue:
        return "continue"
    if has_windsurf:
        return "windsurf"
    if has_codex:
        return "codex"
    return "unknown"
