"""Tests del adapter Codex: detect, deploy, idempotencia, AGENTS.md generation."""
from __future__ import annotations

from pathlib import Path
from unittest.mock import patch

import pytest

from madkit.adapters.codex import CodexAdapter


@pytest.fixture
def fake_codex_templates(tmp_path: Path) -> Path:
    root = tmp_path / "fake_codex"
    root.mkdir()
    (root / "AGENTS.md.template").write_text(
        "# Project Agents Configuration\n\nProject context body.\n",
        encoding="utf-8",
    )
    return root


def test_detect_returns_false_when_empty(tmp_path: Path) -> None:
    assert CodexAdapter().detect(tmp_path) is False


def test_detect_returns_true_when_agents_md_exists(tmp_path: Path) -> None:
    (tmp_path / "AGENTS.md").write_text("test", encoding="utf-8")
    assert CodexAdapter().detect(tmp_path) is True


def test_degraded_features_returns_4_items() -> None:
    features = CodexAdapter().degraded_features()
    assert len(features) == 4
    feature_keys = [key for key, _ in features]
    assert "subagents-with-model" in feature_keys
    assert "hooks" in feature_keys
    assert "context-fork" in feature_keys
    assert "skills-auto-activation" in feature_keys


def test_degraded_messages_mention_claude_code() -> None:
    """Mensajes orientados a acción: cada uno menciona Claude Code o claude."""
    for _, message in CodexAdapter().degraded_features():
        assert "Claude Code" in message or "claude" in message.lower()


def test_deploy_creates_agents_md(tmp_path: Path, fake_codex_templates: Path) -> None:
    project = tmp_path / "project"
    project.mkdir()
    with patch(
        "madkit.adapters.codex.templates_root_for", return_value=fake_codex_templates
    ):
        created = CodexAdapter().deploy(project)

    target = project / "AGENTS.md"
    assert target.exists()
    assert target in created
    assert "Project Agents Configuration" in target.read_text(encoding="utf-8")


def test_deploy_does_not_overwrite_existing(
    tmp_path: Path, fake_codex_templates: Path
) -> None:
    project = tmp_path / "project"
    project.mkdir()
    target = project / "AGENTS.md"
    sentinel = "USER-CUSTOM-AGENTS-MD"
    target.write_text(sentinel, encoding="utf-8")

    with patch(
        "madkit.adapters.codex.templates_root_for", return_value=fake_codex_templates
    ):
        created = CodexAdapter().deploy(project, force=False)

    assert created == []
    assert target.read_text(encoding="utf-8") == sentinel


def test_deploy_force_overwrites(tmp_path: Path, fake_codex_templates: Path) -> None:
    project = tmp_path / "project"
    project.mkdir()
    target = project / "AGENTS.md"
    target.write_text("old", encoding="utf-8")

    with patch(
        "madkit.adapters.codex.templates_root_for", return_value=fake_codex_templates
    ):
        CodexAdapter().deploy(project, force=True)

    assert "old" not in target.read_text(encoding="utf-8")


def test_deploy_idempotent_without_force(tmp_path: Path, fake_codex_templates: Path) -> None:
    project = tmp_path / "project"
    project.mkdir()
    with patch(
        "madkit.adapters.codex.templates_root_for", return_value=fake_codex_templates
    ):
        first = CodexAdapter().deploy(project)
        second = CodexAdapter().deploy(project)

    assert len(first) == 1
    assert second == []


def test_deploy_raises_when_template_missing(tmp_path: Path) -> None:
    project = tmp_path / "project"
    project.mkdir()
    empty = tmp_path / "empty"
    empty.mkdir()  # sin AGENTS.md.template

    with patch("madkit.adapters.codex.templates_root_for", return_value=empty):
        with pytest.raises(FileNotFoundError):
            CodexAdapter().deploy(project)
