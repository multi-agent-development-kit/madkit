"""Tests de scripts/sanitize_template_refs.py — saneamiento + bloqueo de patrones prohibidos."""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

SCRIPT_DIR = Path(__file__).parent.parent / "scripts"
sys.path.insert(0, str(SCRIPT_DIR))
import sanitize_template_refs  # noqa: E402


def test_sanitize_replaces_narrative_reference(tmp_path: Path) -> None:
    target = tmp_path / "skill.md"
    target.write_text(
        "Ver `AI-Coding-Resources/claude-templates/...` para más info.",
        encoding="utf-8",
    )
    modified, findings = sanitize_template_refs.sanitize_file(target)
    assert modified is True
    assert findings == []
    new = target.read_text(encoding="utf-8")
    assert "AI-Coding-Resources" not in new
    assert "el repo de gestión upstream" in new


def test_sanitize_blocks_forbidden_url(tmp_path: Path) -> None:
    """URL concreta al repo privado bloquea sin modificar el archivo."""
    target = tmp_path / "arbitrary.md"
    original = "gh api repos/gmoncor/AI-Coding-Resources-v2/contents/scripts"
    target.write_text(original, encoding="utf-8")
    modified, findings = sanitize_template_refs.sanitize_file(target)
    assert modified is False
    assert findings, "se esperaba finding bloqueante para URL repos/gmoncor/..."
    # El archivo NO debe haberse modificado
    assert target.read_text(encoding="utf-8") == original


def test_sanitize_skips_excluded_readme(tmp_path: Path) -> None:
    target = tmp_path / "README.md"
    target.write_text("AI-Coding-Resources here", encoding="utf-8")
    modified, findings = sanitize_template_refs.sanitize_file(target)
    assert modified is False
    assert findings == []


def test_sanitize_skips_excluded_sync_upstream(tmp_path: Path) -> None:
    """sync_upstream.md actual contiene URLs concretas — está en EXCLUDE_FILES
    hasta que sub-task 084 lo reescriba como wrapper de madkit sincronizar.
    """
    target = tmp_path / "sync_upstream.md"
    target.write_text(
        "gh api repos/gmoncor/AI-Coding-Resources-v2/contents/scripts/sync_templates.sh",
        encoding="utf-8",
    )
    modified, findings = sanitize_template_refs.sanitize_file(target)
    assert modified is False
    assert findings == []


def test_sanitize_no_change_when_no_match(tmp_path: Path) -> None:
    target = tmp_path / "clean.md"
    target.write_text("Just a clean template with no refs.", encoding="utf-8")
    modified, findings = sanitize_template_refs.sanitize_file(target)
    assert modified is False
    assert findings == []


def test_main_returns_0_on_clean_tree(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    (tmp_path / "a.md").write_text("clean", encoding="utf-8")
    (tmp_path / "b.md").write_text("Ver AI-Coding-Resources docs.", encoding="utf-8")
    rc = sanitize_template_refs.main(tmp_path)
    assert rc == 0
    captured = capsys.readouterr()
    assert "Sanitización OK" in captured.out


def test_main_returns_2_when_forbidden_remains(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    (tmp_path / "broken.md").write_text(
        "URL: repos/gmoncor/AI-Coding-Resources-v2/something",
        encoding="utf-8",
    )
    rc = sanitize_template_refs.main(tmp_path)
    assert rc == 2
    captured = capsys.readouterr()
    assert (
        "patrones prohibidos" in captured.err.lower()
        or "patrón prohibido" in captured.err.lower()
    )


def test_main_returns_1_when_root_missing(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    rc = sanitize_template_refs.main(tmp_path / "nope")
    assert rc == 1
