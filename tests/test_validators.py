"""Tests de validators V1-V7 con casos sintéticos.

Cada test crea estructura mínima `tmp_path/{agents,skills}/` con frontmatter
válido o inválido y verifica que el finding correcto aparece (o no aparece).
"""
from __future__ import annotations

from pathlib import Path

import pytest

from madkit.validators.frontmatter import (
    Severity,
    has_abort,
    has_warn,
    parse_frontmatter,
    validate_frontmatter,
)


# ---------- Helpers ---------------------------------------------------------


def _write_skill(root: Path, folder: str, frontmatter: str | None, body: str = "Body") -> Path:
    skill_dir = root / "skills" / folder
    skill_dir.mkdir(parents=True, exist_ok=True)
    skill_file = skill_dir / "SKILL.md"
    if frontmatter is None:
        skill_file.write_text(body, encoding="utf-8")
    else:
        skill_file.write_text(f"---\n{frontmatter}\n---\n\n{body}\n", encoding="utf-8")
    return skill_file


def _write_agent(root: Path, name: str, frontmatter: str | None, body: str = "Body") -> Path:
    agents_dir = root / "agents"
    agents_dir.mkdir(parents=True, exist_ok=True)
    agent_file = agents_dir / f"{name}.md"
    if frontmatter is None:
        agent_file.write_text(body, encoding="utf-8")
    else:
        agent_file.write_text(f"---\n{frontmatter}\n---\n\n{body}\n", encoding="utf-8")
    return agent_file


# ---------- parse_frontmatter ----------------------------------------------


def test_parse_frontmatter_extracts_block() -> None:
    content = "---\nname: foo\nmodel: opus\n---\n\nbody"
    fm = parse_frontmatter(content)
    assert fm is not None
    assert "name: foo" in fm
    assert "model: opus" in fm


def test_parse_frontmatter_returns_none_when_absent() -> None:
    assert parse_frontmatter("# title\n\nbody only") is None


def test_parse_frontmatter_returns_none_when_only_one_delimiter() -> None:
    assert parse_frontmatter("---\nname: foo\n\nbody") is None


# ---------- V1: skill con `model:` directo ---------------------------------


def test_v1_aborts_on_model_in_skill(tmp_path: Path) -> None:
    _write_skill(tmp_path, "test-skill", "name: test-skill\nmodel: opus")
    findings = validate_frontmatter(tmp_path)
    v1 = [f for f in findings if f.rule == "V1"]
    assert len(v1) == 1
    assert v1[0].severity is Severity.ABORT


def test_v1_passes_when_no_model(tmp_path: Path) -> None:
    _write_skill(tmp_path, "test-skill", "name: test-skill\ndescription: ok")
    findings = validate_frontmatter(tmp_path)
    assert not [f for f in findings if f.rule == "V1"]


# ---------- V2 + V3: context: fork sin/con agent: -------------------------


def test_v2_aborts_on_fork_without_agent(tmp_path: Path) -> None:
    _write_skill(tmp_path, "forked", "name: forked\ncontext: fork")
    findings = validate_frontmatter(tmp_path)
    v2 = [f for f in findings if f.rule == "V2"]
    assert len(v2) == 1


def test_v3_aborts_when_agent_not_in_upstream(tmp_path: Path) -> None:
    _write_skill(tmp_path, "forked", "name: forked\ncontext: fork\nagent: nonexistent")
    findings = validate_frontmatter(tmp_path)
    v3 = [f for f in findings if f.rule == "V3"]
    assert len(v3) == 1
    assert "nonexistent" in v3[0].message


def test_v3_passes_when_agent_exists(tmp_path: Path) -> None:
    _write_agent(tmp_path, "implementer", "name: implementer\nmodel: sonnet")
    _write_skill(tmp_path, "forked", "name: forked\ncontext: fork\nagent: implementer")
    findings = validate_frontmatter(tmp_path)
    assert not [f for f in findings if f.rule in {"V2", "V3"}]


# ---------- V4: frontmatter ausente o malformado --------------------------


def test_v4_aborts_when_skill_has_no_frontmatter(tmp_path: Path) -> None:
    _write_skill(tmp_path, "broken", None, body="# only body")
    findings = validate_frontmatter(tmp_path)
    v4 = [f for f in findings if f.rule == "V4"]
    assert len(v4) == 1


def test_v4_aborts_when_agent_has_no_frontmatter(tmp_path: Path) -> None:
    _write_agent(tmp_path, "broken", None, body="# only body")
    findings = validate_frontmatter(tmp_path)
    v4 = [f for f in findings if f.rule == "V4"]
    assert len(v4) == 1


# ---------- V5: name vs folder --------------------------------------------


def test_v5_aborts_when_name_mismatches_folder(tmp_path: Path) -> None:
    _write_skill(tmp_path, "actual-folder", "name: different-name")
    findings = validate_frontmatter(tmp_path)
    v5 = [f for f in findings if f.rule == "V5"]
    assert len(v5) == 1
    assert "different-name" in v5[0].message
    assert "actual-folder" in v5[0].message


def test_v5_passes_when_name_matches(tmp_path: Path) -> None:
    _write_skill(tmp_path, "perfect", "name: perfect")
    findings = validate_frontmatter(tmp_path)
    assert not [f for f in findings if f.rule == "V5"]


# ---------- V6: agent model: válido ---------------------------------------


@pytest.mark.parametrize("model", ["opus", "sonnet", "haiku", "inherit"])
def test_v6_passes_for_valid_models(tmp_path: Path, model: str) -> None:
    _write_agent(tmp_path, f"agent-{model}", f"name: agent-{model}\nmodel: {model}")
    findings = validate_frontmatter(tmp_path)
    assert not [f for f in findings if f.rule == "V6"]


@pytest.mark.parametrize("model", ["gpt4", "claude-3-opus", "auto", ""])
def test_v6_aborts_for_invalid_models(tmp_path: Path, model: str) -> None:
    if model == "":
        # campo presente pero vacío — get_field devuelve None; V6 no aplica
        _write_agent(tmp_path, "weird", "name: weird\nmodel:")
        findings = validate_frontmatter(tmp_path)
        assert not [f for f in findings if f.rule == "V6"]
        return
    _write_agent(tmp_path, "weird", f"name: weird\nmodel: {model}")
    findings = validate_frontmatter(tmp_path)
    v6 = [f for f in findings if f.rule == "V6"]
    assert len(v6) == 1


# ---------- V7: paths con sintaxis sospechosa -----------------------------


def test_v7_warns_on_suspicious_paths(tmp_path: Path) -> None:
    _write_skill(tmp_path, "weird", "name: weird\npaths: [src/**/*.ts")  # corchete sin cerrar
    findings = validate_frontmatter(tmp_path)
    v7 = [f for f in findings if f.rule == "V7"]
    assert len(v7) == 1
    assert v7[0].severity is Severity.WARN


def test_v7_passes_on_valid_yaml_list(tmp_path: Path) -> None:
    _write_skill(tmp_path, "ok", "name: ok\npaths: [src/**/*.ts, lib/**/*.js]")
    findings = validate_frontmatter(tmp_path)
    assert not [f for f in findings if f.rule == "V7"]


def test_v7_passes_when_no_paths_field(tmp_path: Path) -> None:
    _write_skill(tmp_path, "ok", "name: ok\ndescription: simple")
    findings = validate_frontmatter(tmp_path)
    assert not [f for f in findings if f.rule == "V7"]


# ---------- has_abort / has_warn -------------------------------------------


def test_has_abort_detects_critical(tmp_path: Path) -> None:
    _write_skill(tmp_path, "broken", "name: wrong-name")
    findings = validate_frontmatter(tmp_path)
    assert has_abort(findings)


def test_has_warn_only_when_warn_present(tmp_path: Path) -> None:
    _write_skill(tmp_path, "ok", "name: ok\npaths: [src/**/*.ts")
    findings = validate_frontmatter(tmp_path)
    assert has_warn(findings)
    assert not has_abort(findings)


# ---------- Integración: estructura completa válida ------------------------


def test_full_valid_structure_returns_no_findings(tmp_path: Path) -> None:
    _write_agent(tmp_path, "implementer", "name: implementer\nmodel: sonnet")
    _write_agent(tmp_path, "reviewer", "name: reviewer\nmodel: opus")
    _write_skill(tmp_path, "cleanup", "name: cleanup\ncontext: fork\nagent: implementer")
    _write_skill(tmp_path, "review", "name: review\ncontext: fork\nagent: reviewer")
    findings = validate_frontmatter(tmp_path)
    assert findings == []
