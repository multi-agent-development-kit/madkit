---
name: adk-skills-toolset
description: "SkillToolset de ADK: cargar expertise de dominio vía SKILL.md con progressive disclosure L1/L2/L3. Activar al diseñar agentes ADK con múltiples dominios, bloat de contexto, prompts >5k tokens, o al usar skills externos (google/adk-docs). Audita compliance agentskills.io. Skill del agente adk. NO para crear skills de Claude Code (→ create_skill_template)."
---

Cubres el patrón arquitectónico **SkillToolset** de Google ADK: cómo un agente carga expertise de dominio desde archivos `SKILL.md` con progressive disclosure, cuándo usarlo frente a tools o sub-agents, y cómo garantizar compliance con la spec **agentskills.io** (interoperable con Claude Code, Gemini CLI, Cursor).

## Terminología (evitar confusión)

- **ADK Skill** (esta skill): archivo `SKILL.md` cargado por `SkillToolset` en runtime de un agente ADK. Spec: agentskills.io.
- **Claude Code skill**: archivo `SKILL.md` en `.claude/skills/` que auto-activa al modelo vía frontmatter. Para crearlas → `create_skill_template`.
- El **formato es idéntico** (misma spec agentskills.io). Una misma carpeta `skills/<name>/` puede servir a ambos ecosistemas.

## Cuándo usar SkillToolset vs alternativas

| Necesidad | Usar | No usar |
|-----------|------|---------|
| Expertise de dominio cargado on-demand | **SkillToolset** | tools (no es código) |
| Acción determinista (parsing, validación, llamada API) | **FunctionTool** | SkillToolset |
| Delegación a otro LlmAgent con contexto propio | **sub_agents / AgentTool** | SkillToolset |
| Integración con servicio externo (BD, API, MCP server) | **MCPToolset / FunctionTool** | SkillToolset |
| Prompt de un agente >5k tokens por múltiples dominios | **SkillToolset** (desglosa por dominio) | Monolito |
| Conocimiento que puede necesitar el agente solo a veces | **SkillToolset** (L2 on-demand) | Instruction fija |

**Regla:** SkillToolset es **conocimiento cargable**, no ejecución. Si el agente necesita *hacer* algo → FunctionTool. Si necesita *saber* algo condicionalmente → SkillToolset.

## Progressive Disclosure L1/L2/L3

| Nivel | Qué | Tamaño | Cuándo se carga |
|-------|-----|--------|-----------------|
| L1 | `name` + `description` del frontmatter | ~100 tokens | Startup, para TODAS las skills registradas |
| L2 | Cuerpo completo de `SKILL.md` | ≤5k tokens / ≤500 líneas | Cuando el agente llama `load_skill(name)` |
| L3 | Archivos en `references/` | Sin límite estricto | Cuando el agente llama `load_skill_resource(name, path)` |

**Impacto:** agente con 10 skills paga solo L1 base (~1k tokens) en vez de cargar todo el contexto. Reducción típica: 90% contexto base.

## Estructura de directorio

```
<proyecto_adk>/
├── agent.py
├── sub_agents/
└── skills/
    └── <skill-name>/
        ├── SKILL.md              # L2 — instrucciones del dominio
        └── references/           # L3 — opcional
            ├── spec.md
            └── examples.md
```

## Los 4 patrones de definición

### Patrón 1: Skill inline (simple, embebida en código)

```python
from google.adk.tools import SkillToolset
from google.adk import models  # verificar ruta exacta contra pip show google-adk

refund_skill = models.Skill(
    frontmatter=models.Frontmatter(
        name="refund-policy",
        description="Política de reembolsos: ventanas, excepciones, escalado a humano.",
    ),
    instructions="""
# Política de Reembolsos
- Ventana 30 días desde compra
- Excepciones: productos digitales consumidos
- Escalado a humano si monto >500€
""",
)

toolset = SkillToolset(skills=[refund_skill])
agent = Agent(model="gemini-2.5-flash", tools=[toolset], instruction="...")
```

### Patrón 2: Skill file-based (recomendado para producción)

```python
import pathlib
from google.adk.tools import SkillToolset, load_skill_from_dir

skill_dir = pathlib.Path(__file__).parent / "skills" / "refund-policy"
refund = load_skill_from_dir(skill_dir)

toolset = SkillToolset(skills=[refund])
```

Ventaja: versionable en git, editable sin redeploy de código, soporta `references/`.

### Patrón 3: Skills externas (comunidad, Google)

```bash
npx skills add google/adk-docs
# Instala skills oficiales en ./skills/
```

Útil para inyectar conocimiento de ADK al propio agente o skills curadas de la comunidad (awesome-agent-skills, etc.).

### Patrón 4: Skill Factory (meta-skill, AVANZADO)

Agente que genera nuevas `SKILL.md` en runtime. **Warning de seguridad:** requiere write access al filesystem del runtime. Solo en entornos aislados y con validación post-generación.

```python
skill_creator = models.Skill(
    frontmatter=models.Frontmatter(name="skill-factory", description="..."),
    instructions="Genera SKILL.md cumpliendo spec agentskills.io...",
    resources=models.Resources(references={
        "spec.md": "...extracto spec...",
        "example.md": "...ejemplo SKILL.md...",
    }),
)
```

## Tools auto-generadas por `SkillToolset`

Al añadir `SkillToolset(skills=[...])` a `tools=[...]`, el framework expone 3 tools al LLM:

- `list_skills()` — devuelve L1 (nombre + descripción) de todas las skills registradas
- `load_skill(skill_name)` — carga L2 (cuerpo SKILL.md)
- `load_skill_resource(skill_name, resource_path)` — carga L3 (archivo de `references/`)

El agente decide cuándo invocarlas — por eso las descripciones (L1) deben ser **activadoras**: incluir triggers claros, dominio, y cuándo NO usar.

## Checklist Compliance agentskills.io (BLOQUEANTE antes de deploy)

Para CADA skill del proyecto (tanto propias como externas):

- [ ] `name` kebab-case, ≤64 caracteres
- [ ] `description` ≤1024 caracteres (idealmente <300 para activación precisa)
- [ ] Descripción contiene: **qué** hace la skill + **cuándo activar** + **cuándo NO activar**
- [ ] Cuerpo SKILL.md ≤500 líneas (si excede → extraer a `references/`)
- [ ] `references/` usado para contenido extenso (ejemplos largos, specs completas, tablas de datos)
- [ ] SIN duplicación: el contenido del SKILL.md NO aparece también en `instruction` del agente
- [ ] State keys de la skill namespaced (ej. `skill:refund:last_amount`) para evitar colisiones con otras skills o el agente principal
- [ ] Si la skill hace referencia a tools externas, documentadas explícitamente

**Comando de auditoría rápida:**

```bash
# Dentro del proyecto ADK, desde raíz:
for skill in skills/*/SKILL.md; do
  lines=$(wc -l < "$skill")
  desc=$(awk '/^description:/,/^---|^name:/' "$skill" | wc -c)
  echo "$skill | lines=$lines | desc_chars=$desc"
  [ "$lines" -gt 500 ] && echo "  ⚠️  Excede 500 líneas — extraer a references/"
done
```

## Anti-patrones

| Anti-patrón | Por qué falla | Correcto |
|-------------|---------------|----------|
| Duplicar contenido del skill en `instruction` del agente | Cuenta doble de tokens, derrota progressive disclosure | Mencionar la skill en instruction, dejar que el agente la cargue |
| SkillToolset para integración con API externa | No ejecuta código, solo texto | MCPToolset o FunctionTool |
| Skill monolítica de 1000+ líneas | Excede L2, degrada context window al cargar | Dividir por sub-dominio o mover detalles a `references/` |
| Descripciones genéricas ("ayuda con cosas") | El LLM no sabe cuándo invocar `load_skill` | Triggers específicos, dominio explícito |
| State keys genéricos (`result`, `data`) | Colisión con otros skills/agentes | Prefijo namespaced |
| Meta-skill factory sin sandbox | Arbitrary file write | Validación post-generación + filesystem aislado |

## Interacción con otros componentes ADK

- **MCPToolset:** complementario — MCP para servicios externos, SkillToolset para conocimiento bundled.
- **Sub-agents:** ortogonal — un sub-agent puede tener su propio `SkillToolset`.
- **Evalsets:** evaluar skill loading como parte del flujo (¿el agente llama `load_skill` en el momento correcto?). Ver `adk-evaluation-testing`.
- **Callbacks:** `before_tool_callback` puede interceptar `load_skill` para logging o autorización.

## Versión SDK y verificación

`SkillToolset` requiere versión mínima de `google-adk`. **NO hardcodear** — en cada proyecto verificar:

```bash
pip show google-adk | grep Version
grep -r "SkillToolset\|load_skill_from_dir" $(python -c "import google.adk; print(google.adk.__path__[0])")
```

Si la instalación del proyecto no expone `SkillToolset`, actualizar SDK o posponer adopción. Consultar `ai_docs/refs/adk-python/CHANGELOG.md` para la versión exacta.

## Cuándo NO adoptar SkillToolset

- Agente con un único dominio y prompt <2k tokens → mantener `instruction` monolítica
- Equipo sin disciplina de versionado de `skills/` → complicación operacional sin beneficio
- Proyecto que nunca va a producción → overhead innecesario
- Si la reducción de contexto medida es <20% → no justifica migración

## Output esperado tras usar esta skill

1. Decisión documentada: SkillToolset sí/no y por qué (incluir en design doc)
2. Si sí: lista de skills con nombre, descripción (≤1024 chars), dominio cubierto
3. Estructura `skills/<name>/SKILL.md` creada y compliance checklist validado
4. Integración con `Agent(tools=[SkillToolset(...)])` en `agent.py`
5. Evalsets actualizados para cubrir escenarios de skill loading (delegar a `adk-evaluation-testing`)

> Spec canónica: https://agentskills.io/specification — ver `references/agentskills-spec.md` para extracto actualizado localmente.

---

*Skill del agente adk. Exclusiones mutuas: create_skill_template (Claude Code skills, no ADK), adk-workflow-design (diseño general, esta skill cubre el patrón específico).*
