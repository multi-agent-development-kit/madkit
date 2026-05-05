"""Tests del adapter Cline."""
from __future__ import annotations

from pathlib import Path
from unittest.mock import patch

import pytest

from madkit.adapters.cline import ClineAdapter


@pytest.fixture
def fake_cline_templates(tmp_path: Path) -> Path:
    root = tmp_path / "fake_cline"
    root.mkdir()
    (root / "clinerules.template").write_text(
        "# Cline Project Rules\n\nProject context body.\n",
        encoding="utf-8",
    )
    return root


def test_detect_returns_false_when_empty(tmp_path: Path) -> None:
    assert ClineAdapter().detect(tmp_path) is False


def test_detect_returns_true_when_clinerules_exists(tmp_path: Path) -> None:
    (tmp_path / ".clinerules").write_text("rules", encoding="utf-8")
    assert ClineAdapter().detect(tmp_path) is True


def test_degraded_features_returns_4_items() -> None:
    features = ClineAdapter().degraded_features()
    assert len(features) == 4
    keys = [k for k, _ in features]
    assert "subagents-with-model" in keys
    assert "hooks" in keys
    assert "context-fork" in keys
    assert "skills-auto-activation" in keys


def test_degraded_messages_mention_claude_code() -> None:
    for _, message in ClineAdapter().degraded_features():
        assert "Claude Code" in message or "claude" in message.lower()


def test_deploy_creates_clinerules(tmp_path: Path, fake_cline_templates: Path) -> None:
    project = tmp_path / "project"
    project.mkdir()
    with patch("madkit.adapters.cline.templates_root_for", return_value=fake_cline_templates):
        created = ClineAdapter().deploy(project)
    assert (project / ".clinerules").exists()
    assert (project / ".cline_compat" / "MADKIT_COMPATIBILITY.md").exists()
    assert len(created) == 2


def test_deploy_force_overwrites(tmp_path: Path, fake_cline_templates: Path) -> None:
    project = tmp_path / "project"
    project.mkdir()
    target = project / ".clinerules"
    target.write_text("USER-OLD-CONTENT", encoding="utf-8")
    with patch("madkit.adapters.cline.templates_root_for", return_value=fake_cline_templates):
        ClineAdapter().deploy(project, force=True)
    assert "USER-OLD-CONTENT" not in target.read_text(encoding="utf-8")


def test_deploy_idempotent(tmp_path: Path, fake_cline_templates: Path) -> None:
    project = tmp_path / "project"
    project.mkdir()
    with patch("madkit.adapters.cline.templates_root_for", return_value=fake_cline_templates):
        first = ClineAdapter().deploy(project)
        second = ClineAdapter().deploy(project)
    assert len(first) == 2
    assert second == []


def test_deploy_raises_when_template_missing(tmp_path: Path) -> None:
    project = tmp_path / "project"
    project.mkdir()
    empty = tmp_path / "empty"
    empty.mkdir()
    with patch("madkit.adapters.cline.templates_root_for", return_value=empty):
        with pytest.raises(FileNotFoundError):
            ClineAdapter().deploy(project)
