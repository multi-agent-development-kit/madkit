"""Genera adapters Cursor y Codex desde el repo de gestión.

Lee las reglas `.cursor/rules/*.mdc` del repo de gestión y filtra las que
tienen `description:` no vacía (las únicas que Cursor auto-activa). Genera
también `CLAUDE_md_context.mdc` (Cursor) y `AGENTS.md.template` (Codex)
incluyendo el contenido de `CLAUDE.md.template` como contexto.

Ejecutado:
- Manualmente durante desarrollo: `python scripts/generate_adapters.py
  --source ../AI-Coding-Resources --target src/madkit/templates`
- En CI por `sync_from_management.yml` (sub-fase D del task 083).
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

_FRONTMATTER_RE = re.compile(r"^---\s*\r?\n(.*?)\r?\n---", re.DOTALL)
_DESCRIPTION_RE = re.compile(r"^description:\s*(.*)$", re.MULTILINE)


def parse_description(content: str) -> str | None:
    """Devuelve la `description:` del frontmatter, o None si vacía/ausente."""
    fm_match = _FRONTMATTER_RE.search(content)
    if not fm_match:
        return None
    desc_match = _DESCRIPTION_RE.search(fm_match.group(1))
    if not desc_match:
        return None
    desc = desc_match.group(1).strip()
    return desc if desc else None


def filter_cursor_rules(
    source_rules_dir: Path,
    target_rules_dir: Path,
) -> tuple[list[str], list[str]]:
    """Copia .mdc con `description:` no vacía. Devuelve `(incluidas, excluidas)`."""
    target_rules_dir.mkdir(parents=True, exist_ok=True)
    # Limpia destino para evitar reglas obsoletas
    for stale in target_rules_dir.glob("*.mdc"):
        stale.unlink()

    included: list[str] = []
    excluded: list[str] = []

    for mdc in sorted(source_rules_dir.glob("*.mdc")):
        content = mdc.read_text(encoding="utf-8")
        if parse_description(content) is None:
            excluded.append(mdc.name)
            continue
        (target_rules_dir / mdc.name).write_text(content, encoding="utf-8")
        included.append(mdc.name)

    return included, excluded


def generate_claude_md_context(
    claude_md_template: Path,
    target_rules_dir: Path,
) -> Path:
    """Genera `CLAUDE_md_context.mdc` para Cursor."""
    template_content = claude_md_template.read_text(encoding="utf-8")
    output = target_rules_dir / "CLAUDE_md_context.mdc"
    output.write_text(
        "---\n"
        "description: Contexto del framework MAD (estilo, estructura, modelos, delegación). "
        "Auto-generado desde CLAUDE.md.template por madkit.\n"
        "alwaysApply: true\n"
        "---\n\n"
        f"{template_content}\n",
        encoding="utf-8",
    )
    return output


def generate_codex_agents_template(
    claude_md_template: Path,
    target_codex_dir: Path,
) -> Path:
    """Genera `AGENTS.md.template` para Codex / GitHub Copilot."""
    target_codex_dir.mkdir(parents=True, exist_ok=True)
    template_content = claude_md_template.read_text(encoding="utf-8")
    output = target_codex_dir / "AGENTS.md.template"
    output.write_text(
        "# Project Agents Configuration\n\n"
        "<!-- Auto-generado desde CLAUDE.md.template por madkit (sub-fase B/C de task 083). -->\n"
        "<!-- Codex / GitHub Copilot leen este archivo como contexto del proyecto. -->\n\n"
        f"{template_content}\n",
        encoding="utf-8",
    )
    return output


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Genera adapters Cursor y Codex desde el repo de gestión."
    )
    parser.add_argument(
        "--source",
        type=Path,
        required=True,
        help="Raíz del repo de gestión (debe contener `.cursor/rules/`).",
    )
    parser.add_argument(
        "--target",
        type=Path,
        required=True,
        help="Raíz `src/madkit/templates/` del paquete (contiene `claude/`, `cursor/`, `codex/`).",
    )
    parser.add_argument(
        "--claude-md",
        type=Path,
        default=None,
        help="Path al CLAUDE.md.template (default: <target>/claude/CLAUDE.md.template).",
    )
    args = parser.parse_args(argv)

    source_rules = args.source / ".cursor" / "rules"
    target_cursor = args.target / "cursor" / "rules"
    target_codex = args.target / "codex"
    claude_md = args.claude_md or (args.target / "claude" / "CLAUDE.md.template")

    if not source_rules.exists():
        print(f"ERROR: source no existe: {source_rules}", file=sys.stderr)
        return 1
    if not claude_md.exists():
        print(f"ERROR: CLAUDE.md.template no existe: {claude_md}", file=sys.stderr)
        return 1

    included, excluded = filter_cursor_rules(source_rules, target_cursor)
    context_mdc = generate_claude_md_context(claude_md, target_cursor)
    codex_template = generate_codex_agents_template(claude_md, target_codex)

    print(f"Reglas Cursor incluidas (description no vacía): {len(included)}")
    for name in included:
        print(f"  + {name}")
    print(f"\nReglas Cursor excluidas (description vacía): {len(excluded)}")
    for name in excluded:
        print(f"  - {name}")
    print("\nGenerados:")
    print(f"  - {context_mdc.relative_to(args.target)}")
    print(f"  - {codex_template.relative_to(args.target)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
