---
name: adk-prompt-cleanup
description: "Corrección de prompts ADK contra desalineamientos semánticos. Activar tras diagnóstico (adk-bottleneck-analysis) que identifique el prompt como causa, o al refactorizar instrucciones de agentes ADK. Skill del agente adk."
---

> **CRÍTICO:** Cada limpieza DEBE generar un documento de tarea en `ai_docs/tasks/{NNN}_prompt_cleanup_{scope}.md` ANTES de realizar cambios. Cambios quirúrgicos únicamente — mantener funcionalidad idéntica.

---

## Principios Clave

1. **Orden del prompt:** Qué hacer → Cómo hacerlo → Formato de output (AL FINAL)
2. **Tools verificadas:** Cada tool mencionada en el prompt debe estar en el parámetro `tools` del agente
3. **State keys grandes encapsuladas** en bloques de código markdown
4. **Instrucciones positivas** — "Qué hacer" sobre "Qué NO hacer"
5. **Cero redundancia** — Cada concepto declarado una sola vez
6. **Proceso:** Descubrir → Tarea → Analizar → Limpiar → Validar
7. **SkillToolset:** si el agente usa `SkillToolset`, el contenido de cada `SKILL.md` NO debe duplicarse en `instruction` del agente — el framework lo carga on-demand (ver `adk-skills-toolset`)

---

## Descubrimiento del Proyecto (OBLIGATORIO PRIMERO)

Antes de cualquier limpieza, documentar:

1. **Rutas:** Directorio de agentes, patrón de prompts (`*_prompt.py`), callbacks, schemas, config
2. **Gestión de estado:** Buscar `session_state[`, `_init_state`, `before_agent_callback`, `after_agent_callback`
3. **Tipos de agentes en uso:** LlmAgent, BaseAgent, SequentialAgent, LoopAgent, ParallelAgent

**No proceder hasta comprender la estructura del proyecto.**

---

## Desalineamiento Semántico (Concepto Central)

Los LLMs generan **CONTENIDO**, no **CÓDIGO**. Prompts que exponen internos del framework causan que el LLM intente operaciones imposibles.

**MAL**: "Store the results in session_state['analysis_result'] for downstream agents."
→ El LLM intentará: `session_state["analysis_result"] = my_analysis` (imposible para LlmAgents)

**BIEN**: "Generate a comprehensive analysis covering [areas]."
→ El framework almacena el output vía `output_key` automáticamente

**Reglas:**
- Los LLMs generan texto/datos estructurados; el framework almacena vía `output_key`
- Mencionar callbacks confunde al LLM sobre límites de responsabilidad
- Sub-agentes secuenciales NO necesitan conocer mecánicas del pipeline
- La delegación requiere comandos imperativos, no descripciones pasivas
- Usar verbos de output explícitos (write, generate), no solo verbos mentales (analyze, identify)

---

## Patrones por Tipo de Agente

**LlmAgent**: Prompt describe tarea y datos disponibles. NO explicar cómo se almacena el output ni mencionar callbacks. `output_key` solo funciona si genera texto.

**BaseAgent**: Accede al estado vía `ctx.state` (delta-aware, preferido) o `ctx.session.state` (raw). NO debe crear CallbackContext.

**SequentialAgent**: Prompts NO deben mencionar "transferir al siguiente agente" o "el pipeline continuará" — el framework gestiona el flujo.

**LoopAgent**: Prompts explican criterios de refinamiento, NO mecánicas del bucle.

---

## Patrones de Delegación

**Delegación** (`transfer_to_agent`): Transfiere conversación — el agente original se detiene.
```python
coordinator = LlmAgent(
    sub_agents=[specialist_agent],
    instruction="Call transfer_to_agent(agent_name='specialist') to delegate"
)
```

**Uso de Tool** (`AgentTool`): Llama como función, recibe resultado — el agente original continúa.
```python
coordinator = LlmAgent(
    tools=[AgentTool(agent=helper_agent)],
    instruction="Use helper tool to analyze data, then proceed"
)
```

Delegación debe ser **imperativa** con sintaxis exacta:
```markdown
**ACTION REQUIRED:**
Call the function `transfer_to_agent`:
transfer_to_agent(agent_name='specialist')
DO NOT continue without calling this function.
```

---

## Templating de State Keys

```python
prompt = f"""
Access this data: {{state_key}}   # ADK template - 2 llaves
Your config: {config.path}        # Python f-string - 1 llave
"""
```

**Reglas de sintaxis:**
- `{{key}}` (2 llaves) para state keys en instrucciones ADK
- `{var}` (1 llave) para Python f-strings
- **NUNCA** `{{{{key}}}}` (4 llaves)
- En Python code (callbacks/tools): `state["key"]` o `state.get("key", default)`
- En LLM instructions: descripción semántica del dato, NUNCA sintaxis de código

**Convención de nombres** (ver `adk-workflow-design` § Convención de Nombres):
- Formato: `{agente}_{tipo_dato}` (ej. `{{researcher_findings}}`, no `{{findings}}`)
- Prefijos de scope: `app:`, `user:`, `temp:` según persistencia requerida

**Encapsulación:** Agentes de acción → inline `{{key}}`. Agentes de revisión → sección "Available Information" con bloques de código.

**output_key vs callback write:**
- `output_key`: PREFERIDO para outputs estándar de agentes (el framework almacena automáticamente)
- Callback write (`ctx.state["key"] = val`): SOLO para inicialización de estado, valores computados pre/post procesamiento, o transformaciones que no son output del LLM

---

## Breaking Change v1.24: Autenticación en Callbacks

Si el proyecto usa `CredentialManager` en callbacks:
```python
# ❌ Pre-v1.24 (rompe en v1.24+)
def auth_callback(callback_context: CallbackContext): ...

# ✅ v1.24+
def auth_callback(tool_context: ToolContext): ...
```
Verificar versión del SDK ANTES de limpiar callbacks con autenticación.

---

## Reglas de Limpieza

### Eliminar Referencias a Callbacks
**Antes**: "design_summary (automatically mapped to design_requirements by callback)"
**Después**: "{{design_summary}} - Design analysis from Figma"

### Enfocarse en Acciones, No en Mecanismos
**Antes**: "Store the results in session_state['analysis_result'] for downstream agents."
**Después**: "Generate a comprehensive analysis covering [areas]."

### Sub-Agentes Secuenciales
```markdown
DO NOT use transfer_to_agent. The ADK framework (SequentialAgent) handles flow automatically.
Your only objective is [specific task].
```

---

## Checklist de Conformidad ADK

**Grep anti-patrones** (adaptar rutas al proyecto):
```bash
AGENT_DIR="path/to/agents"
PROMPT_PATTERN="*prompt*.py"

# Internos ADK (DEBE dar 0 resultados)
grep -r "via output_key\|via callback\|automatically mapped\|Write to state\|Read from state" "$AGENT_DIR" --include="$PROMPT_PATTERN"

# State keys (verificar que todas tienen escritor upstream)
grep -roh "{{[a-zA-Z_]*}}" "$AGENT_DIR" --include="$PROMPT_PATTERN" | sort -u

# Cuádruple llaves (NUNCA debe existir)
grep -r "{{{{" "$AGENT_DIR" --include="$PROMPT_PATTERN"

# Delegación pasiva (DEBE dar 0 resultados)
grep -ri "transfiere\|delega\|delegate.*to.*agent\|transfer control" "$AGENT_DIR" --include="$PROMPT_PATTERN" | grep -v "CALL\|Llama\|Ejecuta\|ACTION REQUIRED"

# Credenciales en prompts (DEBE dar 0 resultados)
grep -ri "api.key\|token\|secret\|password\|credential" "$AGENT_DIR" --include="$PROMPT_PATTERN"

# Descriptions vacías (DEBE dar 0 resultados)
grep -rn 'description=""' "$AGENT_DIR" --include="*.py"
grep -rn "description=''" "$AGENT_DIR" --include="*.py"

# ToolContext mencionado en instructions (DEBE dar 0 resultados)
grep -ri "tool_context\|toolcontext" "$AGENT_DIR" --include="$PROMPT_PATTERN"
```

**Verificación manual:**
- [ ] Sin internos ADK (`via output_key`, `via callback`, `automatically mapped`)
- [ ] Sin secciones `Write to state` / `Read from state`
- [ ] Sin instrucciones para manipular CallbackContext o session_state
- [ ] Tools en el prompt coinciden con parámetro `tools` del agente
- [ ] Formato de output es la última sección del prompt
- [ ] Sub-agentes secuenciales no intentan delegación
- [ ] Comandos de output explícitos (write/generate/produce)
- [ ] Cada agente en sub_agents tiene description de 1-2 líneas descriptivas
- [ ] Cada FunctionTool tiene docstring con qué hace + cuándo usarla
- [ ] Ninguna instruction menciona ToolContext o parámetros internos
- [ ] Type annotations en TODOS los parámetros de FunctionTools

---

## Limpieza ≠ Refactorización

**Limpieza**: Eliminar internos del framework, corregir sintaxis de llaves, alinear con estilo existente, mejorar claridad, verificar state keys.

**NO es limpieza**: Cambiar funcionalidad, renombrar keys (salvo typos), reestructurar arquitectura, agregar funcionalidades.

Ante la duda, preguntar al usuario — los patrones de proyecto varían.

---

## Optimización Automática (v1.27+)

Para optimización basada en métricas (no solo limpieza manual), ADK ofrece:
```bash
adk optimize --agent_dir apps/ --agent_name my_agent
```
Usa el optimizador GEPA para mejorar instrucciones del root agent basándose en evalsets. Complementario a la limpieza manual — `adk optimize` optimiza para métricas, esta skill limpia anti-patrones del framework.
