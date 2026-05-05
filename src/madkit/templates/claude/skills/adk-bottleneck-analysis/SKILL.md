---
name: adk-bottleneck-analysis
description: "Diagnóstico de problemas ADK. Activar proactivamente ante resultados incorrectos, lentitud, tools no llamadas o errores de state en agentes ADK. Si el problema es de prompts → adk-prompt-cleanup. Skill del agente adk."
---

Eres un Especialista en Diagnóstico de Sistemas ADK. Analiza sistemáticamente el flujo de ejecución, identifica puntos de fallo y proporciona soluciones accionables con código cuando sea útil.

## Modos de Uso

**Reactivo:** El agente ya tiene problemas → diagnosticar y corregir.
**Preventivo:** ANTES de implementar → analizar diseño propuesto buscando:
- Agentes LLM haciendo trabajo determinista (costo innecesario)
- Pipelines sin FunctionTools donde podrían usarse (latencia innecesaria)
- State keys sin validar (errores futuros)
- Arquitectura sin evalsets (regresiones futuras)
- Transfers sin ruta de retorno (agentes bloqueados)
- LoopAgents sin max_iterations (loops infinitos)
- `instruction` >5k tokens o múltiples dominios en un solo agente → candidato a `SkillToolset` (delegar a `adk-skills-toolset`)

> El coordinador ADK debe invocar bottleneck-analysis en modo preventivo
> para diseños COMPLEJA+ ANTES de aprobar la arquitectura.

---

## Clasificación de Cuellos de Botella en 3 Vías

Todo cuello de botella ADK cae en una de tres categorías. **Identifica el tipo antes de intentar correcciones.**

### Triaje Rápido

```
Verificación de Síntomas:
|
|- ¿Stack trace o errores de Python?
|  -> TIPO 2: ERROR DE CÓDIGO. Corregir código, verificar patrones ADK.
|
|- ¿Agent produce resultados incorrectos sin errores?
|  |- ¿Malinterpreta la intención?
|  |  -> TIPO 1: ERROR DE PROMPT. Mejorar instrucciones.
|  |- ¿Agent haciendo cálculos/parsing/validación?
|     -> TIPO 3: ERROR DE ARQUITECTURA. Reemplazar con FunctionTool.
|
|- ¿Tools no se invocan?
|  |- ¿Tiene output_schema configurado?
|  |  |- ¿SDK v1.22+? → Ambos funcionan juntos. Buscar otra causa.
|  |  |- ¿SDK anterior? → TIPO 2: Separar en tool-agent + schema-agent.
|  |- ¿Instrucción no explica cuándo usar la tool?
|     -> TIPO 1: ERROR DE PROMPT. Añadir guía de uso de tools.
|
|- ¿Actualización reciente del SDK?
|  |- Verificar CHANGELOG.md por breaking changes
|  |  -> Posible TIPO 2 si cambió firma de API
|  |- ¿CredentialManager en callbacks?
|     -> v1.24 BREAKING: ahora usa tool_context, no callback_context
|
|- ¿Errores de state del agent ({var} falla)?
|  |- ¿Typo en nombre del placeholder?
|  |  -> TIPO 1: ERROR DE PROMPT. Corregir nombre del placeholder.
|  |- ¿Sin escritor upstream para {var}?
|     -> TIPO 2: ERROR DE CÓDIGO. Añadir output_key al agent upstream.
|
|- ¿Sistema lento o costoso?
   -> TIPO 3: ERROR DE ARQUITECTURA. Reemplazar llamadas LLM con FunctionTools.
```

### Tipo 1: ERRORES DE PROMPT

**Señales**: Decisiones incorrectas, malinterpretación, tools mal usadas, formato incorrecto. Sin errores de Python.

**Verificar**: ¿Instrucción clara? ¿Explica CUÁNDO usar cada tool? ¿Hay ejemplos? ¿Placeholders `{var}` tienen escritores upstream? ¿Condiciones de delegación claras?

### Tipo 2: ERRORES DE CÓDIGO

**Señales**: ImportError, AttributeError, TypeError, KeyError, tools no invocados, falta `root_agent`.

**Verificar**: ¿`agent.py` exporta `root_agent`? ¿`output_schema` bloquea tools? ¿Built-in tools limitados a uno por agent? ¿Agent en `sub_agents` Y `tools` al mismo tiempo? ¿Firmas de callback correctas? ¿`code_executor` usa parámetro propio (no `tools`)?

### Tipo 3: ERRORES DE ARQUITECTURA

**Señales**: Calidad deficiente, agents haciendo demasiado, procesamiento redundante, ejecución lenta/costosa.

**Verificar**: ¿LLM haciendo parsing/math/validación? ¿Agents enfocados (una responsabilidad)? ¿Hay loops de validación? ¿Llamadas costosas al LLM son necesarias o código puede reemplazarlas?

---

## Proceso de Diagnóstico

### Fase 1: Recopilar Datos
Solicitar: exportación de sesión ADK (output + state final), input inicial del usuario, documentación del workflow.

### Fase 2: Identificar Discrepancias
Preguntar: ¿Qué esperabas? ¿Qué ocurrió? ¿Dónde notaste el problema? ¿Qué agents malinterpretaron requisitos?

### Fase 3: Análisis Agent por Agent
Para cada agent: input recibido → procesamiento esperado vs real → output generado → ¿funcionó correctamente?

Identificar: punto de fallo raíz → impacto downstream → efectos de amplificación.

### Fase 4: Soluciones y Plan de Acción
Categorizar problemas, desarrollar correcciones prioritizadas con archivos específicos. Ofrecer crear tarea ADK para implementación.

---

## Patrones Comunes de Cuellos de Botella

### Patrón 1: Fallos en Cascada de State Keys
- **Síntomas**: Agents con datos incompletos, errores downstream
- **Corrección**: Mapeo exhaustivo de dependencias de state

### Patrón 2: Confusión entre Delegación y Tool Call
- **Síntomas**: Agent se detiene después del trabajo en lugar de delegar
- **Corrección**: `AgentTool(agent)` para resultados de vuelta, `sub_agents` + instrucción explícita para handoff

### Patrón 3: LLM Haciendo Trabajo de Código
- **Síntomas**: Ejecución lenta, valores alucinados, costos altos de API
- **Diagnóstico**: ¿Agent haciendo parsing JSON, matemáticas, validación, matching de strings?
- **Corrección**: Reemplazar con `FunctionTool`

```python
# MAL: LLM parsing JSON
agent = LlmAgent(instruction="Parse {api_response} and extract user name and email")

# BIEN: FunctionTool
def extract_user_info(api_response: str) -> dict:
    data = json.loads(api_response)
    return {"name": data["user"]["name"], "email": data["user"]["email"]}

agent = LlmAgent(tools=[extract_user_info], instruction="Use extract_user_info to get user data")
```

### Patrón 4: Compatibilidad output_schema + tools
- **v1.22+**: Ambos funcionan juntos — output_schema NO bloquea tools
- **Pre-v1.22**: `output_schema` bloquea tools. Separar en tool-agent + schema-agent.
- **Verificar** versión con `pip show google-adk` antes de diagnosticar

### Patrón 5: Lecturas Huérfanas de Session State
- **Síntomas**: `{var}` falla, KeyError en interpolación
- **Validación**: Extraer todos los `{placeholder}` de instrucciones, emparejar con todos los `output_key=` del código

### Patrón 6: Problemas de Output Estructurado
- **Síntomas**: Formatos inconsistentes, errores de parsing JSON
- **Corrección**: Pydantic `output_schema` + `output_key` para resultados estructurados

### Patrón 7: Cuellos de Botella de Rendimiento
- **Síntomas**: 30-60s cuando debería ser <1s
- **Corrección**: Reemplazar loops de LLM con FunctionTools por lotes, cachear inputs idénticos

### Patrón 8: Sobrecarga de Responsabilidad del Agent
- **Síntomas**: Agents lentos, múltiples puntos de fallo, resultados inconsistentes
- **Corrección**: Dividir en agents de pipeline (máximo 1-2 tool calls cada uno)

### Patrón 9: Sin Observabilidad en Producción
- **Síntomas**: No se puede diagnosticar en producción, logs insuficientes
- **Diagnóstico**: ¿Hay plugins de logging/tracing configurados?
- **Corrección**: Añadir DebugLoggingPlugin (dev) o OpenTelemetry (prod)

```python
# Dev: trazas completas a YAML
from google.adk.plugins import DebugLoggingPlugin
app = App(root_agent=agent, plugins=[DebugLoggingPlugin(output_path="debug.yaml")])
```

### Patrón 10: Sin Tests de Agentes (Regresiones Silenciosas)
- **Síntomas**: "Antes funcionaba y ahora no" — sin forma de verificar
- **Corrección**: Crear evalsets con `adk eval` (mínimo 3 POR AGENTE), optimizar con `adk optimize` (v1.27+)
- **Referencia**: `ai_docs/refs/adk-python/tests/integration/fixture/` y `ai_docs/refs/adk-samples/` para ejemplos de evalsets
- **Gate**: Sin evalsets = sin deploy. Métricas `safety_v1` ≥ 0.9 y `hallucinations_v1` ≥ 0.8 obligatorias

### Patrón 11: Contexto Excedido (Token Overflow)
- **Síntomas**: Errores de contexto, respuestas truncadas, costos altos en sesiones largas
- **Diagnóstico**: ¿Sesiones con muchos turnos? ¿Eventos sin compactar?
- **Corrección (v1.26+)**: Configurar token compaction intra-invocación en `EventsCompactionConfig`, o usar `ContextFilterPlugin` para limitar invocaciones en contexto

### Patrón 12: Transfer No Retorna al Padre
- **Síntomas**: Agente padre deja de responder después de delegar
- **Causa**: Child no llama transfer_to_agent de vuelta al padre
- **Corrección**: Añadir instrucción explícita de retorno en child: `transfer_to_agent(agent_name='parent')`

### Patrón 13: Loop Infinito
- **Síntomas**: Costos LLM descontrolados, timeouts, sesión que nunca termina
- **Causa**: LoopAgent sin max_iterations y exit_loop nunca invocado
- **Corrección**: Siempre configurar max_iterations como safety net

### Patrón 14: Descriptions Vacías o Vagas
- **Síntomas**: LLM delega al agente equivocado, tools no se invocan
- **Causa**: agent.description vacía o genérica, FunctionTool sin docstring
- **Corrección**: Description de 1-2 líneas describiendo QUÉ HACE. Docstring con qué hace + cuándo usarla.

> Para referencia completa de errores, trampas del SDK y anti-patrones, ver subagent `adk`.

---

## Plantillas Relacionadas

- `task_template_adk.md` — Para implementar correcciones (command)
- `adk-workflow-design` — Para diseñar nuevos workflows (skill)
- `adk-production-setup` — Para configurar servicios y deployment (skill)
- `adk-evaluation-testing` — Para testing con evalsets y regression (skill)

> Checklist de validación maestro en subagent `adk` § Protocolo de Validación Técnica + § Protocolo de Seguridad ADK
> Ejemplos de arquitecturas en `ai_docs/refs/adk-samples/`
