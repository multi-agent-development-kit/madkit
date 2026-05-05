"""Validación de frontmatter YAML de skills/agents.

Port de las reglas V1-V7 de `scripts/sync_templates.{ps1,sh}` (T073) del repo
de gestión. Paridad estricta: V8 está mencionada en docs pero no implementada
en el script actual — se deja reservada para futuro.

Reglas:
- V1 [ABORT]: skill no debe declarar `model:` (causa errores de billing —
  usar `context: fork` + `agent:`).
- V2 [ABORT]: `context: fork` requiere `agent:` declarado.
- V3 [ABORT]: `agent:` declarado debe existir en upstream `agents/`.
- V4 [ABORT]: frontmatter ausente o malformado.
- V5 [ABORT]: `name:` en skill debe coincidir con el nombre del folder.
- V6 [ABORT]: agent `model:` debe ser opus|sonnet|haiku|inherit.
- V7 [WARN]:  skill `paths:` con sintaxis sospechosa (corchetes mal formados).
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from enum import Enum
from pathlib import Path

VALID_AGENT_MODELS = frozenset({"opus", "sonnet", "haiku", "inherit"})

_FRONTMATTER_RE = re.compile(r"^---\s*\r?\n(.*?)\r?\n---", re.DOTALL)


class Severity(Enum):
    ABORT = "abort"  # V1-V6
    WARN = "warn"  # V7


@dataclass(frozen=True)
class ValidationFinding:
    rule: str  # "V1".."V7"
    severity: Severity
    file: Path
    message: str

    def format(self) -> str:
        return f"[{self.file.as_posix()}] {self.rule}: {self.message}"


def parse_frontmatter(content: str) -> str | None:
    """Extrae el bloque YAML entre lineas `---`. None si ausente o malformado."""
    match = _FRONTMATTER_RE.search(content)
    return match.group(1) if match else None


def get_field(frontmatter: str, field: str) -> str | None:
    """Devuelve el valor de un campo de primer nivel del frontmatter."""
    pattern = re.compile(rf"^{re.escape(field)}:\s*(.+?)\s*$", re.MULTILINE)
    match = pattern.search(frontmatter)
    return match.group(1).strip() if match else None


def collect_agent_names(agents_dir: Path) -> set[str]:
    """Recolecta los `name:` declarados en los agents del upstream."""
    names: set[str] = set()
    if not agents_dir.exists():
        return names
    for agent_file in agents_dir.glob("*.md"):
        content = agent_file.read_text(encoding="utf-8")
        fm = parse_frontmatter(content)
        if fm:
            name = get_field(fm, "name")
            if name:
                names.add(name)
    return names


def validate_skill(skill_file: Path, upstream_agents: set[str]) -> list[ValidationFinding]:
    """Aplica V1, V2, V3, V4, V5, V7 a una skill `<folder>/SKILL.md`."""
    findings: list[ValidationFinding] = []
    folder_name = skill_file.parent.name
    rel_path = Path("skills") / folder_name / "SKILL.md"
    content = skill_file.read_text(encoding="utf-8")
    fm = parse_frontmatter(content)

    if fm is None:
        findings.append(
            ValidationFinding(
                rule="V4",
                severity=Severity.ABORT,
                file=rel_path,
                message="frontmatter ausente o malformado",
            )
        )
        return findings

    # V1: model: directo en skill
    if re.search(r"^model:\s*\S", fm, re.MULTILINE):
        findings.append(
            ValidationFinding(
                rule="V1",
                severity=Severity.ABORT,
                file=rel_path,
                message=(
                    "campo 'model:' en skill (causa errores de billing — "
                    "usar 'context: fork' + 'agent:')"
                ),
            )
        )

    # V2 + V3: context: fork sin agent: o con agent: inexistente
    if re.search(r"^context:\s*fork\s*$", fm, re.MULTILINE):
        agent_name = get_field(fm, "agent")
        if not agent_name:
            findings.append(
                ValidationFinding(
                    rule="V2",
                    severity=Severity.ABORT,
                    file=rel_path,
                    message="'context: fork' sin 'agent:' declarado",
                )
            )
        elif agent_name not in upstream_agents:
            findings.append(
                ValidationFinding(
                    rule="V3",
                    severity=Severity.ABORT,
                    file=rel_path,
                    message=f"'agent: {agent_name}' no existe en upstream agents/",
                )
            )

    # V5: name coincide con folder
    declared_name = get_field(fm, "name")
    if declared_name and declared_name != folder_name:
        findings.append(
            ValidationFinding(
                rule="V5",
                severity=Severity.ABORT,
                file=rel_path,
                message=f"name '{declared_name}' != folder '{folder_name}'",
            )
        )

    # V7 (warning): paths: con sintaxis sospechosa
    paths_match = re.search(r"^paths:\s*(.+?)\s*$", fm, re.MULTILINE)
    if paths_match:
        paths_value = paths_match.group(1).strip()
        if re.search(r"[\[\]]", paths_value) and not re.match(r"^\s*\[.+\]\s*$", paths_value):
            findings.append(
                ValidationFinding(
                    rule="V7",
                    severity=Severity.WARN,
                    file=rel_path,
                    message=f"'paths:' con sintaxis sospechosa: {paths_value}",
                )
            )

    return findings


def validate_agent(agent_file: Path) -> list[ValidationFinding]:
    """Aplica V4, V6 a un agent."""
    findings: list[ValidationFinding] = []
    rel_path = Path("agents") / agent_file.name
    content = agent_file.read_text(encoding="utf-8")
    fm = parse_frontmatter(content)

    if fm is None:
        findings.append(
            ValidationFinding(
                rule="V4",
                severity=Severity.ABORT,
                file=rel_path,
                message="frontmatter ausente o malformado",
            )
        )
        return findings

    # V6: model debe ser opus|sonnet|haiku|inherit
    model_value = get_field(fm, "model")
    if model_value and model_value not in VALID_AGENT_MODELS:
        findings.append(
            ValidationFinding(
                rule="V6",
                severity=Severity.ABORT,
                file=rel_path,
                message=(
                    f"model '{model_value}' invalido "
                    "(esperado opus|sonnet|haiku|inherit)"
                ),
            )
        )

    return findings


def validate_frontmatter(templates_root: Path) -> list[ValidationFinding]:
    """Aplica V1-V7 sobre `templates_root` (espera `agents/` y `skills/` dentro).

    Devuelve la lista completa de findings. Llamadores deciden si abortar
    según `has_abort()`.
    """
    findings: list[ValidationFinding] = []

    agents_dir = templates_root / "agents"
    skills_dir = templates_root / "skills"

    upstream_agents = collect_agent_names(agents_dir)

    if skills_dir.exists():
        for skill_file in sorted(skills_dir.rglob("SKILL.md")):
            findings.extend(validate_skill(skill_file, upstream_agents))

    if agents_dir.exists():
        for agent_file in sorted(agents_dir.glob("*.md")):
            findings.extend(validate_agent(agent_file))

    return findings


def has_abort(findings: list[ValidationFinding]) -> bool:
    """¿Hay al menos un finding con severidad ABORT?"""
    return any(f.severity is Severity.ABORT for f in findings)


def has_warn(findings: list[ValidationFinding]) -> bool:
    """¿Hay al menos un finding con severidad WARN?"""
    return any(f.severity is Severity.WARN for f in findings)
