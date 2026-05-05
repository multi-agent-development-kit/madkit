"""Tests de scripts/generate_adapters.py — filtrado y generación."""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

# importamos el script como módulo (vive en scripts/)
SCRIPT_DIR = Path(__file__).parent.parent / "scripts"
sys.path.insert(0, str(SCRIPT_DIR))
import generate_adapters  # noqa: E402


# ---------- parse_description ----------------------------------------------


def test_parse_description_returns_value_when_present() -> None:
    content = "---\nname: foo\ndescription: This is a rule\n---\n\nbody"
    assert generate_adapters.parse_description(content) == "This is a rule"


def test_parse_description_returns_none_when_empty() -> None:
    content = "---\nname: foo\ndescription: \n---\n\nbody"
    assert generate_adapters.parse_description(content) is None


def test_parse_description_returns_none_when_only_whitespace() -> None:
    content = "---\nname: foo\ndescription:    \n---\n\nbody"
    assert generate_adapters.parse_description(content) is None


def test_parse_description_returns_none_when_no_frontmatter() -> None:
    assert generate_adapters.parse_description("body only") is None


def test_parse_description_returns_none_when_no_description_field() -> None:
    content = "---\nname: foo\nglobs: ['**/*']\n---\n\nbody"
    assert generate_adapters.parse_description(content) is None


# ---------- filter_cursor_rules --------------------------------------------


def test_filter_includes_only_with_description(tmp_path: Path) -> None:
    src = tmp_path / "src_rules"
    dst = tmp_path / "dst_rules"
    src.mkdir()
    (src / "with-desc.mdc").write_text(
        "---\ndescription: Has it\n---\nbody\n", encoding="utf-8"
    )
    (src / "empty-desc.mdc").write_text(
        "---\ndescription: \n---\nbody\n", encoding="utf-8"
    )
    (src / "no-desc.mdc").write_text(
        "---\nname: foo\n---\nbody\n", encoding="utf-8"
    )

    included, excluded = generate_adapters.filter_cursor_rules(src, dst)

    assert included == ["with-desc.mdc"]
    assert sorted(excluded) == ["empty-desc.mdc", "no-desc.mdc"]
    assert (dst / "with-desc.mdc").exists()
    assert not (dst / "empty-desc.mdc").exists()
    assert not (dst / "no-desc.mdc").exists()


def test_filter_cleans_stale_files_from_target(tmp_path: Path) -> None:
    """Reglas previas en target/ se eliminan para evitar obsoletas."""
    src = tmp_path / "src_rules"
    dst = tmp_path / "dst_rules"
    src.mkdir()
    dst.mkdir()
    (dst / "old-stale.mdc").write_text("stale", encoding="utf-8")
    (src / "new.mdc").write_text(
        "---\ndescription: ok\n---\nbody\n", encoding="utf-8"
    )

    generate_adapters.filter_cursor_rules(src, dst)

    assert not (dst / "old-stale.mdc").exists()
    assert (dst / "new.mdc").exists()


# ---------- generate_claude_md_context -------------------------------------


def test_claude_md_context_embeds_template(tmp_path: Path) -> None:
    template = tmp_path / "CLAUDE.md.template"
    template.write_text("# Template content\n\nBody body", encoding="utf-8")
    target = tmp_path / "rules"
    target.mkdir()

    output = generate_adapters.generate_claude_md_context(template, target)

    content = output.read_text(encoding="utf-8")
    assert content.startswith("---")
    assert "alwaysApply: true" in content
    assert "Template content" in content
    assert output.name == "CLAUDE_md_context.mdc"


# ---------- generate_codex_agents_template ---------------------------------


def test_codex_agents_template_embeds_template(tmp_path: Path) -> None:
    template = tmp_path / "CLAUDE.md.template"
    template.write_text("# Project rules\n\nLines", encoding="utf-8")
    target = tmp_path / "codex"

    output = generate_adapters.generate_codex_agents_template(template, target)

    content = output.read_text(encoding="utf-8")
    assert content.startswith("# Project Agents Configuration")
    assert "# Project rules" in content
    assert output.name == "AGENTS.md.template"


# ---------- main (integración mínima) -------------------------------------


def test_main_returns_1_when_source_missing(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    target = tmp_path / "target"
    target.mkdir()
    rc = generate_adapters.main(["--source", str(tmp_path / "nope"), "--target", str(target)])
    assert rc == 1
    captured = capsys.readouterr()
    assert "no existe" in captured.err.lower()


def test_main_returns_1_when_claude_md_missing(tmp_path: Path) -> None:
    source = tmp_path / "source"
    (source / ".cursor" / "rules").mkdir(parents=True)
    target = tmp_path / "target"
    target.mkdir()  # sin claude/CLAUDE.md.template

    rc = generate_adapters.main(["--source", str(source), "--target", str(target)])
    assert rc == 1


def test_main_full_flow(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    source = tmp_path / "source"
    rules_src = source / ".cursor" / "rules"
    rules_src.mkdir(parents=True)
    (rules_src / "good.mdc").write_text(
        "---\ndescription: ok\n---\nbody\n", encoding="utf-8"
    )
    (rules_src / "bad.mdc").write_text(
        "---\ndescription: \n---\nbody\n", encoding="utf-8"
    )

    target = tmp_path / "target"
    (target / "claude").mkdir(parents=True)
    (target / "claude" / "CLAUDE.md.template").write_text(
        "# Project Template\n\nDoc body.", encoding="utf-8"
    )

    rc = generate_adapters.main(["--source", str(source), "--target", str(target)])
    assert rc == 0
    assert (target / "cursor" / "rules" / "good.mdc").exists()
    assert not (target / "cursor" / "rules" / "bad.mdc").exists()
    assert (target / "cursor" / "rules" / "CLAUDE_md_context.mdc").exists()
    assert (target / "codex" / "AGENTS.md.template").exists()

    captured = capsys.readouterr()
    assert "good.mdc" in captured.out
    assert "bad.mdc" in captured.out
