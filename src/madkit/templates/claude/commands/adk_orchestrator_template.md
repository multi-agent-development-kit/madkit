# Plantilla de Diseño de Orquestación de Agentes ADK

> **Instrucciones:** Guía al usuario a través de un proceso de dos fases para diseñar arquitecturas de agentes ADK válidas y producir un documento de diseño completo. NO implementar código — este command genera un DOCUMENTO DE DISEÑO únicamente.

---

## CRÍTICO: Protocolo de Creación de Documentos de Diseño

### COMPORTAMIENTO OBLIGATORIO

**Esta plantilla crea un DOCUMENTO DE DISEÑO DE ARQUITECTURA únicamente. NO implementar directamente.**

El documento se guarda en: `ai_docs/tasks/XXX_DESIGN_WORKFLOW_NAME.md`

**Nomenclatura**: `XXX_DESIGN_UPPER_SNAKE_CASE.md` (prefijo DESIGN_ obligatorio)

---

## VIOLACIÓN DE FASES

**NUNCA hacer preguntas de Fase 1 y Fase 2 juntas.** Esto es un error crítico que rompe el proceso.

---

## Fundamentos ADK — Modelo Mental Correcto

- Los agentes ADK son **siempre activados por el usuario** — responden a input, nunca ejecutan automáticamente
- **Sin programación ni automatización** — los usuarios invocan a través de conversación
- **Basado en sesión** — cada interacción crea una sesión con gestión de estado
- **Habilitado con tools** — los agentes usan tools para acciones, no ejecución autónoma

**Modelo mental correcto**: "Agente conversacional que responde a solicitudes del usuario"
**Modelo mental incorrecto**: "Sistema automatizado que ejecuta según programación"

---

## Fase 1: Input del Usuario y Clarificación

### Tareas del Asistente

1. **Solicitar al usuario que presente sus ideas de workflow:**
   - Diagramas visuales o bocetos del proceso
   - Listas con viñetas de lo que quiere lograr
   - Descripciones aproximadas de sus objetivos

2. **Hacer preguntas de clarificación:**
   - ¿Qué fuentes de datos necesitas conectar?
   - ¿Qué tools o APIs necesitas integrar?
   - ¿Cuál es el formato de salida final?
   - ¿Hay puntos de decisión o lógica de ramificación?
   - ¿Qué criterios determinan éxito/finalización?
   - ¿Debería ser un sistema universal o específico de dominio?

3. **Indagar proactivamente por detalles faltantes:**
   - "Veo que quieres investigar competidores — ¿te sugiero usar google_search?"
   - "Para análisis de datos, puedo incluir code_execution — ¿te sería útil?"
   - "Esto suena como que necesita múltiples pasos — ¿diseño un workflow secuencial?"

### Preguntas PROHIBIDAS en Fase 1

- "¿Qué activa este workflow?" → Los agentes ADK SIEMPRE se activan por input del usuario
- "¿Debería ejecutarse automáticamente?" → Los agentes responden a solicitudes, no triggers automáticos
- "¿Con qué frecuencia debería ejecutarse?" → Los agentes no tienen programación

### Preguntas RECOMENDADAS en Fase 1

- Requisitos y objetivos del workflow
- Fuentes de datos e integraciones necesarias
- Formato de salida y criterios de éxito
- Puntos de decisión y lógica de ramificación
- Alcance del dominio (universal vs específico)

### Checkpoint de Finalización de Fase 1

NO proceder a Fase 2 hasta tener:
- [ ] Comprensión clara de los objetivos del usuario
- [ ] Todas las tools e integraciones identificadas
- [ ] Estructura del workflow confirmada con el usuario

**PREGUNTAR EXPLÍCITAMENTE**: "Basándome en nuestra discusión, creo entender tus requisitos de workflow. ¿Estás listo para que proceda a la Fase 2 donde diseñaré la implementación ADK completa?"

**Solo proceder tras aprobación explícita del usuario.**

---

## Fase 2: Diseño del Workflow ADK

### 0. Preparar Documento de Diseño

#### Paso 0.1: Verificar estructura

Verificar que `ai_docs/tasks/` existe.

#### Paso 0.2: Verificar documento existente

Buscar si ya existe un documento de diseño para este workflow. Si existe, ACTUALIZAR en lugar de crear nuevo.

#### Paso 0.3: Detectar siguiente número de tarea

1. Listar archivos en `ai_docs/tasks/`
2. Extraer prefijo de 3 dígitos más alto
3. Sumar 1 y formatear con 3 dígitos

#### Paso 0.4: Crear documento

**Nomenclatura**: `XXX_DESIGN_WORKFLOW_NAME.md`

```
047_DESIGN_CUSTOMER_SUPPORT_AGENTS.md
048_DESIGN_RESEARCH_PIPELINE.md
049_DESIGN_DATA_PROCESSING_WORKFLOW.md
```

---

### 1. Selección de Tipo de Agent

#### Guía de Selección

| Tipo | Usar Para | Patrón |
|------|-----------|--------|
| **LlmAgent / Agent** | Coordinación, razonamiento, tareas con tools | Agente inteligente con LLM |
| **SequentialAgent** | Workflows multi-paso con ejecución ordenada | A → B → C |
| **ParallelAgent** | Tareas independientes simultáneas | A \|\| B \|\| C |
| **LoopAgent** | Tareas repetitivas con condición de terminación | Repetir hasta condición |
| **BaseAgent** | Control personalizado (escalación de loops, routing) | Lógica Python pura |

#### Patrón Root Agent como Consultor Humano

**MEJOR PRÁCTICA**: Root agents actúan como consultores humanos:
- Recopilar contexto primero antes de trabajar
- Delegar control a agentes especializados
- Mantener instrucciones simples, enfocadas en coordinación
- Guardar contexto en session state con `output_key`

**EVITAR**: Root agents con lógica de procesamiento compleja.

---

### 2. Framework de Decisión: AgentTool vs Sub-Agent

#### Checklist de Decisión (8 preguntas)

| # | Pregunta | AgentTool | Sub-Agent |
|---|----------|-----------|-----------|
| 1 | ¿El padre necesita procesar/actuar sobre resultados? | **SÍ** | No |
| 2 | ¿El usuario interactúa directamente con el especialista? | No | **SÍ** |
| 3 | ¿Es routing único vs orquestación continua? | Orquestación | **Routing** |
| 4 | ¿El usuario controla cuándo ejecuta este agente? | **SÍ** | No |
| 5 | ¿Este agente siempre es parte del workflow? | No | **SÍ** |
| 6 | ¿Podría llamarse múltiples veces en sesión? | **SÍ** | No |
| 7 | ¿Es una capacidad condicional? | **SÍ** | No |
| 8 | ¿Es un paso requerido del pipeline? | No | **SÍ** |

**VERIFICACIÓN CRÍTICA**: ¿El padre solo "presentará" resultados sin procesarlos? Si SÍ → **Sub-Agent** (evitar anti-patrón middleman).

#### Anti-Patrón Middleman

```python
# INCORRECTO: Intermediario inútil
middleman = LlmAgent(
    tools=[AgentTool(specialist)],
    instruction="Usa el especialista y presenta resultados",
)
# Flujo: User → Middleman → Specialist → Middleman → User

# CORRECTO: Routing directo
router = LlmAgent(
    sub_agents=[specialist_a, specialist_b],
    instruction="Enrutar al usuario al especialista apropiado",
)
# Flujo: User → Router → Specialist (interacción directa)
```

#### Anti-Patrón: Todo como AgentTool

```python
# INCORRECTO: Pasos secuenciales como tools
confused = LlmAgent(
    tools=[AgentTool(step1), AgentTool(step2), AgentTool(step3)],
    instruction="Ejecutar todos los pasos en secuencia",
)

# CORRECTO: SequentialAgent
pipeline = SequentialAgent(sub_agents=[step1, step2, step3])
```

---

### 3. Arquitectura de Integración vs Separación

#### Indicadores de Integración (Combinar en Agente Único)

- Acoplamiento estrecho: funciones siempre trabajan juntas
- Contexto compartido: ambas necesitan la misma información
- Workflow del usuario: lo ve como una sola interacción
- Dependencia de state: una función depende del state de la otra
- Rendimiento: comunicación frecuente entre funciones

**SÍ a 3+ indicadores → INTEGRAR**

#### Indicadores de Separación (Dividir en Múltiples Agentes)

- Ejecución independiente: pueden ejecutarse por separado
- Tools diferentes: necesitan diferentes built-in tools
- Modelos especializados: diferentes capacidades de modelo
- Procesamiento paralelo: pueden ejecutarse concurrentemente
- Límites claros: responsabilidades distintas

**SÍ a 2+ indicadores → SEPARAR**

#### Anti-Patrones

| Anti-Patrón | Señal | Corrección |
|-------------|-------|------------|
| **Micro-Agent** | Agentes para funciones triviales (saludar, despedir) | Integrar en un solo agente |
| **God Agent** | Un agente con todas las tools y responsabilidades | Separar por requisitos de tools |
| **Over-Separation** | 10 agentes para workflow simple | Integrar funciones relacionadas |

---

### 4. Documentar Cada Agente

Para cada agente del workflow, documentar:

```markdown
### Agent: [nombre_descriptivo]

- **Tipo**: LlmAgent | SequentialAgent | ParallelAgent | LoopAgent | BaseAgent
- **Propósito**: [1-2 frases]
- **Sub-agents**: [lista, si aplica]
- **Tools**: [con justificación]
- **Callbacks**: [before/after, si aplica]
- **Input State**: {keys_que_lee}
- **Output State**: output_key="key_que_escribe"
- **Modelo**: gemini-2.5-flash | gemini-2.5-pro
- **Justificación**: [por qué este tipo y configuración]
```

---

### 5. Especificaciones de Session State (OBLIGATORIO)

Para CADA state key del workflow:

```markdown
### State Key: [nombre_key]

- **Creado por**: [qué agente escribe]
- **Tipo de Dato**: String | Dictionary | List
- **Contenido**: [qué información almacena]
- **Lectores**: [qué agentes leen esta key]
- **Ejemplo**:
```json
{...ejemplo completo...}
```
```

#### Comportamiento Default Crítico

- **Output default**: Agentes guardan texto conversacional (strings) vía `output_key`
- **Output estructurado**: Solo con `output_schema` + modelo Pydantic
- **Input del usuario**: NO se captura automáticamente — usar `before_agent_callback`

#### Qué Pertenece al State vs Instrucciones

| En State (pasa entre agentes) | En Instrucciones (NO en state) |
|-------------------------------|-------------------------------|
| Planes con clasificaciones | Criterios de calidad |
| Hallazgos y datos | Estrategias de búsqueda |
| Esquemas de reportes | Requisitos de formato |
| Resultados de evaluación | Directrices de comportamiento |

#### Patrón de Acceso a State

```python
# CORRECTO: Acceso a string (default)
instruction="Contexto: {research_context}\nPlan: {research_plan}"

# CORRECTO: Acceso estructurado (solo con output_schema)
instruction="Industria: {research_context[industry]}"

# INCORRECTO: Asumir acceso anidado sin output_schema
instruction="Empresa: {research_context[company_name]}"  # FALLA si es string
```

---

### 6. Reglas de Distribución de Tools

#### Reglas Absolutas

- **Solo UNA built-in tool por agente** (google_search, built_in_code_execution, VertexAiSearchTool)
- **NO combinar** built-in tools con otras tools en el mismo agente
- **Múltiples FunctionTool** por agente: permitido
- **Múltiples agentes** con built-in tools diferentes: permitido

#### Framework de Decisión de Tools

| Pregunta | Tool |
|----------|------|
| ¿Necesita datos externos actuales? | `google_search` |
| ¿Necesita realizar cálculos? | `built_in_code_execution` |
| ¿Necesita llamar servicios externos? | `FunctionTool` |
| ¿Necesita usar condicionalmente otros agentes? | `AgentTool` |
| ¿Necesita conocimiento de dominio cargable on-demand (spec/políticas/guías)? | `SkillToolset` (ver `adk-skills-toolset`) |
| ¿Integración con servicio externo (BD, API, MCP server)? | `MCPToolset` / `FunctionTool` |
| ¿Es puro procesamiento de texto/razonamiento? | **Sin tools** |

**Decisión SkillToolset vs alternativas:**
- SkillToolset = **conocimiento** cargable (no ejecuta código). Usar cuando el agente cubre múltiples dominios o `instruction` excede ~5k tokens.
- Las skills deben cumplir spec **agentskills.io** (kebab-case ≤64, desc ≤1024, cuerpo ≤500 líneas). Estructura `skills/<name>/SKILL.md + references/`.

#### Cuándo NO Se Necesitan Tools

Tareas de planificación, razonamiento o texto puro se resuelven con el LLM sin tools.

```python
# Sin tools para planificación
planner = LlmAgent(instruction="Dividir el plan en secciones ejecutables")

# Sin tools para generación de reportes
reporter = LlmAgent(instruction="Generar reportes profesionales en markdown")
```

---

### 7. Modelos de Datos Estructurados (Pydantic)

#### Usar output_schema SOLO Para

- **Control de loops**: grade/score para terminación
- **Routing de workflows**: flujos condicionales
- **Puertas de validación**: checkpoints pass/fail

#### NO Usar Para

- Session state → diccionarios simples
- Callbacks → tipos Python nativos
- Outputs de texto → strings
- Datos que solo pasan entre agentes

```python
# CORRECTO: Control de loop
class Feedback(BaseModel):
    grade: Literal["pass", "fail"]
    comment: str
    follow_up_queries: list[str] | None = None

evaluator = LlmAgent(
    output_schema=Feedback,
    output_key="evaluation_result",
)
```

**Regla de oro**: El 90% de casos se resuelve con string output bien formateado.

---

### 8. Ingeniería de Instrucciones

#### Arquitectura por Capas

```
CAPA DE ROL:       Quién es el agente y su expertise
CAPA DE REGLAS:    Restricciones operacionales no negociables
CAPA DE PROCESO:   Pasos a seguir en orden
CAPA DE CALIDAD:   Estándares y validación
CAPA DE OUTPUT:    Formato de salida (SIEMPRE AL FINAL)
```

#### Patrones Clave

**Instrucciones basadas en reglas**: Definir REGLAS CRÍTICAS numeradas, CRITERIOS DE EVALUACIÓN, CONTEXTO dinámico, FORMATO DE OUTPUT al final.

**Instrucciones por fases**: Separar ejecución en Fase 1 (RESEARCH) → Fase 2 (DELIVERABLE) con prerrequisitos explícitos y criterios de completitud por fase.

**Instrucciones con restricciones**: FUNCIÓN PRINCIPAL + RESTRICCIONES CRÍTICAS (NUNCA/SIEMPRE) + RESTRICCIONES DE WORKFLOW (secuencia obligatoria) + RESTRICCIONES DE COMPORTAMIENTO.

**Comportamiento explícito**: CUANDO [situación] → [acción específica]. NUNCA [lista]. SIEMPRE [lista].

---

### 9. Gestión de Estado Avanzada con Callbacks

#### Cuándo Usar Callbacks vs State Simple

| Usar Callbacks Para | Usar Session State Simple Para |
|---------------------|-------------------------------|
| Transformaciones complejas de state | Paso de datos key-value |
| Tracking de fuentes y citaciones | Preferencias del usuario |
| Post-procesamiento de outputs | State temporal sin procesamiento |
| Agregación de datos | Comunicación básica entre agentes |
| Mecanismos de recuperación de errores | |

#### Patrón de Inicialización de State

```python
def initialize_state(callback_context):
    session_state = callback_context._invocation_context.session.state
    defaults = {"research_context": {}, "research_findings": [], "sources": {}}
    for key, default in defaults.items():
        if key not in session_state:
            session_state[key] = default

root_agent = Agent(before_agent_callback=initialize_state)
```

#### Mejores Prácticas

- **Responsabilidad única**: Un callback, una tarea
- **Manejo de errores**: try/except con state de fallback
- **Validación**: Verificar keys requeridas antes de procesar

---

### 10. Jerarquía de Agentes — Diagrama de Conexiones

Documentar cómo se conectan los agentes:

```markdown
root_agent (LlmAgent) — coordina workflow
├── planning_agent (LlmAgent) — output_key="plan"
├── execution_pipeline (SequentialAgent) — procesa plan aprobado
│   ├── research_agent (LlmAgent con google_search) — output_key="findings"
│   ├── analysis_agent (LlmAgent con code_execution) — output_key="analysis"
│   └── report_agent (LlmAgent) — output_key="report"
└── quality_loop (LoopAgent, max_iterations=3)
    ├── evaluator (LlmAgent con output_schema) — output_key="eval_result"
    └── escalation_checker (BaseAgent) — control de loop
```

---

### 11. Patrones de Comunicación

| Patrón | Descripción | Uso |
|--------|-------------|-----|
| **Lineal** | A → State → B → State → C | SequentialAgent |
| **Hub** | Root delega a A, B, C | LlmAgent con sub_agents |
| **Paralelo** | A \|\| B \|\| C → Combiner lee states | ParallelAgent |
| **Loop** | Process → Evaluate → ¿Continuar? | LoopAgent |

---

### 12. Selección de Modelo

| Modelo | Velocidad | Costo | Razonamiento | Cuándo Usar |
|--------|-----------|-------|--------------|-------------|
| gemini-2.5-flash | Alta | $ | Bueno | Mayoría de agentes, coordinación, tareas rápidas |
| gemini-2.5-pro | Media | $$ | Excelente | Análisis complejo, evaluación de calidad, razonamiento profundo |

**Recomendación**: Usar `gemini-2.5-flash` por defecto. Reservar `gemini-2.5-pro` para agentes que requieran razonamiento complejo.

---

### 13. Validación de Arquitectura (30 puntos)

**Arquitectura de Agents (10 pts)**:
- [ ] Tipo de agent coincide con caso de uso
- [ ] Responsabilidad única y clara por agent
- [ ] Granularidad apropiada (sin micro-agents ni god-agents)
- [ ] Ningún agent en sub_agents Y tools al mismo tiempo
- [ ] Máximo 1 built-in tool por agent
- [ ] Root agent exportado correctamente
- [ ] Estructura de directorios sigue convención
- [ ] Descripciones claras de agents
- [ ] Instructions globales vs de agent separadas
- [ ] Uso de callbacks justificado

**State Management (8 pts)**:
- [ ] Todas las lecturas tienen escritores upstream
- [ ] Nombres consistentes (snake_case)
- [ ] Tipos de datos explícitos (STRING vs DICT)
- [ ] Sintaxis de acceso correcta ({key} vs {key[field]})
- [ ] Sin colisiones de keys
- [ ] Timing de persistencia comprendido
- [ ] Session backend apropiado
- [ ] Acoplamiento mínimo de state

**Distribución de Tools (6 pts)**:
- [ ] Principio de mínimo privilegio
- [ ] Límites de seguridad claros
- [ ] Sin responsabilidades superpuestas
- [ ] FunctionTools para lógica determinista
- [ ] ToolContext para acceso a state
- [ ] Manejo de errores en tools

**Integración (6 pts)**:
- [ ] Imports correctos (`google.adk.*`)
- [ ] Sin secretos hardcodeados
- [ ] Selección de modelo justificada
- [ ] Output schemas diseñados para evolución
- [ ] Mecanismos de recuperación de errores
- [ ] Target de deployment considerado

**Puntuación**: __/30 (Aprobado: 27-30 | Revisión: 24-26 | Reprobado: <24)

---

### 14. Presentar al Usuario

**ANÁLISIS CRÍTICO OBLIGATORIO — Antes de presentar, el asistente DEBE:**

1. Revisar la arquitectura e identificar dependencias no documentadas
2. Evaluar si la complejidad es adecuada — ¿demasiados agentes? ¿pocos?
3. Considerar si existe una arquitectura más simple que logre los mismos objetivos
4. Identificar riesgos de diseño (bottlenecks, single points of failure)
5. Formular 2-3 observaciones concretas sobre la orquestación

```
Documento de Diseño Creado: ai_docs/tasks/XXX_DESIGN_WORKFLOW_NAME.md

Resumen: [2-3 oraciones]
Arquitectura: [Tipo principal + cantidad de agentes]
State Keys: [N keys documentadas]
Validación: [Puntuación /30]

Observaciones del Asistente:
1. **[Categoría]:** [Observación concreta]
2. **[Categoría]:** [Observación concreta]
3. **[Categoría]:** [Observación concreta — si aplica]

> Categorías: Riesgo de diseño | Simplificación posible | Dependencia detectada |
> Optimización | Alternativa de arquitectura | Ajuste de granularidad

Opciones:
A) Aprobar diseño y crear tarea de implementación con /task_template_adk
B) Modificar arquitectura o refinar diseño
C) Explorar arquitectura alternativa
```

**ESPERAR elección explícita del usuario** — NO asumir aprobación

---

### 15. Estructura de Proyecto ADK

```
agent-project/
├── agent.py                  # Root agent
├── __init__.py               # from .agent import root_agent
├── sub_agents/
│   ├── agent_name/
│   │   ├── agent.py
│   │   └── __init__.py
│   └── ...
└── tools/
    ├── __init__.py
    └── function_tools.py
```

---

## Directiva de Iteración Proactiva del Asistente

El asistente NO actúa como documentador pasivo. Actúa como **consultor técnico activo**:

- Analizar CRÍTICAMENTE la arquitectura antes de presentarla
- Identificar dependencias, prerequisitos, riesgos proactivamente
- Proponer alternativas y mejoras cuando sean evidentes
- Señalar cuando una refactorización más amplia sería más eficiente
- Cuestionar decisiones de diseño débiles con alternativas concretas

**Versión del Framework**: 1.0
**Compatibilidad ADK**: v1.18+
