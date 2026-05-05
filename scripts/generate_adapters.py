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


def generate_cline_template(claude_md_template: Path, target_cline_dir: Path) -> Path:
    """Genera `clinerules.template` para Cline (T088)."""
    target_cline_dir.mkdir(parents=True, exist_ok=True)
    template_content = claude_md_template.read_text(encoding="utf-8")
    output = target_cline_dir / "clinerules.template"
    output.write_text(
        "# Cline Project Rules\n\n"
        "<!-- Auto-generado desde CLAUDE.md.template por madkit (T088). -->\n"
        "<!-- Cline lee `.clinerules` como contexto del proyecto. -->\n\n"
        f"{template_content}\n",
        encoding="utf-8",
    )
    return output


def generate_continue_template(claude_md_template: Path, target_continue_dir: Path) -> Path:
    """Genera `continue_config.yaml.template` para Continue (T088).

    Continue espera YAML con `systemMessage` o sección equivalente. Se
    embebe el contenido de `CLAUDE.md.template` como systemMessage en
    formato YAML literal block.
    """
    target_continue_dir.mkdir(parents=True, exist_ok=True)
    template_content = claude_md_template.read_text(encoding="utf-8")
    # Indentar 2 espacios para que sea válido como bloque literal YAML
    indented_content = "\n".join("  " + line for line in template_content.splitlines())
    output = target_continue_dir / "continue_config.yaml.template"
    output.write_text(
        "# Continue project config\n"
        "# Auto-generado desde CLAUDE.md.template por madkit (T088).\n"
        "# Continue lee este archivo como configuración del proyecto.\n"
        "\n"
        "name: madkit-project\n"
        "version: 0.0.1\n"
        "schema: v1\n"
        "\n"
        "# Contexto del framework MAD inyectado como systemMessage\n"
        "systemMessage: |\n"
        f"{indented_content}\n",
        encoding="utf-8",
    )
    return output


def generate_windsurf_template(claude_md_template: Path, target_windsurf_dir: Path) -> Path:
    """Genera `windsurfrules.template` para Windsurf (T088)."""
    target_windsurf_dir.mkdir(parents=True, exist_ok=True)
    template_content = claude_md_template.read_text(encoding="utf-8")
    output = target_windsurf_dir / "windsurfrules.template"
    output.write_text(
        "# Windsurf Project Rules\n\n"
        "<!-- Auto-generado desde CLAUDE.md.template por madkit (T088). -->\n"
        "<!-- Windsurf lee `.windsurfrules` como contexto del proyecto. -->\n\n"
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

    target_cline = args.target / "cline"
    target_continue = args.target / "continue"
    target_windsurf = args.target / "windsurf"

    included, excluded = filter_cursor_rules(source_rules, target_cursor)
    context_mdc = generate_claude_md_context(claude_md, target_cursor)
    codex_template = generate_codex_agents_template(claude_md, target_codex)
    cline_template = generate_cline_template(claude_md, target_cline)
    continue_template = generate_continue_template(claude_md, target_continue)
    windsurf_template = generate_windsurf_template(claude_md, target_windsurf)

    print(f"Reglas Cursor incluidas (description no vacía): {len(included)}")
    for name in included:
        print(f"  + {name}")
    print(f"\nReglas Cursor excluidas (description vacía): {len(excluded)}")
    for name in excluded:
        print(f"  - {name}")
    print("\nGenerados:")
    print(f"  - {context_mdc.relative_to(args.target)}")
    print(f"  - {codex_template.relative_to(args.target)}")
    print(f"  - {cline_template.relative_to(args.target)}")
    print(f"  - {continue_template.relative_to(args.target)}")
    print(f"  - {windsurf_template.relative_to(args.target)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
