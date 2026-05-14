---
name: adk-evaluation-testing
description: "[ADK] En proyectos Google ADK (google-adk SDK): testing de agentes, evalsets, métricas, adk eval/optimize, regression testing. Activar al completar implementación ADK o validar calidad. NO para tests de código normal (→ unit-testing)."
paths: ["**/agent.py", "**/agents/**", "**/adk/**/*.py", "**/pyproject.toml"]
---

Eres un Especialista en Testing de Agentes ADK. Guías la creación de evalsets, configuración de métricas, optimización de prompts y regression testing para sistemas multi-agente.

---

## 1. Testing Local

### Herramientas disponibles

| Herramienta | Comando | Uso |
|-------------|---------|-----|
| UI interactiva | `adk web apps/my_agent/` | Probar conversaciones manualmente, ver eventos |
| Terminal | `adk run apps/my_agent/` | Testing rápido en CLI |
| Programático | `await runner.run_debug("query")` | Scripts de test automatizados |
| Trazas | `DebugLoggingPlugin` | Post-mortem en YAML |

### `run_debug()` — Testing programático

Shape de invocación: `InMemoryRunner(agent=...).run_debug(input, user_id, session_id, run_config, verbose)`.

- **Input:** string (un mensaje) o lista de strings (conversación multi-turno).
- **`run_config`:** `RunConfig(max_llm_calls=50)` — controlar techo de coste por test.
- **`verbose=True`:** imprime eventos detallados durante la ejecución.

### `DebugLoggingPlugin` — Trazas completas

Instanciar con `output_path="adk_debug.yaml"`, `include_session_state=True`, `include_system_instruction=True`. El YAML resultante contiene: LLM requests/responses, tool calls con argumentos, eventos, state al finalizar.

---

### Escenarios específicos de SkillToolset

Si el agente usa `SkillToolset`, incluir evalsets que cubran:
- **Skill loading correcto:** `load_skill(name)` invocado en el momento adecuado (tool_trajectory).
- **Selección entre skills:** con múltiples skills registradas, el agente elige la correcta según dominio.
- **Fallback sin skills:** respuesta razonable cuando ninguna skill aplica.
- **L3 resources:** si las skills usan `references/`, validar que `load_skill_resource` se invoca cuando procede.

Ver `adk-skills-toolset` para anti-patrones que los evalsets deben detectar.

---

## 2. Evalsets — Testing estructurado

### Estructura JSON

Shape de un evalset:

```
eval_set_id, name
eval_cases[]:
  eval_id
  conversation[]:
    invocation_id
    user_content: { parts[{text}], role: "user" }
    final_response: { parts[{text}], role: "model" }      ← para response_match
    intermediate_data.tool_uses[]: { tool_name, args }    ← para tool_trajectory
```

Referencia de fixtures reales: `ai_docs/refs/adk-python/tests/integration/fixture/` (si disponible en el proyecto).

### Crear evalset desde sesión existente

Via API REST: `POST /apps/{app_name}/eval-sets/{eval_set_id}/add-session` con body `{ "session_id": "session_to_capture" }`.

### Ejecutar evaluación

```bash
adk eval apps/my_agent/ tests/evalsets/test_basic.json \
  --config_file_path tests/eval_config.json \
  --print_detailed_results

# Casos específicos:
adk eval apps/my_agent/ tests/evalsets/test_basic.json:caso1,caso2
```

---

## 3. Métricas y evaluadores

### Métricas built-in

| Métrica | Rango | Qué evalúa |
|---------|-------|------------|
| `tool_trajectory_avg_score` | 0.0-1.0 | ¿Usó las herramientas correctas en el orden correcto? |
| `response_match_score` | 0.0-1.0 | ¿La respuesta coincide con la esperada? |
| `final_response_match_v2` | 0.0-1.0 | Match semántico (LLM-as-judge) |
| `safety_v1` | 0.0-1.0 | ¿La respuesta es segura? |
| `hallucinations_v1` | 0.0-1.0 | ¿Hay alucinaciones? |
| `rubric_based_final_response_quality_v1` | 0.0-1.0 | Calidad según rubrics definidas |
| `rubric_based_tool_use_quality_v1` | 0.0-1.0 | Calidad del uso de herramientas según rubrics |

### Cuándo usar cada métrica

| Necesidad | Métrica recomendada |
|-----------|-------------------|
| Verificar tools correctas | `tool_trajectory_avg_score` |
| Respuesta exacta (determinista) | `response_match_score` |
| Calidad semántica (creativo) | `final_response_match_v2` |
| Seguridad | `safety_v1` |
| Alucinaciones | `hallucinations_v1` |
| Criterios específicos | `rubric_based_*` |

### Eval config (JSON)

Shape de `tests/eval_config.json`:

```
criteria:
  tool_trajectory_avg_score: 0.8          ← threshold simple
  response_match_score: 0.5
  final_response_match_v2:
    threshold: 0.7
    judge_model_options: { judge_model: "gemini-2.5-flash", num_samples: 5 }
  rubric_based_final_response_quality_v1:
    threshold: 0.8
    judge_model_options: { ... }
    rubrics[]: { rubric_id, rubric_content.text_property, type: FINAL_RESPONSE_QUALITY }
```

**Tipos de criterio:** threshold simple (score ≥ N) · LLM-as-judge (con `judge_model_options`) · rubric-based (criterios explícitos por ítem).

---

## 4. Optimización automática

### `adk optimize` — GEPA Prompt Optimizer

```bash
adk optimize apps/my_agent/ \
  --sampler_config_file_path tests/optimizer_config.json \
  --print_detailed_results
```

Flujo: define evalsets de training y validación → GEPA genera variantes del prompt del root agent → evalúa cada variante → selecciona la de mejor score → muestra el prompt optimizado.

### `adk optimize` vs `adk-prompt-cleanup`

| Aspecto | `adk optimize` | `adk-prompt-cleanup` (skill) |
|---------|----------------|------------------------------|
| Método | Automático (LLM optimiza LLM) | Manual (humano revisa) |
| Optimiza | Instrucciones del root agent | Todos los prompts del sistema |
| Basado en | Métricas de evalsets | Patrones anti-framework |
| Cuándo usar | Mejorar scores de evaluación | Corregir anti-patrones ADK |
| Prerequisito | Evalsets existentes | Conocimiento del framework |

**Orden recomendado:** limpiar anti-patrones primero (`adk-prompt-cleanup`), luego optimizar métricas (`adk optimize`).

---

## 5. User Personas (v1.26+)

Simular usuarios con comportamientos definidos para testing multi-turno.

**Shape de `UserPersona`:** `id`, `description`, `behaviors[]` con `name`, `description`, `behavior_instructions[]` (qué hace), `violation_rubrics[]` (qué NO debería hacer).

**Shape de `ConversationScenario` en evalset:**
```
eval_cases[].conversation_scenario:
  starting_prompt: "texto inicial"
  conversation_plan: "instrucción natural de lo que debe hacer el usuario simulado"
  user_persona: "id-de-la-persona"
```

**Métrica de simulación:** `per_turn_user_simulator_quality_v1` — verifica que el usuario simulado sigue la persona definida.

---

## 6. Regression testing

### Flujo CI/CD

```bash
adk eval apps/my_agent/ tests/evalsets/*.json \
  --config_file_path tests/eval_config.json
# Exit code: 0 si todos pasan threshold, 1 si alguno falla
```

### Evalset mínimo por agente

Mínimo 3 casos POR AGENTE PRINCIPAL (no por sistema):

| Caso | Qué verifica |
|---|---|
| Happy path | Flujo principal funciona |
| Tool trajectory | Usa las herramientas correctas |
| Edge case | Maneja input inesperado |

**Sistema con N agentes principales = mínimo N × 3 eval cases.**

### Protocolo de regresión (comparación before/after)

| Paso | Comando |
|---|---|
| 1. Baseline | `adk eval apps/agent/ tests/evalsets/*.json > baseline.txt` |
| 2. Cambio | Realizar cambio en el agente |
| 3. After | `adk eval apps/agent/ tests/evalsets/*.json > after.txt` |
| 4. Comparar | `diff baseline.txt after.txt` — score no debe degradar >5%; métricas de seguridad NO deben degradar nada |
| 5. Si degrada | Revertir y analizar antes de continuar |

### Métricas obligatorias para producción

```json
{ "criteria": { "safety_v1": 0.9, "hallucinations_v1": 0.8, "tool_trajectory_avg_score": 0.8 } }
```

### Anti-patrones de testing

- **Evalset con 1 solo caso** — insuficiente, mínimo 3 por agente
- **Mínimos por sistema, no por agente** — cada agente principal necesita sus propios 3 casos
- **Sin tool trajectory** — solo verificar respuesta final no detecta herramientas mal usadas
- **Threshold 1.0 en response_match** — demasiado estricto para respuestas generativas (usar 0.5-0.7)
- **Sin evalset antes de deploy** — el checklist pre-deploy de `adk-production-setup` lo requiere
- **Optimizar sin baseline** — siempre ejecutar eval ANTES de `adk optimize`
- **Sin métricas de seguridad** — `safety_v1` y `hallucinations_v1` son OBLIGATORIAS en producción

### Referencia de ejemplos

- Fixtures de evalsets: `ai_docs/refs/adk-python/tests/integration/fixture/` (si disponible en el proyecto, o documentación oficial ADK)
- Arquitecturas con testing: `ai_docs/refs/adk-samples/` (si disponible en el proyecto, o documentación oficial ADK)
- Checklist de seguridad completo: subagent `adk` § Protocolo de Seguridad ADK
