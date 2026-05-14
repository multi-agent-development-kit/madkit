---
name: adk-prompt-cleanup
description: "[ADK] En proyectos Google ADK (google-adk SDK): corrección de prompts de agentes contra desalineamientos semánticos. Activar tras diagnóstico (adk-bottleneck-analysis) o al refactorizar instrucciones de agentes ADK."
paths: ["**/agent.py", "**/agents/**", "**/adk/**/*.py", "**/pyproject.toml"]
---

> **IMPORTANTE:** Verificar que existe task doc para este trabajo antes de continuar. Si no existe, delegar creación a `task-planner` (solo `task-planner` crea `ai_docs/tasks/NNN_*.md`). Cambios quirúrgicos únicamente — mantener funcionalidad idéntica.

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

**Patrón → Regla:**

| Anti-patrón | Correcto |
|-------------|----------|
| Mencionar `session_state[...]` en instruction | Describir output esperado; el framework almacena vía `output_key` |
| Mencionar callbacks en instruction | Omitir — el LLM no controla callbacks |
| Sub-agente secuencial explicando flujo del pipeline | Solo declarar objetivo propio |
| Delegación pasiva ("transfer control to...") | Imperativo: verbos de output (write, generate, produce) |

---

## Patrones por Tipo de Agente

**LlmAgent**: Prompt describe tarea y datos disponibles. NO explicar cómo se almacena el output ni mencionar callbacks. `output_key` solo funciona si genera texto.

**BaseAgent**: Accede al estado vía `ctx.state` (delta-aware, preferido) o `ctx.session.state` (raw). NO debe crear CallbackContext.

**SequentialAgent**: Prompts NO deben mencionar "transferir al siguiente agente" o "el pipeline continuará" — el framework gestiona el flujo.

**LoopAgent**: Prompts explican criterios de refinamiento, NO mecánicas del bucle.

---

## Patrones de Delegación

| Patrón | Mecanismo | El agente original |
|--------|-----------|-------------------|
| Transferencia | `transfer_to_agent(agent_name='...')` en instruction | Se detiene |
| Tool call | `AgentTool(agent=helper)` en `tools=` | Continúa tras recibir resultado |

Delegación debe ser imperativa: `"ACTION REQUIRED: Call transfer_to_agent(agent_name='X'). DO NOT continue without calling this function."` — nunca pasiva ("transfer control to...").

---

## Templating de State Keys

**Sintaxis:** `{{key}}` (2 llaves) para state keys en instrucciones ADK · `{var}` (1 llave) para Python f-strings · `state["key"]` en Python code (callbacks/tools) · **NUNCA** `{{{{key}}}}` (4 llaves) · En instructions usar descripción semántica del dato, nunca sintaxis de código.

**Convención de nombres** (ver `adk-workflow-design` § Convención de Nombres): `{agente}_{tipo_dato}` — prefijos de scope `app:`, `user:`, `temp:` según persistencia.

**Encapsulación:** Agentes de acción → inline `{{key}}`. Agentes de revisión → sección "Available Information" con bloques de código.

**output_key vs callback write:** `output_key` es PREFERIDO para outputs estándar (el framework almacena automáticamente). Callback write (`ctx.state["key"] = val`) solo para inicialización, valores computados pre/post, o transformaciones que no son output del LLM.

---

## Breaking Change v1.24: Autenticación en Callbacks

Si el proyecto usa `CredentialManager`: en v1.24+ los callbacks de auth reciben `tool_context: ToolContext` (NO `callback_context: CallbackContext`). Verificar versión del SDK ANTES de limpiar callbacks con autenticación.

---

## Reglas de Limpieza

| Qué eliminar | Qué poner en su lugar |
|---|---|
| Referencias a callbacks en instructions | Omitir — el LLM no controla callbacks; usar `{{key}}` para referenciar datos |
| `"store in session_state[...]"` | `"Generate [output]"` — el framework almacena vía `output_key` |
| `"transfer control"` o `"the pipeline will continue"` en SequentialAgent | `"DO NOT use transfer_to_agent. Your only objective is [task]."` |

---

## Checklist de Conformidad ADK

**Grep** (desde `AGENT_DIR`, pattern `*prompt*.py`) — todos deben dar 0 resultados:

| Qué buscar | Patrón grep |
|---|---|
| Internos ADK en instructions | `"via output_key\|via callback\|automatically mapped\|Write to state\|Read from state"` |
| Cuádruple llaves | `"{{{{"` |
| Delegación pasiva | `"transfiere\|delegate.*to.*agent\|transfer control"` (excluir `CALL\|ACTION REQUIRED`) |
| Credenciales en prompts | `"api.key\|token\|secret\|password\|credential"` |
| ToolContext en instructions | `"tool_context\|toolcontext"` |
| Descriptions vacías (`*.py`) | `'description=""'` o `"description=''"` |

**State keys**: `grep -roh "{{[a-zA-Z_]*}}"` → extraer todas, verificar escritor upstream para cada una.

**Verificación manual:**
- [ ] Tools en el prompt coinciden con parámetro `tools` del agente
- [ ] Formato de output es la última sección del prompt
- [ ] Comandos de output explícitos (write/generate/produce)
- [ ] Cada agente en `sub_agents` tiene description de 1-2 líneas
- [ ] Cada `FunctionTool` tiene docstring con qué hace + cuándo usarla
- [ ] Type annotations en TODOS los parámetros de FunctionTools

---

## Limpieza ≠ Refactorización

**Limpieza**: Eliminar internos del framework, corregir sintaxis de llaves, alinear con estilo existente, mejorar claridad, verificar state keys.

**NO es limpieza**: Cambiar funcionalidad, renombrar keys (salvo typos), reestructurar arquitectura, agregar funcionalidades.

Ante la duda, preguntar al usuario — los patrones de proyecto varían.

---

## Optimización Automática (v1.27+)

Para optimización basada en métricas (no solo limpieza manual): `adk optimize` usa GEPA para mejorar instrucciones del root agent basándose en evalsets. Complementario a la limpieza manual.

> Ver `adk-evaluation-testing` §4 para el flujo completo de `adk optimize` y el orden recomendado (limpiar anti-patrones primero, optimizar métricas después).
