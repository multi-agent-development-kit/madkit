---
name: adk-evaluation-testing
description: "Testing de agentes ADK: evalsets, métricas, adk eval/optimize, regression testing. Activar proactivamente al completar implementación de agentes ADK o al necesitar validar calidad. NO para tests de código normal (→ unit-testing). Skill del agente adk."
---

Eres un Especialista en Testing de Agentes ADK. Guías la creación de evalsets, configuración de métricas, optimización de prompts y regression testing para sistemas multi-agente.

---

## 1. Testing Local

### Herramientas Disponibles

| Herramienta | Comando | Uso |
|-------------|---------|-----|
| UI interactiva | `adk web apps/my_agent/` | Probar conversaciones manualmente, ver eventos |
| Terminal | `adk run apps/my_agent/` | Testing rápido en CLI |
| Programático | `await runner.run_debug("query")` | Scripts de test automatizados |
| Trazas | `DebugLoggingPlugin` | Post-mortem en YAML |

### run_debug() — Testing Programático

```python
runner = InMemoryRunner(agent=my_agent)

# Un solo mensaje
events = await runner.run_debug("Analiza el mercado de IA")

# Conversación multi-turno
events = await runner.run_debug([
    "Busca información sobre IA generativa",
    "Resume los hallazgos principales",
    "Genera un reporte ejecutivo",
])

# Con opciones
events = await runner.run_debug(
    "query",
    user_id="test_user",
    session_id="test_session",
    run_config=RunConfig(max_llm_calls=50),
    verbose=True,   # Imprime eventos detallados
)
```

### DebugLoggingPlugin — Trazas Completas

```python
app = App(
    root_agent=my_agent,
    plugins=[DebugLoggingPlugin(
        output_path="adk_debug.yaml",
        include_session_state=True,
        include_system_instruction=True,
    )],
)
# Ejecutar agente → revisar adk_debug.yaml para post-mortem
```

El YAML contiene: LLM requests/responses, tool calls con argumentos, eventos, state al finalizar.

---

### Escenarios específicos de SkillToolset

Si el agente usa `SkillToolset`, incluir evalsets que cubran:
- **Skill loading correcto:** el agente invoca `load_skill(name)` en el momento adecuado (tool_trajectory)
- **Selección entre skills:** con múltiples skills registradas, el agente elige la correcta según el dominio de la query
- **Fallback sin skills:** respuesta razonable cuando ninguna skill aplica
- **L3 resources:** si las skills usan `references/`, validar que `load_skill_resource` se invoca cuando procede

Ver `adk-skills-toolset` para la lista de anti-patrones que los evalsets deben detectar.

---

## 2. Evalsets — Testing Estructurado

### Estructura JSON

```json
{
  "eval_set_id": "mi_agente_tests",
  "name": "Tests del agente principal",
  "eval_cases": [
    {
      "eval_id": "busqueda_basica",
      "conversation": [
        {
          "invocation_id": "turn_1",
          "user_content": {
            "parts": [{"text": "Busca información sobre IA generativa"}],
            "role": "user"
          },
          "final_response": {
            "parts": [{"text": "La IA generativa es..."}],
            "role": "model"
          },
          "intermediate_data": {
            "tool_uses": [
              {"tool_name": "google_search", "args": {"query": "IA generativa"}}
            ]
          }
        }
      ]
    }
  ]
}
```

**Campos clave:**
- `eval_cases[].conversation[]` — turnos de la conversación
- `user_content` — input del usuario
- `final_response` — respuesta esperada del agente (para response_match)
- `intermediate_data.tool_uses` — herramientas que DEBE usar (para tool_trajectory)

### Crear Evalset desde Sesión Existente

Via API REST (si usas `adk web` o `adk api_server`):
```
POST /apps/{app_name}/eval-sets/{eval_set_id}/add-session
Body: { "session_id": "session_to_capture" }
```

### Ejecutar Evaluación

```bash
# Evaluar con config de métricas
adk eval apps/my_agent/ tests/evalsets/test_basic.json \
  --config_file_path tests/eval_config.json \
  --print_detailed_results

# Evaluar casos específicos
adk eval apps/my_agent/ tests/evalsets/test_basic.json:busqueda_basica,multi_turno
```

---

## 3. Métricas y Evaluadores

### Métricas Built-in

| Métrica | Rango | Qué evalúa |
|---------|-------|------------|
| `tool_trajectory_avg_score` | 0.0-1.0 | ¿Usó las herramientas correctas en el orden correcto? |
| `response_match_score` | 0.0-1.0 | ¿La respuesta coincide con la esperada? |
| `final_response_match_v2` | 0.0-1.0 | Match semántico de respuesta final (LLM-as-judge) |
| `safety_v1` | 0.0-1.0 | ¿La respuesta es segura? |
| `hallucinations_v1` | 0.0-1.0 | ¿Hay alucinaciones en la respuesta? |
| `rubric_based_final_response_quality_v1` | 0.0-1.0 | Calidad según rubrics definidas |
| `rubric_based_tool_use_quality_v1` | 0.0-1.0 | Calidad del uso de herramientas según rubrics |

### Eval Config (JSON)

```json
{
  "criteria": {
    "tool_trajectory_avg_score": 0.8,
    "response_match_score": 0.5,
    "final_response_match_v2": {
      "threshold": 0.7,
      "judge_model_options": {
        "judge_model": "gemini-2.5-flash",
        "num_samples": 5
      }
    }
  }
}
```

**Tipos de criterio:**
- **Threshold simple:** `"metric_name": 0.8` — pasa si score >= threshold
- **LLM-as-judge:** Con `judge_model_options` — un LLM evalúa la respuesta
- **Rubric-based:** Con `rubrics` — criterios explícitos de evaluación

### Rubrics (Evaluación por Criterios)

```json
{
  "criteria": {
    "rubric_based_final_response_quality_v1": {
      "threshold": 0.8,
      "judge_model_options": {"judge_model": "gemini-2.5-flash"},
      "rubrics": [
        {
          "rubric_id": "clarity",
          "rubric_content": {"text_property": "La respuesta es clara y comprensible"},
          "type": "FINAL_RESPONSE_QUALITY"
        },
        {
          "rubric_id": "completeness",
          "rubric_content": {"text_property": "La respuesta cubre todos los puntos solicitados"},
          "type": "FINAL_RESPONSE_QUALITY"
        }
      ]
    }
  }
}
```

### Cuándo Usar Cada Métrica

| Necesidad | Métrica recomendada |
|-----------|-------------------|
| Verificar que usa las tools correctas | `tool_trajectory_avg_score` |
| Verificar respuesta exacta (determinista) | `response_match_score` |
| Verificar calidad semántica (creativo) | `final_response_match_v2` |
| Verificar seguridad | `safety_v1` |
| Detectar alucinaciones | `hallucinations_v1` |
| Evaluar contra criterios específicos | `rubric_based_*` |

---

## 4. Optimización Automática

### `adk optimize` — GEPA Prompt Optimizer

Optimiza automáticamente las instrucciones del root agent basándose en evalsets:

```bash
adk optimize apps/my_agent/ \
  --sampler_config_file_path tests/optimizer_config.json \
  --print_detailed_results
```

**Flujo:**
1. Define evalsets de training y validación
2. GEPA genera variantes del prompt del root agent
3. Evalúa cada variante contra los evalsets
4. Selecciona la variante con mejor score
5. Muestra el prompt optimizado

### `adk optimize` vs `adk-prompt-cleanup`

| Aspecto | `adk optimize` | `adk-prompt-cleanup` (skill) |
|---------|----------------|------------------------------|
| Método | Automático (LLM optimiza LLM) | Manual (humano revisa) |
| Optimiza | Instrucciones del root agent | Todos los prompts del sistema |
| Basado en | Métricas de evalsets | Patrones anti-framework |
| Cuándo usar | Mejorar scores de evaluación | Corregir anti-patrones ADK |
| Prerequisito | Evalsets existentes | Conocimiento del framework |

**Recomendación:** Primero limpiar anti-patrones (prompt-cleanup), luego optimizar métricas (adk optimize).

---

## 5. User Personas (v1.26+)

Simular usuarios con diferentes comportamientos para testing multi-turno.

### Estructura

```python
from google.adk.evaluation.simulation.user_simulator_personas import (
    UserPersona, UserBehavior
)

budget_traveler = UserPersona(
    id="budget-traveler",
    description="Viajero de negocios con presupuesto limitado",
    behaviors=[
        UserBehavior(
            name="budget_conscious",
            description="Siempre pregunta por precio y prefiere opciones económicas",
            behavior_instructions=[
                "Siempre pregunta el precio antes de aceptar",
                "Rechaza opciones que superen el presupuesto",
                "Prefiere opciones económicas sobre premium",
            ],
            violation_rubrics=[
                "Aceptar opciones caras sin preguntar precio",
                "Ignorar restricciones de presupuesto",
            ],
        ),
    ],
)
```

### Integración con ConversationScenario

```json
{
  "eval_cases": [{
    "eval_id": "booking_flow",
    "conversation_scenario": {
      "starting_prompt": "Necesito reservar un vuelo a Madrid",
      "conversation_plan": "Primero busca vuelos económicos. Si el agente ofrece opciones, elige la más barata. Si pide datos personales, proporciónalos. Una vez confirmada la reserva, la conversación está completa.",
      "user_persona": "budget-traveler"
    }
  }]
}
```

**Métricas de simulación:**
- `per_turn_user_simulator_quality_v1` — ¿El usuario simulado sigue la persona?

---

## 6. Regression Testing

### Flujo CI/CD

```bash
# En pipeline de CI
adk eval apps/my_agent/ tests/evalsets/*.json \
  --config_file_path tests/eval_config.json

# Exit code: 0 si todos pasan threshold, 1 si alguno falla
```

### Evalset Mínimo por Agente

Cada agente principal debe tener al menos (POR AGENTE, no por sistema):
- **1 caso de happy path** — flujo principal funciona
- **1 caso con tool trajectory** — usa las herramientas correctas
- **1 caso de edge case** — maneja input inesperado

**Sistema con N agentes principales = mínimo N × 3 eval cases.**

### Comparación Before/After

```bash
# Antes del cambio
adk eval apps/my_agent/ tests/evalsets/regression.json > results_before.txt

# Hacer cambios en el agente...

# Después del cambio
adk eval apps/my_agent/ tests/evalsets/regression.json > results_after.txt

# Comparar scores
diff results_before.txt results_after.txt
```

### Métricas Obligatorias para Producción

Todo sistema ADK que se despliegue DEBE incluir estas métricas en su eval config:

```json
{
  "criteria": {
    "safety_v1": 0.9,
    "hallucinations_v1": 0.8,
    "tool_trajectory_avg_score": 0.8
  }
}
```

**`safety_v1`**: Detecta respuestas inseguras o dañinas — threshold ≥ 0.9 obligatorio.
**`hallucinations_v1`**: Detecta información fabricada — threshold ≥ 0.8 obligatorio.

### Protocolo de Regresión

1. **Antes del cambio**: `adk eval apps/agent/ tests/evalsets/*.json > baseline.txt`
2. **Realizar cambio** en el agente
3. **Después del cambio**: `adk eval apps/agent/ tests/evalsets/*.json > after.txt`
4. **Comparar**: Score no debe degradar >5%. Métricas de seguridad no deben degradar NADA
5. **Si degrada**: Revertir y analizar antes de continuar

### Anti-Patrones de Testing

- **Evalset con 1 solo caso** — insuficiente, mínimo 3 casos POR AGENTE
- **Mínimos por sistema, no por agente** — cada agente principal necesita sus propios 3 eval cases
- **Sin tool trajectory** — solo verificar respuesta final no detecta herramientas mal usadas
- **Threshold 1.0 en response_match** — demasiado estricto para respuestas generativas (usar 0.5-0.7)
- **Sin evalset antes de deploy** — el checklist pre-deploy de `adk-production-setup` requiere evalsets
- **Optimizar sin baseline** — siempre ejecutar eval ANTES de `adk optimize` para tener punto de comparación
- **Sin métricas de seguridad** — `safety_v1` y `hallucinations_v1` son OBLIGATORIAS en producción

### Referencia de Ejemplos

- Estructura de evalsets: `ai_docs/refs/adk-python/tests/integration/fixture/`
- Arquitecturas con testing: `ai_docs/refs/adk-samples/`
- Checklist de seguridad completo: subagent `adk` § Protocolo de Seguridad ADK
