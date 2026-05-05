"""Sanea referencias narrativas al repo privado AI-Coding-Resources antes de embeber.

Bloqueante en CI: si quedan URLs `repos/gmoncor/AI-Coding-Resources-v2` después
de la sanitización, el script falla con exit ≠ 0.

Implementación real en sub-fase D del task 083. Stub conservador por ahora.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

# Patrones que NUNCA deben quedar tras sanear
FORBIDDEN_PATTERNS = [
    re.compile(r"repos/gmoncor/AI-Coding-Resources-v2", re.IGNORECASE),
    re.compile(r"gmoncor/AI-Coding-Resources(-v\d+)?", re.IGNORECASE),
]

# Patrones que se reemplazan por contexto neutral
REPLACEMENTS: list[tuple[re.Pattern[str], str]] = [
    # Mención narrativa al repo privado
    (re.compile(r"AI-Coding-Resources-v\d+", re.IGNORECASE), "el repo de gestión upstream"),
    (re.compile(r"AI-Coding-Resources(?!-)", re.IGNORECASE), "el repo de gestión upstream"),
]

# Archivos excluidos del embed (no se sanean, no se distribuyen).
# `sync_upstream.md` actual contiene URLs concretas al repo privado vía `gh api`;
# se mantiene fuera del wheel hasta que sub-task 084 lo reescriba como wrapper de
# `madkit sincronizar`. README.md tiene README propio en el wheel.
EXCLUDE_FILES = {"README.md", "sync_upstream.md"}


def sanitize_file(path: Path) -> tuple[bool, list[str]]:
    """Sanea un archivo. Devuelve (modificado, findings_bloqueantes).

    Orden importante:
    1. Si el archivo está excluido → no tocar, no reportar.
    2. Si contiene patrón prohibido (URL concreta al repo privado) → BLOQUEA
       sin modificar. El maintainer debe reescribir o excluir el archivo.
    3. Si solo tiene menciones narrativas saneables → reemplaza y reporta.
    """
    if path.name in EXCLUDE_FILES:
        return False, []

    content = path.read_text(encoding="utf-8")

    # 1) Bloqueo inmediato si hay URL concreta al repo privado
    findings: list[str] = []
    for forbidden in FORBIDDEN_PATTERNS:
        if forbidden.search(content):
            findings.append(
                f"{path}: contiene patrón prohibido {forbidden.pattern!r} "
                "— excluir del embed o reescribir antes de sincronizar"
            )
    if findings:
        return False, findings

    # 2) Sanea menciones narrativas seguras
    original = content
    for pattern, replacement in REPLACEMENTS:
        content = pattern.sub(replacement, content)

    if content != original:
        path.write_text(content, encoding="utf-8")
        return True, []

    return False, []


def main(templates_root: Path) -> int:
    if not templates_root.exists():
        print(f"ERROR: no existe {templates_root}", file=sys.stderr)
        return 1

    modified: list[Path] = []
    failures: list[str] = []

    for path in templates_root.rglob("*"):
        if path.is_file() and path.suffix in {".md", ".txt", ".json", ".yml", ".yaml"}:
            was_modified, findings = sanitize_file(path)
            if was_modified:
                modified.append(path)
            failures.extend(findings)

    print(f"Archivos modificados: {len(modified)}")
    for path in modified:
        print(f"  - {path}")

    if failures:
        print(f"\nERROR: {len(failures)} archivos aún contienen patrones prohibidos:", file=sys.stderr)
        for failure in failures:
            print(f"  - {failure}", file=sys.stderr)
        return 2

    print("\nSanitización OK. Cero referencias prohibidas restantes.")
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Uso: python sanitize_template_refs.py <templates_root>", file=sys.stderr)
        sys.exit(1)
    sys.exit(main(Path(sys.argv[1])))
