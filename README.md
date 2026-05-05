> [!IMPORTANT]
> **Este repo se conserva como referencia histórica.** El desarrollo activo del Multi-Agent Development Kit continúa en **[`multi-agent-development-kit/dev-kit`](https://github.com/multi-agent-development-kit/dev-kit)** — repo unificado con templates de Claude en raíz directa + paquete Python `madkit` (CLI). El paquete sigue publicándose como `madkit` en PyPI (≥0.2.0) sin cambio para usuarios finales.
>
> Para nuevas instalaciones y desarrollo: ir al [nuevo repo](https://github.com/multi-agent-development-kit/dev-kit). Issues y discussions también migran allí.

---

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

| Feature | Claude Code | Cursor | Codex / AGENTS.md | Cline | Continue | Windsurf |
|---|---|---|---|---|---|---|
| Skills, subagents, `context: fork`, hooks | Native | Documentadas como contexto | Listadas en AGENTS.md | Documentadas en `.clinerules` | Listadas en `systemMessage` | Documentadas en `.windsurfrules` |
| Reglas técnicas linting | No usadas | Native (31 reglas) | No aplica | No aplica | No aplica | No aplica |
| Task docs `ai_docs/tasks/` | Native | Universal markdown | Universal | Universal | Universal | Universal |

**Claude Code es la experiencia óptima por diseño.** Los demás IDEs reciben adaptadores con degradación documentada — no se intenta paridad imposible.

**Requisitos por IDE:**
- Claude Code: 2026+ para hooks (`PreToolUse`, `PostToolUse`, `SessionStart`).
- Cursor / Cline / Continue / Windsurf: cualquier versión moderna que consuma su archivo de scaffolding nativo.
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
