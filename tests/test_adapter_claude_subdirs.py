"""Tests adicionales del adapter Claude: cubre branches de subdirectorios.

Los tests existentes en `test_adapter_claude.py` cubren el caso "templates
vacíos" (solo CLAUDE.md.template + .gitkeep). Estos cubren el caso "templates
poblados" simulando subdirs con archivos reales.
"""
from __future__ import annotations

from pathlib import Path
from unittest.mock import patch

import pytest

from madkit.adapters.claude import ClaudeAdapter


@pytest.fixture
def fake_templates_root(tmp_path: Path) -> Path:
    """Estructura `templates/claude/` poblada con archivos sintéticos."""
    root = tmp_path / "fake_templates"
    root.mkdir()
    (root / "CLAUDE.md.template").write_text("# Template\n", encoding="utf-8")
    # commands/
    (root / "commands").mkdir()
    (root / "commands" / "task_template.md").write_text("# task\n", encoding="utf-8")
    (root / "commands" / "task_template_python.md").write_text("# python\n", encoding="utf-8")
    # agents/
    (root / "agents").mkdir()
    (root / "agents" / "task-agent.md").write_text("# task agent\n", encoding="utf-8")
    # skills/folder/SKILL.md
    skill_dir = root / "skills" / "cleanup"
    skill_dir.mkdir(parents=True)
    (skill_dir / "SKILL.md").write_text("# cleanup\n", encoding="utf-8")
    (skill_dir / ".gitkeep").write_text("", encoding="utf-8")  # debe filtrarse
    # hooks/
    (root / "hooks").mkdir()
    (root / "hooks" / "context-monitor.js").write_text("// hook\n", encoding="utf-8")
    return root


def test_deploy_copies_all_subdirs(tmp_path: Path, fake_templates_root: Path) -> None:
    project = tmp_path / "project"
    project.mkdir()
    with patch("madkit.adapters.claude.templates_root_for", return_value=fake_templates_root):
        created = ClaudeAdapter().deploy(project)

    assert (project / "CLAUDE.md").exists()
    assert (project / ".claude" / "commands" / "task_template.md").exists()
    assert (project / ".claude" / "commands" / "task_template_python.md").exists()
    assert (project / ".claude" / "agents" / "task-agent.md").exists()
    assert (project / ".claude" / "skills" / "cleanup" / "SKILL.md").exists()
    assert (project / ".claude" / "hooks" / "context-monitor.js").exists()
    # 6 archivos esperados (CLAUDE.md + 2 commands + 1 agent + 1 skill + 1 hook)
    assert len(created) == 6


def test_deploy_filters_gitkeep(tmp_path: Path, fake_templates_root: Path) -> None:
    project = tmp_path / "project"
    project.mkdir()
    with patch("madkit.adapters.claude.templates_root_for", return_value=fake_templates_root):
        ClaudeAdapter().deploy(project)
    assert not (project / ".claude" / "skills" / "cleanup" / ".gitkeep").exists()


def test_deploy_force_overwrites_files_in_subdirs(
    tmp_path: Path, fake_templates_root: Path
) -> None:
    project = tmp_path / "project"
    project.mkdir()
    target = project / ".claude" / "commands" / "task_template.md"
    target.parent.mkdir(parents=True)
    target.write_text("USER-CUSTOMIZED-CONTENT", encoding="utf-8")

    with patch("madkit.adapters.claude.templates_root_for", return_value=fake_templates_root):
        ClaudeAdapter().deploy(project, force=True)

    assert target.read_text(encoding="utf-8") != "USER-CUSTOMIZED-CONTENT"


def test_deploy_without_force_preserves_files_in_subdirs(
    tmp_path: Path, fake_templates_root: Path
) -> None:
    project = tmp_path / "project"
    project.mkdir()
    target = project / ".claude" / "commands" / "task_template.md"
    target.parent.mkdir(parents=True)
    sentinel = "USER-CUSTOMIZED-DO-NOT-OVERWRITE"
    target.write_text(sentinel, encoding="utf-8")

    with patch("madkit.adapters.claude.templates_root_for", return_value=fake_templates_root):
        ClaudeAdapter().deploy(project, force=False)

    assert target.read_text(encoding="utf-8") == sentinel


def test_deploy_missing_template_raises(tmp_path: Path) -> None:
    project = tmp_path / "project"
    project.mkdir()
    empty_root = tmp_path / "empty_templates"
    empty_root.mkdir()
    with patch("madkit.adapters.claude.templates_root_for", return_value=empty_root):
        with pytest.raises(FileNotFoundError):
            ClaudeAdapter().deploy(project)


def test_deploy_handles_missing_subdir_gracefully(tmp_path: Path) -> None:
    """Si un subdir (e.g. hooks/) no existe en templates, deploy lo salta sin fallar."""
    project = tmp_path / "project"
    project.mkdir()
    minimal_root = tmp_path / "minimal"
    minimal_root.mkdir()
    (minimal_root / "CLAUDE.md.template").write_text("# minimal\n", encoding="utf-8")
    # solo CLAUDE.md.template, sin agents/commands/skills/hooks

    with patch("madkit.adapters.claude.templates_root_for", return_value=minimal_root):
        created = ClaudeAdapter().deploy(project)

    assert (project / "CLAUDE.md").exists()
    assert len(created) == 1  # solo CLAUDE.md
