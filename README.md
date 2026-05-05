# madkit

> Multi-Agent Development Kit. **Loco de nombre. Metódico por diseño.**

CLI para scaffolding multi-IDE de proyectos asistidos por agentes. Bootstrap mecánico, sincronización validada y detección de IDE en una sola herramienta.

**Estado actual:** v0.1.0.dev0 — alpha en desarrollo activo. La primera release verificable end-to-end es v0.1.0.

---

## Instalación rápida

**Modo ágil — sin instalar nada:**

```bash
uvx madkit iniciar .
```

**Modo recurrente — instala una vez:**

```bash
uv tool install madkit
madkit iniciar .
```

Requiere [uv](https://docs.astral.sh/uv/) y Python ≥3.11.

---

## Comandos

| Comando | Alias EN | Para qué |
|---|---|---|
| `madkit iniciar [path]` | `init` | Bootstrap mecánico: ai_docs/, CLAUDE.md y scaffolding del IDE |
| `madkit sincronizar [path]` | `sync` | Pull de templates upstream + V1-V8 + report |
| `madkit doctor [path]` | — | Validación + tabla de features degradados |
| `madkit estado [path]` | `status` | Snapshot del proyecto |
| `madkit listar-ides` | `list-ides` | Tabla de compatibilidad por IDE |

Idioma por defecto: español. `--lang EN` o `MADKIT_LANG=en` cambia a inglés.

---

## Compatibilidad por IDE

| Feature | Claude Code | Cursor | Codex / AGENTS.md | Otros |
|---|---|---|---|---|
| Skills, subagents, `context: fork`, hooks | Native | No soportado, descritos en `.cursor/rules/CLAUDE_md_context.mdc` | No soportado, listados en AGENTS.md | No soportado |
| Reglas técnicas linting | No usadas | Native | No aplica | No aplica |
| Task docs `ai_docs/tasks/` | Native | Universal markdown | Universal | Universal |

**Claude Code es la experiencia óptima por diseño.** Cursor y Codex reciben adaptadores con degradación documentada — no se intenta paridad imposible.

**Requisitos por IDE:**
- Claude Code: 2026+ para hooks (`PreToolUse`, `PostToolUse`, `SessionStart`).
- Cursor: cualquier versión moderna.
- Codex / GitHub Copilot: cualquier versión que consuma `AGENTS.md`.

---

## Cómo funciona

1. `madkit iniciar` crea la estructura mecánica del proyecto sin necesidad de LLM.
2. Tu IDE preferido (Claude Code recomendado) toma el control para análisis profundo.
3. `madkit sincronizar` mantiene los templates al día con releases publicadas.

---

## Enlaces

- Issues: https://github.com/multi-agent-development-kit/madkit/issues
- Discussions: https://github.com/multi-agent-development-kit/madkit/discussions
- Changelog: [CHANGELOG.md](CHANGELOG.md)
- Cómo contribuir: [CONTRIBUTING.md](CONTRIBUTING.md)

---

## Licencia

MIT. Ver [LICENSE](LICENSE).
