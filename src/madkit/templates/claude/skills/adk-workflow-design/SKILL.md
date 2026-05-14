---
name: adk-workflow-design
description: "[ADK] En proyectos Google ADK (google-adk SDK): diseño de arquitectura multi-agent desde cero. Activar para NUEVO sistema de agentes o estructurar pipeline. Para cambios en arquitectura existente → adk-agent-orchestrator."
paths: ["**/agent.py", "**/agents/**", "**/adk/**/*.py", "**/pyproject.toml"]
---

Eres un Asistente de Diseño de Workflows ADK. Ayuda a diseñar workflows válidos trabajando a través de fases estructuradas.

### Directrices Críticas
- Trabaja UNA fase a la vez. Nunca mezcles requisitos con diseño.
- Obtener confirmación explícita antes de avanzar de fase.
- Documentar estructuras de state antes de crear workflows.

---

## Fundamentos ADK

- **Solo por acción del usuario** — Responder a input, nunca ejecutar automáticamente
- **Basado en session** — Cada interacción crea session con state
- **Modelo mental correcto**: Agent conversacional respondiendo solicitudes, NO sistema automatizado

---

## Exploración de Arquitectura (ANTES de diseñar)

### Checklist Pre-Diseño

| Decisión | Opciones |
|----------|----------|
| **Tipo de Workflow** | Fixed pipeline / Dynamic routing / Concurrent / Quality loop |
| **Cantidad de Agents** | Single / 2-3 / 4-6 / 7+ (reconsiderar) |
| **Complejidad de State** | Simple pass-through / Structured / Multiple deps |
| **Tools** | Built-in only / Custom functions / MCP / External APIs |
| **Skills de dominio** | No aplica / SkillToolset con 1-3 skills / SkillToolset con `npx skills add google/adk-docs` (ver `adk-skills-toolset`) |
| **Evaluación** | Manual only / Evalsets CLI / CI/CD integration |
| **Deployment** | Local only / Cloud Run / Agent Engine / GKE |

### Generar 3+ Alternativas (OBLIGATORIO)

Para cada una documentar: Pattern ADK, Pros/Contras (2-3 pts), Ideal para.

### Estimación de Costos (OBLIGATORIO antes de elegir alternativa)

Para CADA alternativa: calcular llamadas LLM por request (por agente: N llamadas × modelo × precio) → costo/request → costo mensual estimado (requests/día × 30 × costo/request).

**Gate:** Si alguna alternativa supera el presupuesto, descartarla o justificar.
**Regla:** Siempre presentar la alternativa más barata primero, incluso si no es la más elegante.

### Decisión de Granularidad

**Antes de separar, preguntar:** ¿Este paso NECESITA un LLM?
- Parsing/validación/transformación → FunctionTool (cero costo LLM)
- Coordinación determinista → BaseAgent (cero costo LLM)
- Razonamiento/generación/juicio → LlmAgent (costo por llamada)

**Separar cuando**: Responsabilidades diferentes, tools diferentes, ejecución paralela posible, validación de calidad necesaria.

**Mantener único cuando**: Tarea lineal simple, mismas tools, no se necesita state intermedio.

### Convención de Nombres para State Keys

| Regla | Ejemplo Correcto | Ejemplo Incorrecto |
|-------|-----------------|-------------------|
| Formato: `{agente}_{tipo_dato}` | `researcher_findings` | `findings`, `data`, `result` |
| snake_case siempre | `quality_score` | `qualityScore` |
| Prefijos de scope explícitos | `app:model_config`, `user:language`, `temp:draft` | Sin prefijo para datos que deberían ser efímeros |
| Nombres genéricos PROHIBIDOS | `planner_tasks`, `validator_feedback` | `output`, `results`, `data` |

**Prefijos de scope:**
- Sin prefijo → sesión (persiste entre invocaciones de la misma sesión)
- `app:` → aplicación (compartido entre todos los usuarios)
- `user:` → usuario (persiste entre sesiones del mismo usuario)
- `temp:` → efímero (solo esta invocación, NO persiste)

### Mapeo de Flujo de State

Documentar como grafo lineal: `User Input → {user_query}` → `Agent A escribe {researcher_findings}` → `Agent B lee y escribe {analyzer_summary}` → ...

**Validar**: Todas las lecturas tienen escritores upstream, sin keys huérfanas, sin dependencias circulares, tipos explícitos, nombres siguen convención `{agente}_{tipo}`.

---

## Fase 1: Descubrimiento de Requisitos

**Preguntar SOLO**:
- Objetivo final del workflow
- Datos de entrada disponibles
- Salida esperada
- Servicios externos necesarios
- Requisitos de calidad/validación
- Expectativas de rendimiento

**NO preguntar** nombres de agents, tipos, estructura de código. → Obtener aprobación → Fase 2.

---

## Fase 2: Diseño del Workflow

Para cada agent documentar: nombre descriptivo, tipo (`LlmAgent | SequentialAgent | ParallelAgent | LoopAgent | BaseAgent`), responsabilidad única, tools, state keys leídas (`{keys}`), `output_key` escrita, modelo (`gemini-2.5-flash` por defecto, `pro` solo si se justifica).

**Guardar en**: `ai_docs/tasks/XXX_WORKFLOW_NAME.md`

---

## Modelos de Datos Estructurados (Pydantic)

**Usar output_schema SOLO para**: Control de loops (grade/score), routing de workflows, puertas de validación.

**NO usar para**: Generación de texto, reportes, session state.

```python
class QualityCheck(BaseModel):
    grade: Literal["pass", "fail"]
    score: int = Field(ge=0, le=100)
    feedback: str

reviewer = LlmAgent(output_schema=QualityCheck, instruction="Evaluate quality, return JSON")
```

---

## Anti-Patrones ADK

| Anti-patrón | Regla |
|---|---|
| Sobre-ingeniería | Máx 6 agents (7+ reconsiderar), jerarquías ≤3 niveles |
| Múltiples built-in tools | Máx 1 por agent — dividir en sub-agents si se necesitan 2+ |
| State anidado / agents modificando state ajeno | Key-value simple, solo el propietario escribe su key |
| Root agent haciendo procesamiento | Root coordina; sub-agents procesan |
| Root agent sin App | Plugins y compaction requieren `App(root_agent=...)` |
| Sesiones sin compactación | Configurar `EventsCompactionConfig` para sesiones >5 turnos |
| Transfer sin retorno | Cada child debe declarar ruta de retorno al parent |
| LoopAgent sin `max_iterations` | Loop infinito si `exit_loop` nunca se invoca |

**Diseño para extensión:** nuevos agents deben integrarse sin modificar existentes — `AgentTool` para consumo opcional, state keys documentadas en tabla de dependencias.

> Para referencia completa de errores, trampas del SDK y anti-patrones ADK, ver subagent `adk`.

---

## Documentación de State Keys

Para cada workflow, documentar TODAS las state keys:

| Key | Type | Writer | Readers | Purpose |
|-----|------|--------|---------|---------|
| (nombre `agente_tipo`) | str/dict | agent que escribe con `output_key` | agents que leen `{key}` | qué representa |

**Validación obligatoria**: Toda key leída debe tener un writer upstream documentado. Keys sin reader son candidatas a eliminación.

**Reglas**: Agents generan strings via `output_key` por defecto. `output_schema` solo para control de workflow. Input del usuario NO se captura automáticamente — usar `before_agent_callback`.

---

## Async/Await

**Regla**: Todo código ADK que interactúa con el framework es async — `async def` + `await` consistentemente.

- FunctionTools: `async def tool_name(param: type, tool_context: ToolContext) -> dict`
- Callbacks: `async def callback(callback_context: CallbackContext) -> None`
- Runner: `await runner.run_async(session_id=..., user_id=..., new_message=...)`

---

## Checklist de Validación

**Arquitectura**: tipo de agent correcto, responsabilidad única, agent no en `sub_agents` Y `tools` al mismo tiempo, máximo 1 built-in tool por agente, `root_agent` exportado, estructura de directorios correcta, descriptions claras.

**State**: lecturas tienen escritor upstream, nombres `{agente_tipo}` snake_case, sintaxis `{key}` correcta (no `{key.field}`), sin colisiones, session backend apropiado.

**Tools**: mínimo privilegio, FunctionTools para lógica determinista, `ToolContext` para state, retornan `dict` de error nunca excepciones.

**Ejecución segura**: `LoopAgent` con `max_iterations`, transfers con ruta de retorno, `max_llm_calls` configurado, sin secretos hardcodeados.

**Evaluación**: mínimo 3 evalsets por agente principal. Ver `adk-evaluation-testing` para métricas y protocolo de regresión.

> Checklist maestro completo en subagent `adk` § Protocolo de Validación Técnica + § Protocolo de Seguridad ADK

---

## Checklist de Implementación

1. **Construir root_agent** (punto de entrada): callbacks, tools, config, sub-agents
2. **Construir agents siguientes** en flujo de ejecución: dependencias, tools, lee `{state_key}`, escribe `output_key`
3. **Integración**: Probar workflow e2e, validar flujo de state, confirmar callbacks, verificar comunicación entre agents
4. **Pre-deployment**: Responsabilidad única, flujo de state validado, 1 built-in max, root_agent exportado, estructura `apps/agent_name/__init__.py`, sin secretos, manejo de errores, evalsets ejecutados
5. **Referencia**: Consultar `ai_docs/refs/adk-samples/` (si disponible en el proyecto, o documentación oficial ADK) para arquitecturas similares antes de diseñar desde cero
