# agentskills.io — Extracto de Spec

> Fuente canónica: https://agentskills.io/specification
> Este archivo es un **extracto** para carga L3 on-demand. Para autoridad, verificar siempre la spec online.

## Propósito

Formato estándar abierto para empaquetar expertise de dominio reutilizable entre agentes LLM. Compatible con Claude Code, Gemini CLI, Cursor, ADK (SkillToolset) y 40+ productos.

## Estructura mínima

```
skill-name/
└── SKILL.md
```

## Estructura completa

```
skill-name/
├── SKILL.md                    # obligatorio
├── references/                 # opcional — L3
│   ├── patterns.md
│   └── examples.md
└── scripts/                    # opcional — código ejecutable asociado
    └── helper.py
```

## SKILL.md — Formato

```markdown
---
name: skill-name
description: "Qué hace + cuándo activar + cuándo NO activar"
---

Contenido L2 en Markdown.
Instrucciones paso a paso.
Máximo recomendado: 500 líneas.
```

## Reglas de nombres

| Regla | Valor |
|-------|-------|
| Case | kebab-case (`mi-skill-de-pagos`) |
| Longitud máxima | 64 caracteres |
| Caracteres permitidos | `a-z`, `0-9`, `-` |
| Primer carácter | letra |

## Reglas de description

| Regla | Valor |
|-------|-------|
| Longitud máxima | 1024 caracteres |
| Longitud recomendada | 150-300 caracteres |
| Contenido | qué hace + triggers de activación + exclusiones |

## Progressive Disclosure

| Nivel | Contenido | Carga |
|-------|-----------|-------|
| L1 | frontmatter (name + description) | Siempre, en todas las skills registradas |
| L2 | Cuerpo SKILL.md | On-demand al invocar la skill |
| L3 | Archivos en `references/` | On-demand al solicitar resource específico |

## Interoperabilidad

- **Claude Code:** mismo formato en `.claude/skills/` y `~/.claude/skills/`. Auto-activación vía frontmatter.
- **ADK:** `SkillToolset(skills=[load_skill_from_dir(path)])` expone 3 tools: `list_skills`, `load_skill`, `load_skill_resource`.
- **Gemini CLI / Cursor:** consumo nativo del mismo formato.

## Compliance checklist

- [ ] `name` kebab-case ≤64 chars
- [ ] `description` ≤1024 chars, contiene triggers
- [ ] Cuerpo ≤500 líneas (extender con `references/` si hace falta)
- [ ] Sin secretos ni credenciales embebidas
- [ ] Sin referencias a paths absolutos del autor
- [ ] Funciona aislada (no depende de contexto externo no declarado)

## CLI oficial de Google

```bash
npx skills add google/adk-docs       # skills oficiales Google
npx skills add <org>/<repo>          # skills de comunidad
npx skills list                      # skills instaladas
```

## Recursos

- Spec canónica: https://agentskills.io/specification
- Blog Google ADK Skills: https://developers.googleblog.com/developers-guide-to-building-adk-agents-with-skills/
- Awesome skills: repos curados en GitHub (buscar "awesome-agent-skills", "awesome-claude-skills")
