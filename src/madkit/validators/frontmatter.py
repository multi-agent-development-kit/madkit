"""Validación de frontmatter YAML de skills/agents (V1-V8 de T073).

Implementación real en sub-fase A.4. Stub conservador por ahora.
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from pathlib import Path


class Severity(Enum):
    ABORT = "abort"  # V1-V6
    WARN = "warn"  # V7-V8


@dataclass
class ValidationFinding:
    rule: str  # "V1".."V8"
    severity: Severity
    file: Path
    message: str


def validate_frontmatter(templates_root: Path) -> list[ValidationFinding]:
    """Aplica V1-V8 sobre los templates en templates_root. Devuelve findings."""
    # Stub: implementación real en A.4
    return []
