"""Tests del adapter Cursor: detect, deploy, MADKIT_COMPATIBILITY.md, idempotencia."""
from __future__ import annotations

from pathlib import Path
from unittest.mock import patch

import pytest

from madkit.adapters.cursor import CursorAdapter


@pytest.fixture
def fake_cursor_templates(tmp_path: Path) -> Path:
    """Estructura `templates/cursor/rules/` con .mdc sintéticos."""
    root = tmp_path / "fake_cursor"
    rules = root / "rules"
    rules.mkdir(parents=True)
    (rules / "rule-a.mdc").write_text(
        "---\ndescription: Rule A description\n---\nbody A\n", encoding="utf-8"
    )
    (rules / "rule-b.mdc").write_text(
        "---\ndescription: Rule B description\n---\nbody B\n", encoding="utf-8"
    )
    (rules / "CLAUDE_md_context.mdc").write_text(
        "---\ndescription: Context\nalwaysApply: true\n---\nctx\n", encoding="utf-8"
    )
    return root


def test_detect_returns_false_when_empty(tmp_path: Path) -> None:
    assert CursorAdapter().detect(tmp_path) is False


def test_detect_returns_true_with_cursor_rules_dir(tmp_path: Path) -> None:
    (tmp_path / ".cursor" / "rules").mkdir(parents=True)
    assert CursorAdapter().detect(tmp_path) is True


def test_detect_returns_true_with_cursorrules_file(tmp_path: Path) -> None:
    (tmp_path / ".cursorrules").write_text("rules", encoding="utf-8")
    assert CursorAdapter().detect(tmp_path) is True


def test_degraded_features_returns_4_items() -> None:
    """Documentamos 4 features Claude-Code-only que se degradan en Cursor."""
    features = CursorAdapter().degraded_features()
    assert len(features) == 4
    feature_keys = [key for key, _ in features]
    assert "subagents-with-model" in feature_keys
    assert "hooks" in feature_keys
    assert "context-fork" in feature_keys
    assert "skills-auto-activation" in feature_keys


def test_degraded_messages_are_action_oriented() -> None:
    """Los mensajes deben mencionar Claude Code (acción, no jerga técnica)."""
    for _, message in CursorAdapter().degraded_features():
        assert "Claude Code" in message or "claude" in message.lower()


def test_deploy_copies_rules_and_compat(
    tmp_path: Path, fake_cursor_templates: Path
) -> None:
    project = tmp_path / "project"
    project.mkdir()
    with patch(
        "madkit.adapters.cursor.templates_root_for", return_value=fake_cursor_templates
    ):
        created = CursorAdapter().deploy(project)

    assert (project / ".cursor" / "rules" / "rule-a.mdc").exists()
    assert (project / ".cursor" / "rules" / "rule-b.mdc").exists()
    assert (project / ".cursor" / "rules" / "CLAUDE_md_context.mdc").exists()
    assert (project / ".cursor" / "MADKIT_COMPATIBILITY.md").exists()
    # 3 reglas + 1 compat doc = 4 paths
    assert len(created) == 4


def test_deploy_compat_doc_has_action_oriented_content(
    tmp_path: Path, fake_cursor_templates: Path
) -> None:
    project = tmp_path / "project"
    project.mkdir()
    with patch(
        "madkit.adapters.cursor.templates_root_for", return_value=fake_cursor_templates
    ):
        CursorAdapter().deploy(project)

    compat = (project / ".cursor" / "MADKIT_COMPATIBILITY.md").read_text(encoding="utf-8")
    assert "Claude Code" in compat
    assert "subagents-with-model" in compat
    assert "hooks" in compat
    assert "context-fork" in compat


def test_deploy_idempotent(tmp_path: Path, fake_cursor_templates: Path) -> None:
    project = tmp_path / "project"
    project.mkdir()
    with patch(
        "madkit.adapters.cursor.templates_root_for", return_value=fake_cursor_templates
    ):
        first = CursorAdapter().deploy(project)
        second = CursorAdapter().deploy(project)

    assert len(first) == 4
    assert second == []


def test_deploy_force_overwrites_user_modifications(
    tmp_path: Path, fake_cursor_templates: Path
) -> None:
    project = tmp_path / "project"
    project.mkdir()
    target = project / ".cursor" / "rules" / "rule-a.mdc"
    target.parent.mkdir(parents=True)
    target.write_text("USER-CUSTOM-DO-NOT-OVERWRITE", encoding="utf-8")

    with patch(
        "madkit.adapters.cursor.templates_root_for", return_value=fake_cursor_templates
    ):
        CursorAdapter().deploy(project, force=True)

    assert "USER-CUSTOM-DO-NOT-OVERWRITE" not in target.read_text(encoding="utf-8")


def test_deploy_without_force_preserves_user_modifications(
    tmp_path: Path, fake_cursor_templates: Path
) -> None:
    project = tmp_path / "project"
    project.mkdir()
    target = project / ".cursor" / "rules" / "rule-a.mdc"
    target.parent.mkdir(parents=True)
    sentinel = "USER-CUSTOM-PRESERVE-ME"
    target.write_text(sentinel, encoding="utf-8")

    with patch(
        "madkit.adapters.cursor.templates_root_for", return_value=fake_cursor_templates
    ):
        CursorAdapter().deploy(project, force=False)

    assert target.read_text(encoding="utf-8") == sentinel


def test_deploy_raises_when_templates_empty(tmp_path: Path) -> None:
    project = tmp_path / "project"
    project.mkdir()
    empty = tmp_path / "empty"
    (empty / "rules").mkdir(parents=True)  # rules/ existe pero sin .mdc

    with patch("madkit.adapters.cursor.templates_root_for", return_value=empty):
        with pytest.raises(FileNotFoundError):
            CursorAdapter().deploy(project)


def test_deploy_raises_when_rules_missing(tmp_path: Path) -> None:
    project = tmp_path / "project"
    project.mkdir()
    no_rules = tmp_path / "no_rules"
    no_rules.mkdir()  # ni siquiera rules/

    with patch("madkit.adapters.cursor.templates_root_for", return_value=no_rules):
        with pytest.raises(FileNotFoundError):
            CursorAdapter().deploy(project)
