"""Tests del adapter Continue (módulo `continue_dev`)."""
from __future__ import annotations

from pathlib import Path
from unittest.mock import patch

import pytest

from madkit.adapters.continue_dev import ContinueAdapter


@pytest.fixture
def fake_continue_templates(tmp_path: Path) -> Path:
    root = tmp_path / "fake_continue"
    root.mkdir()
    (root / "continue_config.yaml.template").write_text(
        "name: madkit-project\nversion: 0.0.1\nsystemMessage: |\n  Body\n",
        encoding="utf-8",
    )
    return root


def test_detect_returns_false_when_empty(tmp_path: Path) -> None:
    assert ContinueAdapter().detect(tmp_path) is False


def test_detect_returns_true_when_continue_dir_exists(tmp_path: Path) -> None:
    (tmp_path / ".continue").mkdir()
    assert ContinueAdapter().detect(tmp_path) is True


def test_degraded_features_returns_4_items() -> None:
    assert len(ContinueAdapter().degraded_features()) == 4


def test_degraded_messages_mention_claude_code() -> None:
    for _, message in ContinueAdapter().degraded_features():
        assert "Claude Code" in message or "claude" in message.lower()


def test_deploy_creates_continue_config(
    tmp_path: Path, fake_continue_templates: Path
) -> None:
    project = tmp_path / "project"
    project.mkdir()
    with patch(
        "madkit.adapters.continue_dev.templates_root_for", return_value=fake_continue_templates
    ):
        created = ContinueAdapter().deploy(project)
    assert (project / ".continue" / "config.yaml").exists()
    assert (project / ".continue" / "MADKIT_COMPATIBILITY.md").exists()
    assert len(created) == 2


def test_deploy_idempotent(tmp_path: Path, fake_continue_templates: Path) -> None:
    project = tmp_path / "project"
    project.mkdir()
    with patch(
        "madkit.adapters.continue_dev.templates_root_for", return_value=fake_continue_templates
    ):
        first = ContinueAdapter().deploy(project)
        second = ContinueAdapter().deploy(project)
    assert len(first) == 2
    assert second == []


def test_deploy_raises_when_template_missing(tmp_path: Path) -> None:
    project = tmp_path / "project"
    project.mkdir()
    empty = tmp_path / "empty"
    empty.mkdir()
    with patch("madkit.adapters.continue_dev.templates_root_for", return_value=empty):
        with pytest.raises(FileNotFoundError):
            ContinueAdapter().deploy(project)
