"""Tests del comando `madkit iniciar` — flujo completo en tmp_path."""
from __future__ import annotations

from pathlib import Path

from typer.testing import CliRunner

from madkit.cli import app

runner = CliRunner()


def test_iniciar_creates_ai_docs_structure(tmp_path: Path) -> None:
    result = runner.invoke(app, ["iniciar", str(tmp_path), "--ide", "claude"])
    assert result.exit_code == 0, result.output
    for subdir in ("core", "tasks", "refs"):
        assert (tmp_path / "ai_docs" / subdir).is_dir()


def test_iniciar_creates_claude_md(tmp_path: Path) -> None:
    result = runner.invoke(app, ["iniciar", str(tmp_path), "--ide", "claude"])
    assert result.exit_code == 0, result.output
    assert (tmp_path / "CLAUDE.md").exists()


def test_iniciar_writes_gitignore_with_ai_docs(tmp_path: Path) -> None:
    result = runner.invoke(app, ["iniciar", str(tmp_path), "--ide", "claude"])
    assert result.exit_code == 0
    gitignore = (tmp_path / ".gitignore").read_text(encoding="utf-8")
    assert "ai_docs/" in gitignore


def test_iniciar_aborts_when_already_initialized(tmp_path: Path) -> None:
    """Sin --force, abort si .claude/agents/ ya existe."""
    (tmp_path / ".claude" / "agents").mkdir(parents=True)
    result = runner.invoke(app, ["iniciar", str(tmp_path), "--ide", "claude"])
    assert result.exit_code == 1
    assert "scaffolding" in result.output.lower() or "force" in result.output.lower()


def test_iniciar_force_overwrites(tmp_path: Path) -> None:
    """Con --force, sobreescribe preexistente."""
    (tmp_path / ".claude" / "agents").mkdir(parents=True)
    sentinel = "USER-CUSTOM-CONTENT-XYZ123"
    (tmp_path / "CLAUDE.md").write_text(sentinel, encoding="utf-8")
    result = runner.invoke(app, ["iniciar", str(tmp_path), "--ide", "claude", "--force"])
    assert result.exit_code == 0, result.output
    new_content = (tmp_path / "CLAUDE.md").read_text(encoding="utf-8")
    assert sentinel not in new_content


def test_iniciar_invalid_ide_returns_error(tmp_path: Path) -> None:
    """`aider` no está soportado en esta versión — debe rechazar."""
    result = runner.invoke(app, ["iniciar", str(tmp_path), "--ide", "aider"])
    assert result.exit_code == 1
    assert "aider" in result.output


def test_iniciar_path_not_dir_returns_error(tmp_path: Path) -> None:
    nonexistent = tmp_path / "does-not-exist"
    result = runner.invoke(app, ["iniciar", str(nonexistent), "--ide", "claude"])
    assert result.exit_code == 1


def test_iniciar_alias_init_works(tmp_path: Path) -> None:
    result = runner.invoke(app, ["init", str(tmp_path), "--ide", "claude"])
    assert result.exit_code == 0
    assert (tmp_path / "CLAUDE.md").exists()


def test_iniciar_auto_detects_existing_claude(tmp_path: Path) -> None:
    """Con .claude/agents/ preexistente, --ide=auto resuelve a claude → abort sin force."""
    (tmp_path / ".claude" / "agents").mkdir(parents=True)
    result = runner.invoke(app, ["iniciar", str(tmp_path), "--ide", "auto"])
    assert result.exit_code == 1


def test_iniciar_quiet_suppresses_progress_output(tmp_path: Path) -> None:
    result = runner.invoke(app, ["iniciar", str(tmp_path), "--ide", "claude", "--quiet"])
    assert result.exit_code == 0
    # Sin --quiet imprime ~5 líneas; con --quiet sale silencioso
    assert result.output.count("\n") <= 1


def test_iniciar_appends_ai_docs_to_existing_gitignore(tmp_path: Path) -> None:
    (tmp_path / ".gitignore").write_text("__pycache__/\n.venv/\n", encoding="utf-8")
    result = runner.invoke(app, ["iniciar", str(tmp_path), "--ide", "claude"])
    assert result.exit_code == 0
    gitignore = (tmp_path / ".gitignore").read_text(encoding="utf-8")
    assert "__pycache__/" in gitignore
    assert ".venv/" in gitignore
    assert "ai_docs/" in gitignore


def test_iniciar_does_not_duplicate_gitignore_entry(tmp_path: Path) -> None:
    (tmp_path / ".gitignore").write_text("ai_docs/\nnode_modules/\n", encoding="utf-8")
    result = runner.invoke(app, ["iniciar", str(tmp_path), "--ide", "claude"])
    assert result.exit_code == 0
    gitignore = (tmp_path / ".gitignore").read_text(encoding="utf-8")
    assert gitignore.count("ai_docs/") == 1


# ---------- --ide=cursor ----------------------------------------------------


def test_iniciar_cursor_creates_rules_dir(tmp_path: Path) -> None:
    result = runner.invoke(app, ["iniciar", str(tmp_path), "--ide", "cursor"])
    assert result.exit_code == 0, result.output
    assert (tmp_path / ".cursor" / "rules").is_dir()
    # Esperamos que se hayan copiado las reglas embebidas (≥ 1 .mdc)
    rules = list((tmp_path / ".cursor" / "rules").glob("*.mdc"))
    assert len(rules) >= 1


def test_iniciar_cursor_creates_compatibility_doc(tmp_path: Path) -> None:
    result = runner.invoke(app, ["iniciar", str(tmp_path), "--ide", "cursor"])
    assert result.exit_code == 0
    compat = tmp_path / ".cursor" / "MADKIT_COMPATIBILITY.md"
    assert compat.exists()
    content = compat.read_text(encoding="utf-8")
    assert "Claude Code" in content


def test_iniciar_cursor_does_not_create_claude_md(tmp_path: Path) -> None:
    """--ide=cursor NO debe crear CLAUDE.md (es scaffolding Claude)."""
    result = runner.invoke(app, ["iniciar", str(tmp_path), "--ide", "cursor"])
    assert result.exit_code == 0
    assert not (tmp_path / "CLAUDE.md").exists()


def test_iniciar_cursor_aborts_when_already_initialized(tmp_path: Path) -> None:
    (tmp_path / ".cursor" / "rules").mkdir(parents=True)
    result = runner.invoke(app, ["iniciar", str(tmp_path), "--ide", "cursor"])
    assert result.exit_code == 1


# ---------- --ide=all coexistencia -----------------------------------------


def test_iniciar_all_deploys_claude_and_cursor(tmp_path: Path) -> None:
    """Con --ide=all, claude despliega CLAUDE.md y cursor despliega .cursor/rules/.

    Los subdirectorios `.claude/{commands,agents,skills,hooks}` se poblarán cuando
    la sub-fase D del task 083 sincronice los templates desde el repo de gestión.
    """
    result = runner.invoke(app, ["iniciar", str(tmp_path), "--ide", "all"])
    assert result.exit_code == 0, result.output
    assert (tmp_path / "CLAUDE.md").exists()
    assert (tmp_path / ".cursor" / "rules").is_dir()
    assert (tmp_path / ".cursor" / "MADKIT_COMPATIBILITY.md").exists()
    rules = list((tmp_path / ".cursor" / "rules").glob("*.mdc"))
    assert len(rules) >= 1


def test_iniciar_all_aborts_when_either_already_initialized(tmp_path: Path) -> None:
    """Si --ide=all y .claude/ ya existe, abort sin --force (primer adapter en orden)."""
    (tmp_path / ".claude" / "agents").mkdir(parents=True)
    result = runner.invoke(app, ["iniciar", str(tmp_path), "--ide", "all"])
    assert result.exit_code == 1


# ---------- --ide=codex ----------------------------------------------------


def test_iniciar_codex_creates_agents_md(tmp_path: Path) -> None:
    result = runner.invoke(app, ["iniciar", str(tmp_path), "--ide", "codex"])
    assert result.exit_code == 0, result.output
    assert (tmp_path / "AGENTS.md").exists()


def test_iniciar_codex_does_not_create_claude_or_cursor(tmp_path: Path) -> None:
    result = runner.invoke(app, ["iniciar", str(tmp_path), "--ide", "codex"])
    assert result.exit_code == 0
    assert not (tmp_path / "CLAUDE.md").exists()
    assert not (tmp_path / ".cursor").exists()
    assert not (tmp_path / ".claude").exists()


def test_iniciar_codex_aborts_when_agents_md_exists(tmp_path: Path) -> None:
    """Consistente con claude/cursor: si detect es True, abort sin --force."""
    sentinel = "USER-CUSTOM-AGENTS-MD"
    (tmp_path / "AGENTS.md").write_text(sentinel, encoding="utf-8")
    result = runner.invoke(app, ["iniciar", str(tmp_path), "--ide", "codex"])
    assert result.exit_code == 1
    # El AGENTS.md original debe preservarse intacto
    assert (tmp_path / "AGENTS.md").read_text(encoding="utf-8") == sentinel


def test_iniciar_codex_force_overwrites_existing(tmp_path: Path) -> None:
    sentinel = "USER-CUSTOM-OLD-CONTENT"
    (tmp_path / "AGENTS.md").write_text(sentinel, encoding="utf-8")
    result = runner.invoke(app, ["iniciar", str(tmp_path), "--ide", "codex", "--force"])
    assert result.exit_code == 0
    assert (tmp_path / "AGENTS.md").read_text(encoding="utf-8") != sentinel


def test_iniciar_all_creates_all_three_scaffoldings(tmp_path: Path) -> None:
    result = runner.invoke(app, ["iniciar", str(tmp_path), "--ide", "all"])
    assert result.exit_code == 0, result.output
    assert (tmp_path / "CLAUDE.md").exists()
    assert (tmp_path / ".cursor" / "rules").is_dir()
    assert (tmp_path / "AGENTS.md").exists()
