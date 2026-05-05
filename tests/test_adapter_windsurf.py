"""Tests del adapter Windsurf."""
from __future__ import annotations

from pathlib import Path
from unittest.mock import patch

import pytest

from madkit.adapters.windsurf import WindsurfAdapter


@pytest.fixture
def fake_windsurf_templates(tmp_path: Path) -> Path:
    root = tmp_path / "fake_windsurf"
    root.mkdir()
    (root / "windsurfrules.template").write_text(
        "# Windsurf Project Rules\n\nProject context body.\n",
        encoding="utf-8",
    )
    return root


def test_detect_returns_false_when_empty(tmp_path: Path) -> None:
    assert WindsurfAdapter().detect(tmp_path) is False


def test_detect_returns_true_when_windsurfrules_exists(tmp_path: Path) -> None:
    (tmp_path / ".windsurfrules").write_text("rules", encoding="utf-8")
    assert WindsurfAdapter().detect(tmp_path) is True


def test_degraded_features_returns_4_items() -> None:
    assert len(WindsurfAdapter().degraded_features()) == 4


def test_degraded_messages_mention_claude_code() -> None:
    for _, message in WindsurfAdapter().degraded_features():
        assert "Claude Code" in message or "claude" in message.lower()


def test_deploy_creates_windsurfrules(
    tmp_path: Path, fake_windsurf_templates: Path
) -> None:
    project = tmp_path / "project"
    project.mkdir()
    with patch(
        "madkit.adapters.windsurf.templates_root_for", return_value=fake_windsurf_templates
    ):
        created = WindsurfAdapter().deploy(project)
    assert (project / ".windsurfrules").exists()
    assert (project / ".windsurf_compat" / "MADKIT_COMPATIBILITY.md").exists()
    assert len(created) == 2


def test_deploy_force_overwrites(tmp_path: Path, fake_windsurf_templates: Path) -> None:
    project = tmp_path / "project"
    project.mkdir()
    target = project / ".windsurfrules"
    target.write_text("USER-OLD", encoding="utf-8")
    with patch(
        "madkit.adapters.windsurf.templates_root_for", return_value=fake_windsurf_templates
    ):
        WindsurfAdapter().deploy(project, force=True)
    assert "USER-OLD" not in target.read_text(encoding="utf-8")


def test_deploy_idempotent(tmp_path: Path, fake_windsurf_templates: Path) -> None:
    project = tmp_path / "project"
    project.mkdir()
    with patch(
        "madkit.adapters.windsurf.templates_root_for", return_value=fake_windsurf_templates
    ):
        first = WindsurfAdapter().deploy(project)
        second = WindsurfAdapter().deploy(project)
    assert len(first) == 2
    assert second == []


def test_deploy_raises_when_template_missing(tmp_path: Path) -> None:
    project = tmp_path / "project"
    project.mkdir()
    empty = tmp_path / "empty"
    empty.mkdir()
    with patch("madkit.adapters.windsurf.templates_root_for", return_value=empty):
        with pytest.raises(FileNotFoundError):
            WindsurfAdapter().deploy(project)
