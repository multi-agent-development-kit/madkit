"""Tests del detector heurístico de IDE."""
from __future__ import annotations

from pathlib import Path

import pytest

from madkit.adapters.detector import detect_ide


def test_unknown_when_empty(tmp_path: Path) -> None:
    assert detect_ide(tmp_path) == "unknown"


def test_claude_when_agents_exists(tmp_path: Path) -> None:
    (tmp_path / ".claude" / "agents").mkdir(parents=True)
    assert detect_ide(tmp_path) == "claude"


def test_cursor_when_rules_exists(tmp_path: Path) -> None:
    (tmp_path / ".cursor" / "rules").mkdir(parents=True)
    assert detect_ide(tmp_path) == "cursor"


def test_codex_when_only_agents_md(tmp_path: Path) -> None:
    (tmp_path / "AGENTS.md").write_text("test", encoding="utf-8")
    assert detect_ide(tmp_path) == "codex"


def test_mixed_when_claude_and_cursor(tmp_path: Path) -> None:
    (tmp_path / ".claude" / "agents").mkdir(parents=True)
    (tmp_path / ".cursor" / "rules").mkdir(parents=True)
    assert detect_ide(tmp_path) == "mixed"


def test_codex_ignored_when_claude_present(tmp_path: Path) -> None:
    (tmp_path / ".claude" / "commands").mkdir(parents=True)
    (tmp_path / "AGENTS.md").write_text("test", encoding="utf-8")
    assert detect_ide(tmp_path) == "claude"
