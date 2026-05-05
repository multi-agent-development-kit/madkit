"""Tests del adapter Claude: detect, deploy, idempotencia."""
from __future__ import annotations

from pathlib import Path

import pytest

from madkit.adapters.claude import ClaudeAdapter


def test_detect_returns_false_when_empty(tmp_path: Path) -> None:
    assert ClaudeAdapter().detect(tmp_path) is False


def test_detect_returns_true_when_agents_dir_exists(tmp_path: Path) -> None:
    (tmp_path / ".claude" / "agents").mkdir(parents=True)
    assert ClaudeAdapter().detect(tmp_path) is True


def test_detect_returns_true_when_commands_dir_exists(tmp_path: Path) -> None:
    (tmp_path / ".claude" / "commands").mkdir(parents=True)
    assert ClaudeAdapter().detect(tmp_path) is True


def test_degraded_features_is_empty() -> None:
    assert ClaudeAdapter().degraded_features() == []


def test_deploy_creates_claude_md_from_template(tmp_path: Path) -> None:
    """Verifica que CLAUDE.md se crea desde el template embebido del paquete."""
    adapter = ClaudeAdapter()
    created = adapter.deploy(tmp_path)
    target_claude_md = tmp_path / "CLAUDE.md"
    assert target_claude_md.exists()
    assert target_claude_md in created
    # Contenido viene del template embebido — no debe estar vacío
    content = target_claude_md.read_text(encoding="utf-8")
    assert len(content) > 100


def test_deploy_does_not_overwrite_existing_claude_md(tmp_path: Path) -> None:
    """Sin force, un CLAUDE.md preexistente se preserva."""
    target = tmp_path / "CLAUDE.md"
    target.write_text("custom content of user", encoding="utf-8")
    ClaudeAdapter().deploy(tmp_path)
    assert target.read_text(encoding="utf-8") == "custom content of user"


def test_deploy_with_force_overwrites_claude_md(tmp_path: Path) -> None:
    target = tmp_path / "CLAUDE.md"
    target.write_text("custom content", encoding="utf-8")
    ClaudeAdapter().deploy(tmp_path, force=True)
    new_content = target.read_text(encoding="utf-8")
    assert "custom content" not in new_content
    assert len(new_content) > 100


def test_deploy_is_idempotent(tmp_path: Path) -> None:
    """Llamar deploy dos veces no produce errores ni duplicados extraños."""
    adapter = ClaudeAdapter()
    first = adapter.deploy(tmp_path)
    second = adapter.deploy(tmp_path)
    # Segunda pasada no crea nada (todo ya existe)
    assert second == []
    # CLAUDE.md sigue existiendo
    assert (tmp_path / "CLAUDE.md").exists()
    # Y la primera sí creó algo
    assert len(first) >= 1


def test_deploy_skips_gitkeep(tmp_path: Path) -> None:
    """Los archivos .gitkeep no deben copiarse al proyecto destino."""
    ClaudeAdapter().deploy(tmp_path)
    # Si existieran subdirs como .claude/commands/.gitkeep, no se debe haber copiado
    for gitkeep in (tmp_path / ".claude").rglob(".gitkeep"):
        pytest.fail(f".gitkeep filtrado fallidamente: {gitkeep}")
