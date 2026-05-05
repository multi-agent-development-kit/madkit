# madkit

> Multi-Agent Development Kit. **MAD by name. Methodical by design.**

CLI for multi-IDE scaffolding of agent-assisted projects. Mechanical bootstrap, validated sync and IDE detection in a single tool.

**Current status:** v0.1.0.dev0 — alpha in active development. The first end-to-end verifiable release is v0.1.0.

> Para la versión en español, ver [README.md](README.md).

---

## Quick install

**Lightweight mode — install nothing first:**

```bash
uvx madkit iniciar .   # works in either language; aliases below
```

**Recurring mode — install once:**

```bash
uv tool install madkit
madkit init .          # English alias of `madkit iniciar`
```

Requires [uv](https://docs.astral.sh/uv/) and Python ≥3.11.

---

## Commands

| Command | EN alias | Purpose |
|---|---|---|
| `madkit iniciar [path]` | `init` | Mechanical bootstrap: ai_docs/, CLAUDE.md and IDE scaffolding |
| `madkit sincronizar [path]` | `sync` | Pull upstream templates + V1-V8 + report |
| `madkit doctor [path]` | — | Validation + degraded-feature table |
| `madkit estado [path]` | `status` | Project snapshot |
| `madkit listar-ides` | `list-ides` | Per-IDE compatibility table |

Default language: Spanish. Set `MADKIT_LANG=en` for English.

---

## IDE compatibility

| Feature | Claude Code | Cursor | Codex / AGENTS.md | Others |
|---|---|---|---|---|
| Skills, subagents, `context: fork`, hooks | Native | Documented in `.cursor/rules/CLAUDE_md_context.mdc` | Listed in AGENTS.md | Not supported |
| Technical linting rules | — | Native | — | — |
| Task docs in markdown | Native | Universal | Universal | Universal |

**Claude Code is the optimal experience by design.** Cursor and Codex receive adapters with documented degradation — we don't fake parity that doesn't exist.

**Per-IDE requirements:**
- Claude Code: 2026+ for hooks (`PreToolUse`, `PostToolUse`, `SessionStart`).
- Cursor: any modern version.
- Codex / GitHub Copilot: any version that consumes `AGENTS.md`.

---

## How it works

1. `madkit iniciar` builds the mechanical project structure without needing an LLM.
2. Your IDE of choice (Claude Code recommended) takes over for deep analysis.
3. `madkit sincronizar` keeps templates current with published releases.

---

## Links

- Issues: https://github.com/multi-agent-development-kit/madkit/issues
- Discussions: https://github.com/multi-agent-development-kit/madkit/discussions
- Changelog: [CHANGELOG.md](CHANGELOG.md)
- Contributing: [CONTRIBUTING.md](CONTRIBUTING.md)

---

## License

MIT. See [LICENSE](LICENSE).
