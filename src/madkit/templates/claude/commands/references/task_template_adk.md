# Plantilla de Tarea para Sistema de Agentes ADK

> **Instrucciones:** Crea documentos de tareas comprensivos para sistemas Google Agent Development Kit (ADK). Asegura diseño apropiado de flujo multi-agente, integración de herramientas y despliegue.
>
> **Prerrequisito:** subagent `adk` debe estar cargado como referencia de patrones ADK.
>
> **Cabecera de Metadatos opcional:** los task docs ADK pueden incluir cabecera blockquote con `> **Depende de:**`, `> **Asunciones:**` y sub-sección "Wiring esperado" para el flujo `task-planner` Paso 0.6 (waves). Para ADK, las "Asunciones" típicas incluyen: SDK ADK instalado (verificar versión vigente con `pip show google-adk`), modelo Gemini disponible, evalsets configurados.

---

## CRÍTICO: Protocolo de Creación de Documentos de Tarea

### COMPORTAMIENTO OBLIGATORIO

**Esta plantilla crea un DOCUMENTO DE PLANIFICACIÓN únicamente. NO implementar directamente.**

**REGLA ABSOLUTA PARA ADK:** TODO cambio genera tarea. Incluidos bugfixes.
Los errores en ADK tienen costos compuestos (latencias, API costs, regresiones silenciosas).
Un "bugfix rápido" sin planificación puede crear 3 bugs nuevos por state keys huérfanas.

---

## CLASIFICACIÓN DE COMPLEJIDAD DE TAREA - LEE ESTO PRIMERO

<!-- AI Agent: Determina la complejidad ANTES de crear el documento de tarea. La mayoria de tareas son SIMPLE. -->

### TAREA SIMPLE (Usa secciones 1,15,21 solamente - ~150 líneas)

**Criterios — TODOS deben ser verdaderos:**
- Cambio en un solo agente (instrucciones, nombre, descripción)
- Sin nuevos agentes ni herramientas
- Sin cambios en state keys
- Limitado a 1-2 archivos
- Requisitos claros e inequívocos

**Ejemplos:**
- Actualizar instrucciones de un agente existente
- Corregir nombre de state key en placeholder
- Agregar un parámetro a FunctionTool existente
- Cambiar modelo de agente (flash → pro)

### TAREA ESTÁNDAR (Usa secciones 1-4,6,15,21 - ~400 líneas)

**Criterios — CUALQUIERA activa ESTÁNDAR:**
- Nuevo agente individual con herramientas
- Nuevas FunctionTools (sin cambio de arquitectura)
- Cambios en state keys que afectan 2+ agentes
- Integración MCP nueva
- 3-5 archivos afectados

**Ejemplos:**
- Agregar nuevo agente especialista a sistema existente
- Implementar FunctionTools con acceso a estado
- Integrar servidor MCP con herramientas filtradas
- Agregar callbacks (before/after) a agente existente

### TAREA COMPLEJA (Usa todas las secciones - ~600+ líneas)

**Criterios — CUALQUIERA activa COMPLEJA:**
- Nuevo sistema multi-agente (3+ agentes)
- Cambio de arquitectura (Sequential → Parallel, etc.)
- Rediseño de flujo de estado entre agentes
- 6+ archivos afectados
- Cambios en patrones de orquestación

**Ejemplos:**
- Diseñar sistema coordinador con agentes especialistas
- Migrar de LlmAgent simple a SequentialAgent con pipeline
- Implementar LoopAgent con criterios de calidad
- Rediseñar flujo de estado completo del sistema

### TAREA CRÍTICA (Usa todas las secciones + plan de rollback obligatorio - ~800+ líneas)

**Criterios — CUALQUIERA activa CRÍTICA:**
- Cambios en agentes de producción desplegados
- Migración de schema de estado en sistema activo
- Cambio de proveedor de modelo (Gemini → otro)
- Operaciones que afectan datos de usuarios en producción
- Despliegue a Agent Engine con usuarios activos

**Ejemplos:**
- Refactorizar root_agent en producción con usuarios activos
- Migrar state keys en sistema desplegado en Cloud Run
- Cambiar backend de sesión (InMemory → Firestore) en producción
- Actualizar versión de SDK con cambios breaking

---

## 0. Validación Pre-Vuelo (OBLIGATORIA)

**Propósito:** Validar prerequisitos específicos de ADK antes de proceder.

**DETENER. NO proceder si CUALQUIER validación falla. Resolver TODOS los fallos antes de continuar.**

---

### Paso 0.0.1: Entorno Python

Verificar Python 3.10+, venv activo.

**Verificaciones:** `python --version` (3.10+), venv existe y activado (`echo $VIRTUAL_ENV`).

### Paso 0.0.1b: Repos de Referencia ADK

Verificar que los repos oficiales están disponibles localmente.

**Verificaciones:**
- [ ] `ai_docs/refs/adk-python/` existe (SDK, docs, changelog, samples)
- [ ] `ai_docs/refs/adk-samples/` existe (arquitecturas de referencia de Google)
- Si NO existen: ejecutar `/calibrate-templates` primero o clonar manualmente

### Paso 0.0.1c: Análisis de Seguridad Pre-Tarea

**Verificaciones obligatorias antes de proceder:**
- [ ] Grep de credenciales hardcoded: `grep -ri "api.key\|token\|secret\|password" --include="*.py" apps/` → 0 resultados
- [ ] `max_llm_calls` configurado en RunConfig de agentes existentes
- [ ] Variables de entorno documentadas para credentials del proyecto

### Paso 0.0.2: SDK ADK

Verificar google-genai instalado, API keys configuradas.

**Verificaciones:**
- `pip show google-adk` → versión ≥1.22 (v1.27+ recomendado)
- `python -c "from google.adk.agents import LlmAgent"` → import exitoso
- `echo $GOOGLE_API_KEY` o `echo $GOOGLE_CLOUD_PROJECT` → configurado
- Verificar `ai_docs/refs/adk-python/CHANGELOG.md` → ¿breaking changes entre versión instalada y última?

### Paso 0.0.3: Estructura del Proyecto

Verificar que agent.py existe, __init__.py presente.

**Verificaciones:** Archivos de agentes siguen patrones ADK, todos exportan `root_agent = agent`, imports usan convenciones actuales del SDK.

### Paso 0.0.4: Nomenclatura de Tareas

Confirmar que el proyecto ADK usa nomenclatura `XXX_UPPER_SNAKE_CASE.md` para archivos de tarea.

---

### Validación Pre-Vuelo Completa

**Checklist:**
- [ ] Python 3.10+ con venv activo
- [ ] SDK google-genai instalado e importable
- [ ] API key configurada
- [ ] Agentes existentes exportan root_agent correctamente
- [ ] Acceso al sistema de archivos validado
- [ ] Nomenclatura UPPER_SNAKE_CASE confirmada

**TODOS pasan:** Proceder al Paso 0.1 | **CUALQUIERA falla:** Resolver antes de proceder

---

### 0.0.6 — Triaje de Ingeniería (OBLIGATORIO para ESTÁNDAR+)

**T1 — Radio de impacto (delta ADK):**

- Unidad de análisis: **agentes, state keys, tools (FunctionTool / LLM tools / MCP), callbacks (before/after), session backends**.
- Prerequisitos típicos: SDK ADK instalado (verificar versión vigente con `pip show google-adk`) · API key configurada · session backend correcto · state keys de upstream existen · `root_agent` exportado.
- Integración: patrones de agentes/tools establecidos · state keys existentes reutilizables · MCP servers conectados.
- Decisiones stack-specific en T2: ¿nuevo agente o extender existente? · ¿LLM o FunctionTool? (FunctionTool ahorra costes) · ¿callback o instrucción? · jerarquía de agentes innecesaria → KISS.

**Tabla de complejidad (común a todos los stacks, con ajuste ADK):**

| Radio | Complejidad |
|---|---|
| ≤2 archivos en 1 agente (raro en ADK) | SIMPLE |
| 3-6 archivos en 1-2 agentes | ESTÁNDAR |
| 6+ archivos o 3+ agentes | COMPLEJA |
| Agentes en producción / migración de state / cambio de session backend | CRÍTICA |

**Delta T3 ADK — siempre presentar al usuario** (no solo ESTÁNDAR+, por costes compuestos de errores ADK):

```
Alcance: [1-2 frases]
Complejidad: [nivel] — [N archivos, M agentes]
Prerequisitos: [lista si hay] / Ninguno detectado
Costes LLM estimados: [flash: N llamadas, pro: M llamadas]
¿Confirmas este alcance para crear el documento de tarea?
```

**PUNTO DE ESPERA:** Esperar confirmación antes de proceder (incluso para SIMPLE — regla ADK).

---

### Pasos 0.1–0.7 — Gestión del documento de tarea

**Delta ADK:**

- **Paso 0.4 — Convención de nombres:** `XXX_UPPER_SNAKE_CASE.md` (estilo SDK Google). Ejemplos: `043_IMPLEMENT_COORDINATOR_AGENT.md`, `044_REFACTOR_TOOL_INTEGRATION.md`, `045_ADD_CALLBACK_HANDLERS.md`.
- **Paso 0.5 — Presentación ampliada al usuario:** incluir secciones específicas ADK tras el resumen — `Arquitectura: [SequentialAgent | LlmAgent | LoopAgent | ParallelAgent | etc.]` y `Decisiones Clave: [Opciones principales y justificación]`. Verificación rápida adicional: ¿la exploración de arquitectura (Paso 1-2-3 ADK) reveló alternativas no consideradas? Si sí → comunicar como observación.
- **Paso 0.6 — Notas de revisión ADK:** formato `**[REVISIÓN - YYYY-MM-DD HH:MM]** Retroalimentación del usuario: [Qué cambió] / Enfoque actualizado: [Cómo cambió]`.
- **Paso 0.7 — Registro de Implementación Fase X:** incluir `**Detalles ADK**: Tipo de agente, state keys, herramientas` en cada actualización.

**Paso 0.8 — Revisión Post-Implementación (ADK-específico, extiende el genérico):**

```markdown
## Implementación Completa
**Fecha**: YYYY-MM-DD HH:MM
**Duración**: X horas
**Estado**: Todos los Criterios de Éxito Cumplidos

### Resultados de Validación
- [x] Agente responde correctamente
- [x] Gestión de estado funcionando
- [x] Herramientas integradas
- [x] Manejo de errores validado
```

---

## Acciones Prohibidas y Documento Único

**Delta ADK (añadir a las prohibiciones genéricas):**

- Omitir exploración de arquitectura antes de implementar.
- Empezar a codificar sin validación Fase 1-2-3 (análisis de codebase, alternativas, decisión).
- Crear archivos de resumen/reporte separados del documento de tarea (todo va EN el task doc).

**Parada de emergencia ADK:**
- Usuario no ha aprobado arquitectura → DETENER.
- Validación de dependencias de state keys falla → DETENER.
- Directorios requeridos no existen → DETENER.

---

## Seguimiento del Ciclo de Vida de Tarea

### Creación
- **Creado:** [timestamp]
- **Creado Por:** task_template_adk.md
- **Número de Tarea:** [XXX]
- **Complejidad Inicial:** [Simple | Estándar | Compleja | Crítica]

### Decisiones de Arquitectura
- **Tipo de Agente Seleccionado:** [ReActAgent | CodeExecutionAgent | etc.]
- **Alternativas Consideradas:** [Listar otros tipos de agente evaluados]
- **Análisis de Compromisos:** [Si/No - documentar razonamiento si Si]
- **Selección de Herramientas:** [Cuales herramientas y por que]

### Revisiones
- [Fecha]: [Que cambio y por que]

### Progreso de Implementación

### Estado de Finalización
- **Estado:** [Planificación | En Progreso | Pending Review | Completado | Bloqueado]
- **Última Actualización:** [timestamp]
- **Validado:** [Si | No | N/A]
- **Desplegado:** [Si | No | N/A]

---

## CRÍTICO: Principio de Examinación Primero (Específico ADK)

**MIRAR PRIMERO, NO PREGUNTAR** -- Antes de hacer cualquier pregunta sobre el codebase, examinalo proactivamente.

**Protocolo Obligatorio:**
1. Examinar archivos reales antes de preguntar "Existe X?"
2. Leer código del agente antes de preguntar "Que hace el agente Y?"
3. Verificar state keys antes de preguntar "Que estado esta disponible?"
4. Analizar implementaciones de herramientas antes de preguntar "Como funciona el tool Z?"

**Preguntas Prohibidas** (siempre examinar primero):
- "Existe este agente?" -- En cambio: "Examine `apps/` y encontre: [lista de agentes]"
- "Que state keys se usan?" -- En cambio: "Trace todas las declaraciones output_key: [tabla]"
- "Hay un callback?" -- En cambio: "Busque patrones de callback y encontre: [resultados]"
- "Deberia crear X?" -- En cambio: "Examine el codebase y no encontre X. Recomiendo crearlo porque [razón]."

**Justificación**: La examinación proactiva previene suposiciones, detecta patrones existentes y evita trabajo duplicado.

---

## Instrucciones para el Agente de IA

Ver sección canónica en `task_template.md` §"Instrucciones canónicas para el Agente de IA". Deltas específicos de ADK:

- **Triaje de tipo de agente:** decidir `SequentialAgent` vs `ParallelAgent` vs `LoopAgent` antes de planificar — impacta state flow y error propagation.
- **State keys:** tabla de dependencias de state keys para el módulo modificado (§6); verificar que no se crean keys huérfanas ni agents sin uso en el scope del cambio.
- **FunctionTool vs LLM call:** si una operación es determinista, proponer `FunctionTool` (ahorra costes y latencia) antes de asumir llamada LLM.
- **Docs oficiales ADK:** verificar docs oficiales del SDK Google ADK para patrones actuales antes de diseñar. Verificar versión vigente con `pip show google-adk`.

---

## Tabla de Contenidos

### Flujo Principal
1. [Lista de Verificación de Requisitos](#paso-1-lista-de-verificacion-de-requisitos)
2. [Alternativas de Arquitectura](#paso-2-generar-3-alternativas-de-arquitectura)
3. [Matriz de Compromisos](#paso-3-matriz-de-compromisos)
4. [Decisión de Arquitectura](#paso-4-decision-de-arquitectura)

### Secciones de Referencia
- [Validación 30 Puntos](#3-checklist-de-30-puntos-de-mejores-prácticas-adk)
- [Gestión de Estado de Sesión](#6-gestion-de-estado-de-sesion-critico)
- [Errores Comunes](#7-errores-comunes-y-prevencion)
- [Integración de Herramientas](#13-integración-y-distribucion-de-herramientas)

---

## 1. OBLIGATORIO: Flujo de Trabajo de Tres Fases

**Fase 1: Exploración de Arquitectura** (ANTES del diseño)
- Análisis de requisitos
- Generar 3+ alternativas
- Análisis de compromisos
- Decisión con justificación

**Fase 2: Validación de Solución** (ANTES de implementación)
- Checklist de validación de mejores prácticas (ver `adk-workflow-design` § Validación)
- Análisis de modos de falla
- Revisión de arquitectura

**Fase 3: Implementación**
- Implementación basada en patrones
- Pruebas incrementales
- Validación continua

**NO PUEDE omitir Fase 1 o 2. Implementación solo despues de validación completa.**

---

## Paso 1: Lista de Verificación de Requisitos

### Clasificación de Caso de Uso
- [ ] Tipo de Tarea: Investigación | Análisis | Generación | Automatización | Hibrido
- [ ] Complejidad: Un paso | Multiples pasos
- [ ] Puntos de Decisión: Lógica ramificada? Enrutamiento LLM?
- [ ] Paralelización: Concurrente o secuencial?
- [ ] Calidad: Refinamiento iterativo necesario?

### Flujo de Datos
- [ ] Fuentes de Entrada
- [ ] Requisitos de Salida
- [ ] Datos Intermedios
- [ ] Persistencia de Estado
- [ ] Integraciones Externas

### Deployment Target
> Ver skill `adk-production-setup` para matriz de decisión de session backends y configuración por entorno.

- [ ] Entorno: Local dev | Cloud Run | Agent Engine | GKE
- [ ] Session backend apropiado para el target (InMemory→dev, SQLite→local, Database/Vertex→prod)
- [ ] Plugins de producción configurados (DebugLoggingPlugin→dev, OpenTelemetry→prod)
- [ ] Secrets en variables de entorno (nunca hardcoded)

### Restricciones
- [ ] Rendimiento: Tiempo de respuesta?
- [ ] Costo: Presupuesto de llamadas LLM? Estimación por request y mensual
- [ ] Seguridad: Datos sensibles?
- [ ] Escalabilidad: ¿Cuántos requests/día? ¿Rate limits de la API?
- [ ] Despliegue: Cloud Run | Agent Engine | Local?

### Hints ADK para Análisis de Viabilidad
- [ ] ¿Cuántas llamadas LLM genera un request típico? Estimar costo
- [ ] ¿Algún agente LLM hace trabajo determinista? → Candidato a FunctionTool
- [ ] ¿Hay agentes existentes que se puedan reutilizar/extender?
- [ ] ¿Las state keys están namespaced por agente? ¿Riesgo de context bleeding?
- [ ] ¿Hay agentes que no necesitan historial? → `include_contents='none'`
- [ ] ¿Las sesiones son largas (>5 turnos)? → ¿Hay compactación configurada?
- [ ] ¿Los LoopAgents tienen max_iterations? (sin él = loop infinito)
- [ ] ¿Los transfers tienen ruta de retorno explícita? (child → parent)
- [ ] ¿Las FunctionTools capturan excepciones? (sin try/except = agente muere)
- [ ] ¿Descriptions descriptivas en todos los agentes y docstrings en FunctionTools?
- [ ] ¿Hay evalsets para los agentes afectados? Si no → crearlos es prerequisito
- [ ] ¿El agente tiene `instruction` >5k tokens o cubre múltiples dominios? → Evaluar `SkillToolset` (ver `adk-skills-toolset`)
- [ ] Si el proyecto usa `SkillToolset`: ¿cada `skills/<name>/SKILL.md` cumple spec agentskills.io (kebab-case ≤64, desc ≤1024, cuerpo ≤500 líneas)?

---

## Paso 2: Generar 3+ Alternativas de Arquitectura

**Opciones de componente a combinar en cada alternativa:**
- **LlmAgent** — razonamiento, generación, juicio (cada uno = 1 llamada LLM)
- **FunctionTool** — ejecución determinista (parsing, llamadas API, cálculo)
- **Sub-agents / AgentTool** — delegación a agente especializado con contexto propio
- **SkillToolset** — conocimiento de dominio cargable (progressive disclosure L1/L2/L3) cuando `instruction` >5k tokens o cubre múltiples dominios. Ver `adk-skills-toolset`
- **MCPToolset** — integración con servicios externos

**Alternativa 1: [Nombre]**
- **Patrón**: [Tipo ADK]
- **Estructura**: [Jerarquia breve]
- **Skills de dominio**: [SkillToolset sí/no, qué skills]
- **Pros**: [2-3 puntos]
- **Contras**: [2-3 puntos]
- **Ajuste al Caso**: [Cuando es optima]
- **Costo**: [Estimación de llamadas LLM]

**Alternativa 2**: [Misma estructura]

**Alternativa 3**: [Misma estructura]

---

## Paso 3: Matriz de Compromisos

| Factor | Alt 1 | Alt 2 | Alt 3 | Ganador |
|--------|-------|-------|-------|---------|
| **Complejidad** | B/M/A | B/M/A | B/M/A | [ ] |
| **Flexibilidad** | B/M/A | B/M/A | B/M/A | [ ] |
| **Costo** (llamadas) | [N] | [N] | [N] | [ ] |
| **Latencia** | [Est] | [Est] | [Est] | [ ] |
| **Mantenibilidad** | B/M/A | B/M/A | B/M/A | [ ] |

**Análisis**:
- Rendimiento: [Cual mas rápido, por que]
- Costo: [Cual mas económico, por que]
- Complejidad: [Cual mas simple, por que]

---

## Paso 4: Decisión de Arquitectura

**Seleccionado**: Alternativa [X] - [Nombre]

**Justificación**:
1. **Razón Principal**: [Por que mejor para el caso de uso]
2. **Razón Secundaria**: [Factor de apoyo]
3. **Compromiso Aceptado**: [Que se sacrifica, por que esta bien]

**Alternativas Rechazadas**:
- **Alt Y**: Rechazada porque [razón específica]
- **Alt Z**: Rechazada porque [razón específica]

---

## 2. Contexto del Proyecto y Enfoque de Desarrollo

### OBLIGATORIO: Detectar Etapa del Proyecto

**Antes de planificar la implementación de agentes ADK, determinar la etapa del proyecto:**

**PROYECTO GREENFIELD** (Sistema ADK nuevo):
- Proyecto ADK inicializado recientemente (< 6 meses)
- Sin agentes de producción desplegados aun
- Fase experimental/prototipo
- Sin dependencias de datos de producción

**PROYECTO BROWNFIELD** (Sistema ADK establecido):
- Agentes de producción existentes
- Usuarios de producción activos dependiendo de los agentes
- Arquitectura de agentes existente que debe preservarse
- Los cambios podrian romper workflows de agentes existentes

**CRITERIOS DE DETECCION**:
- Verificar agentes desplegados (Agent Engine, Cloud Run)
- Buscar procesamiento de datos de producción
- Revisar arquitectura de agentes existente
- Preguntar al usuario si hay duda

---

### Enfoque de Desarrollo por Etapa del Proyecto

#### Para Proyectos ADK GREENFIELD

**Principio Guia**: *"Experimentar, iterar, encontrar la arquitectura optima"*

- Cambios mayores de arquitectura aceptables
- Cambios breaking en interfaces de agentes permitidos
- Enfoques experimentales de gestión de estado
- Rediseños completos de agentes permitidos
- Cambios de schema de estado sin migraciones complejas

**Requisitos**:
- Documentar decisiones de arquitectura para el equipo
- Mantener schemas de estado simples inicialmente
- Priorizar encontrar el patrón correcto sobre implementación perfecta

---

#### Para Proyectos ADK BROWNFIELD

**Principio Guia**: *"Preservar comportamiento de agentes existente, extender cuidadosamente"*

- Mapear todas las dependencias de agentes existentes antes de cambios
- Preservar schemas de estado existentes (o proveer migración)
- Mantener compatibilidad hacia atras
- Probar contra escenarios de producción existentes
- Cambios incrementales a la arquitectura de agentes

---

#### Proyectos ADK HIBRIDOS (Etapa Mixta)

Comun: Agregar nuevos agentes a sistema existente.

**Enfoque**:
1. **Para agentes existentes**: Enfoque brownfield (preservar interfaces)
2. **Para agentes nuevos**: Enfoque greenfield (experimental)
3. **En puntos de integración**: Enfoque brownfield (mantener compatibilidad)

---

### Documentación de Contexto del Proyecto

**Documentar esto en cada tarea ADK:**

```markdown
### Contexto del Proyecto

**Etapa del Proyecto**: [Greenfield / Brownfield / Hibrido]

**Evidencia**:
- [Agentes desplegados, uso en producción, arquitectura existente, etc.]

**Enfoque de Desarrollo**: [Iteración experimental / Preservación cuidadosa / Mixto]

**Contexto del Sistema ADK**:
- Agentes existentes: [Cantidad, nombres si se conocen]
- Despliegue en producción: [Si/No, donde]
- Sistemas dependientes: [Lista si los hay]
- Complejidad de estado: [Simple/Complejo]

**Restricciones**:
- Compatibilidad de interfaces de agentes: [Requerida / No requerida]
- Cambios de schema de estado: [Permitidos / Requieren migración / Prohibidos]
- Cambios breaking: [Aceptables / Prohibidos]
```

**REGLA CRÍTICA**: Para proyectos ADK, los cambios de arquitectura son costosos. En caso de duda, validar diseño con prototipo pequeno antes de implementación completa.

---

## 3. Checklist de Mejores Prácticas ADK

> Ver checklist completo de 32 puntos en skill `adk-workflow-design`.
> Categorías: Arquitectura (10), State (8), Tools (6), Integración (6), Evaluación (1), Observabilidad (1).
> Puntuación mínima para aprobar: 29/32.

---

## 4. Análisis de Modos de Falla y Casos Extremos

**OBLIGATORIO para tareas ESTÁNDAR o superior. Para SIMPLE, omitir esta sección.**

> Analizar sistematicamente que puede salir mal ANTES de implementar. En sistemas ADK, los fallos mas comunes vienen de state keys huerfanas, callbacks con firmas incorrectas y costes LLM inesperados.

### Escenarios de Falla

| Componente | Escenario de Falla | Impacto | Probabilidad | Mitigación |
|-----------|-------------------|---------|--------------|------------|
| [Agente/Tool] | [Que sale mal] | A/M/B | A/M/B | [Como manejar] |

### Preguntas Obligatorias de Edge Cases

- [ ] **State keys huerfanas**: Hay claves leidas sin escritor upstream? Se validaron con la tabla de dependencias?
- [ ] **Callbacks con firma incorrecta**: Todos los callbacks usan `CallbackContext` (no `session.state` directo)?
- [ ] **Costes LLM inesperados**: Cuantas llamadas LLM genera un request tipico? Se usa flash donde es posible?
- [ ] **Loops infinitos**: LoopAgents tienen criterio de terminación claro? Hay max_iterations configurado?
- [ ] **Agentes sin uso**: Hay agentes definidos que nunca se referencian en sub_agents o tools?
- [ ] **Herramientas integradas en conflicto**: Algun agente tiene >1 herramienta integrada (google_search + code_execution)?
- [ ] **Estado de sesión persistencia**: El backend de sesión (InMemory/Firestore) es apropiado para el caso de uso?
- [ ] **Inputs vacios/nulos**: Que pasa si el usuario envia input vacio? Los agentes manejan contexto faltante?
- [ ] **Timeouts de herramientas**: FunctionTools y MCP tools tienen timeout? Que pasa si una herramienta no responde?

**Fallas Críticas** (Alto Impacto + Alta Probabilidad):
- [Listar requiriendo mitigación inmediata]

**Riesgos Aceptados** (Bajo Impacto o Baja Probabilidad):
- [Listar eligiendo no manejar, con razón]

---

## 4B. Estrategia de Rollback (OBLIGATORIO para COMPLEJA/CRÍTICA)

Cada tarea COMPLEJA o CRÍTICA DEBE incluir un plan de rollback:

```markdown
## Estrategia de Rollback

### Si el cambio de agente rompe funcionalidad:
1. `git revert <commit_hash>`
2. Verificar que root_agent exporta correctamente
3. Re-desplegar versión anterior

### Si el cambio de state keys rompe flujo:
1. Revertir cambios en output_key y placeholders
2. Validar tabla de dependencias de estado
3. Verificar que no hay claves huerfanas

### Si el despliegue a producción falla:
1. Re-desplegar versión anterior en Agent Engine/Cloud Run
2. Verificar estado de sesiones existentes
3. Documentar causa raiz
```

**Documentar:**
- **Disparadores de rollback:** [Que condiciones activan el rollback]
- **Tiempo estimado de rollback:** [Minutos/horas]
- **Estado de sesión en riesgo:** [Que sesiones/datos podrian perderse]
- **Procedimiento de verificación post-rollback:** [Como confirmar éxito]

---

## 5. Resumen de Revisión de Arquitectura

### Dependencias Entre Agentes
```
Agente A (root)
|- lee: [claves]
|- escribe: [claves]
|- llama: Agente B, C

Agente B
|- lee: [claves de A]
|- escribe: [claves]
|- llama: [herramientas]
```

**Evaluación**:
- Acoplamiento: Bajo | Medio | Alto
- Deps circulares: Ninguna | [Lista]
- Puntos fragiles: [Donde cambios rompen otros]

### Cuellos de Botella de Rendimiento
| Ubicación | Por Que Cuello de Botella | Impacto | Optimización |
|-----------|--------------------------|---------|--------------|
| [Donde] | [Razón] | [Efecto] | [Solución] |

### Estimación de Costos
- **Llamadas LLM Totales**: [N]
  - flash: [N] × ~$0.15/1M input, ~$0.60/1M output = $[Y]
  - pro: [N] × ~$1.25/1M input, ~$10.00/1M output = $[Y]
- **Por Solicitud**: $[total]
- **A Escala**: [reqs/dia] × $[costo] = $[diario]
- **`max_llm_calls`**: [valor configurado por agente]

**Umbrales de escalación:**
- > $0.50/request → optimizar con flash o FunctionTools
- > $2.00/request → requiere justificación explícita
- > $50/día → requiere plan de rate limiting

**Optimizaciones**:
- [ ] Reemplazar LLM con FunctionTools donde sea posible
- [ ] Usar flash en lugar de pro
- [ ] Implementar cache
- [ ] Usar ParallelAgent para velocidad
- [ ] Configurar `max_llm_calls` ajustado (no dejar default 500)

---

## 6. Gestión de Estado de Sesión (CRÍTICO)

### Tabla de Dependencias de Claves de Estado

**Paso 1: Extraer Escritores**

**Información Requerida:**
- Buscar todos los escritores de state keys en archivos Python dentro del directorio `apps/`
- Identificar líneas que contienen declaraciones `output_key=`

**Paso 2: Extraer Lectores**

**Información Requerida:**
- Buscar todos los lectores de state keys en archivos Python dentro del directorio `apps/`
- Buscar patrones de placeholder `{key_name}` en cadenas de instrucción

**Paso 3: Tabla de Dependencias**

| Clave Estado | Escritor | Ubicación Escritor | Lector(es) | Ubicación(es) Lector | Estado |
|--------------|----------|-------------------|-----------|---------------------|--------|
| `context` | root | apps/root/agent.py:45 | planner | apps/planner/agent.py:18 | OK |
| `plan` | planner | apps/planner/agent.py:23 | executor | apps/executor/agent.py:15 | OK |
| `orphan` | (NINGUNO) | N/A | search | apps/search/agent.py:12 | HUERFANO |

**Validación**:
- **Si lecturas huerfanas**: DETENER, arreglar antes de implementación
- **Todo valido**: Proceder

### Token Compaction (v1.25+)

Gestión automática de contexto largo con retención de eventos. Configurar `token_threshold` para activar compaction cuando el contexto excede el límite.

**Cuándo usar:** Conversaciones largas, agentes con mucho historial, pipelines multi-agente con acumulación de estado.

---

## 6b. Estrategia de Testing (OBLIGATORIA para ESTÁNDAR+)

### Evalsets por Agente (MÍNIMO 3 por agente principal)

| Agente | Caso | Tipo | Métricas |
|--------|------|------|----------|
| [nombre] | Happy path (flujo principal) | Conversación 1-2 turnos | `tool_trajectory_avg_score` ≥ 0.8 |
| [nombre] | Tool trajectory (usa tools correctas) | Con `intermediate_data.tool_uses` | `tool_trajectory_avg_score` ≥ 0.8 |
| [nombre] | Edge case (input inesperado) | Input adverso o vacío | `safety_v1` ≥ 0.9 |

### Métricas de Producción (OBLIGATORIAS para deploy)

```json
{
  "criteria": {
    "tool_trajectory_avg_score": 0.8,
    "safety_v1": 0.9,
    "hallucinations_v1": 0.8
  }
}
```

### Plan de Regresión

- [ ] Ejecutar evalsets ANTES del cambio (baseline)
- [ ] Ejecutar evalsets DESPUÉS del cambio (comparar)
- [ ] Score no debe degradar >5% respecto al baseline
- [ ] Métricas de seguridad no deben degradar NADA

> Para estructura detallada de evalsets y métricas → skill `adk-evaluation-testing`
> Para ejemplos de evalsets → `ai_docs/refs/adk-samples/` y `ai_docs/refs/adk-python/tests/integration/fixture/`

---

## 7. Errores Comunes y Prevención

| Patrón de Error | Sintoma | Causa Raiz | Solución |
|-----------------|---------|------------|----------|
| **KeyError en estado** | `{var}` falla | Sin escritor upstream | Agregar `output_key="var"` al escritor |
| **Tools no llamadas** | Agente ignora tools | Tiene `output_schema` | Quitar schema O usar JSON basado en instrucción |
| **Valor estado vacio** | 0 chars en clave | Sin comando output explicito | Agregar "Escribe/Genera" en instrucción |
| **Callback falla** | Corrupción de estado | Firma incorrecta | Usar parámetro `CallbackContext` |
| **Errores de import** | Tools MCP fallan | Import incorrecto | Usar `McpToolset` (p minuscula) |
| **CredentialManager firma** | Auth falla silenciosamente | v1.24 cambió parámetro de `callback_context` a `tool_context` | Actualizar firma: `CredentialManager(tool_context=...)` |

---

## 8. Marco de Decisión de Arquitectura de Agentes

| Necesidad | Agente Único | Secuencial | Paralelo | Loop | Router LlmAgent |
|-----------|--------------|------------|----------|------|-----------------|
| **Pipeline fijo** | -- | SI | -- | -- | -- |
| **Enrutamiento LLM** | -- | -- | -- | -- | SI |
| **Concurrente** | -- | -- | SI | -- | -- |
| **Loops de calidad** | -- | -- | -- | SI | -- |
| **Tarea simple** | SI | -- | -- | -- | -- |

---

## 9. Reglas de Arquitectura de Agentes ADK

### Restricciones de Herramientas Integradas
- **Maximo 1 herramienta integrada por agente**
- No puede combinar: `google_search` + `built_in_code_execution`
- Puede combinar: 1 integrada + FunctionTools ilimitadas

### Requisitos de Exportación de Agentes
```python
# apps/agent_name/agent.py
root_agent = my_agent  # DEBE llamarse root_agent

# apps/agent_name/__init__.py
from . import agent  # Expone root_agent
```

### Estructura de Directorio
```
apps/
|- coordinator/
|   |- __init__.py
|   |- agent.py       # root_agent = Agent(...)
|   |- prompt.py
|   |- callbacks.py
|   |- tools.py
|- specialist_1/
|- specialist_2/
```

---

## 10. Código Determinístico vs LLM

> Para reglas FunctionTool vs LLM con ejemplos, ver skill `adk-bottleneck-analysis` §Patrón 3.

**Regla rápida**: Si la operación tiene resultado predecible (parseo, cálculo, validación) → FunctionTool. Si requiere juicio o generación → LLM.

---

## 11. FunctionTool y ToolContext

> Para guía completa de FunctionTool (auto-wrapping, error handling, ToolContext, herramientas especializadas), ver subagent `adk`.

**Herramientas nuevas del SDK (v1.22-v1.27):**
- `BashTool` (v1.27): ejecución de comandos bash como herramienta
- `Cloud Pub/Sub tool` (v1.22): mensajería pub/sub
- `BigQuery tools` (v1.23): integración directa con BigQuery

### SkillToolset / Skills Spec (v1.26+)

Nuevo paradigma para definir y distribuir capacidades reutilizables entre agentes:
- Validación automática de skills
- Auto-injection en agentes configurados
- GCS filesystem para almacenamiento de skills (v1.27)

---

## 12. Integración MCP

> Para patrón McpToolset con imports correctos y acceso granular, ver subagent `adk`.

**Recordatorio clave**: `McpToolset` de `google.adk.tools` (lazy export) o `google.adk.tools.mcp_tool.mcp_toolset` (directo). `StdioServerParameters` de `mcp`. NO existe `google.adk.toolsets`.

---

## 13. Integración y Distribución de Herramientas

### Tabla de Estrategia

| Agente | Responsabilidad | Herramientas | Justificación |
|--------|-----------------|--------------|---------------|
| [Nombre] | [Tarea] | [Tools] | [Por que solo estas] |

**Distribución de Integradas**:
- [Agente]: `google_search` - [Por que]
- [Agente]: `built_in_code_execution` - [Por que]

**Distribución de Function Tools**:
- [Agente]: [func1, func2] - [Por que]

**Seguridad**:
- [ ] Sin herramientas de escritura a menos que necesario
- [ ] Agentes solo lectura separados
- [ ] Herramientas MCP filtradas por agente

---

## 14. Limpieza de Código y Detección de Componentes Sin Uso (OBLIGATORIO)

### Antes de Completar, Verificar SIN Componentes Sin Uso

**1. State Keys Sin Uso**:
- Buscar todos los escritores de state keys (declaraciones output_key)
- Buscar todos los lectores de state keys (patrones de placeholder {key_name})
- Referencia cruzada: claves escritas pero nunca leidas -- marcar para ELIMINACION

**2. Funciones/Herramientas Sin Uso**:
- Listar todas las function tools definidas vs todas las tools en `tools=[]` de agentes
- Funciones definidas pero nunca usadas -- ELIMINAR

**3. Callbacks Sin Uso**:
- Listar todas las funciones callback definidas vs todos los callbacks registrados
- Definidos pero nunca registrados -- ELIMINAR

**4. Agentes Sin Uso**:
- Listar todos los agentes definidos vs todos los agentes en sub_agents/tools
- Definidos pero nunca referenciados -- ELIMINAR

---

## 15. Plan de Implementación

### Fase 1: Configuración del Agente Principal
- [ ] Crear root agent (callbacks, herramientas, configuración)
- [ ] Probar funcionalidad básica

### Fase 2: Integración de Sub-Agentes
- [ ] Construir sub-agentes
- [ ] Probar integración

### Fase 3: Gestión de Estado
- [ ] Implementar inicialización de estado
- [ ] Agregar transformaciones de estado
- [ ] Validar flujo de estado

### Fase 4: Integración de Herramientas
- [ ] Agregar FunctionTools
- [ ] Configurar MCP (si necesario)
- [ ] Probar uso de herramientas

### Fase 5: Validación y Pruebas
- [ ] Prueba de flujo end-to-end
- [ ] Validación de flujo de estado
- [ ] Verificación de manejo de errores
- [ ] Pruebas de rendimiento

### Fase 6: Evaluación y Testing
> Ver skill `adk-evaluation-testing` para guía completa de evalsets, métricas y regression testing.

- [ ] Crear evalset básico (`tests/evalsets/{agent_name}_eval.json`)
- [ ] Definir tool trajectory esperada para caso de uso principal
- [ ] Ejecutar `adk eval` y verificar scores
- [ ] Documentar criterios de regresión (score mínimo aceptable)

---

## 16. Ciclo de Vida del Estado en Callbacks

```
before_agent_callback → Agente (escribe output_key) → after_agent_callback
       ↓                          ↓                           ↓
  Estado previos OK         output_key escribiéndose     Estado completo
  output_key actual: NO     (via instrucción)            output_key actual: SÍ
```

**CRÍTICO**: `before_agent` NO puede leer `output_key` del agente actual. `after_agent` puede leer todo. Siempre usar `ctx.state`, nunca `session.state`.

> Para ejemplos detallados de callbacks (before/after_agent, before/after_model, before/after_tool), ver subagent `adk`.

---

## 17. Anti-Patrones del Mundo Real

| Anti-Patrón | Señal | Prevención |
|-------------|-------|------------|
| Especificidad de ejemplo | Solución funciona SOLO para el ejemplo dado | Probar con inputs de industrias distintas |
| Sobre-ingeniería vs prompts | Código complejo cuando mejor prompt bastaría | Intentar inyección de contexto primero |
| Desalineación de state keys | Doc dice `research_context`, código dice `business_context` | Verificar nombres coinciden entre agentes |
| Estado inválido en callbacks | `session.state["key"]` no persiste | Usar `ctx.state["key"]` siempre |

---

## 18. Que Constituye "Aprobación Explicita del Usuario"

**APROBADO - Proceder**:
- "se ve bien", "ejecuta", "procede", "adelante"
- "aprobado", "si, hazlo", "inicia implementación", "comienza"

**NO APROBADO - Esperar**:
- "interesante", "ya veo", "gracias" (reconociendo, no aprobando)
- Preguntas sobre el plan, solicitudes de cambios, "dejame pensar", silencio

**AMBIGUO - Pedir Clarificación**:
- "ok", "claro", "vale" (podria significar comprensión o aprobación)

**Cuando Ambiguo**: Preguntar "Solo para confirmar - te gustaria que proceda con la implementación, o prefieres revisar/modificar el plan primero?"

**Regla Crítica**: Si no estas seguro si el usuario aprobo, PREGUNTA. Nunca asumir aprobación.

---

<!-- §19 eliminado — cubierto completamente por §3 Checklist de 30 Puntos -->

---

## PUERTA PRE-IMPLEMENTACIÓN (OBLIGATORIO)

**Delta ADK (añadir checkboxes):**
- `[ ] Validación 30 puntos ADK completada (puntuación ≥27)` — checklist arquitectónico de §3.
- `[ ] Dependencias de state keys trazadas (sin keys huérfanas)` — verificación específica ADK §6.
- `[ ] Costes LLM estimados (flash: N llamadas, pro: M llamadas)` — restricción de presupuesto.

---

## 20. Resumen Ejecutivo

**Tarea**: [Descripción breve]
**Arquitectura**: [Patrón seleccionado]
**Complejidad**: [Baja/Media/Alta]
**Esfuerzo Estimado**: [Horas/Dias]
**Nivel de Riesgo**: [Bajo/Medio/Alto]

### PROBLEMAS CRÍTICOS: [cantidad]
- [Problema 1]
- [Problema 2]

### COMPONENTES SIN USO: [cantidad]
- [Componente 1]

### VEREDICTO FINAL
LISTO PARA IMPLEMENTAR | NECESITA REVISIÓN | BLOQUEADO

**Razón**: [Explicación breve]

---

## 21. Criterios de Éxito

- [ ] Todos los agentes responden correctamente a entradas de prueba
- [ ] Gestión de estado funcionando segun diseño
- [ ] Todas las herramientas integradas y funcionales
- [ ] Manejo de errores valida apropiadamente
- [ ] Rendimiento cumple requisitos
- [ ] Costo dentro del presupuesto
- [ ] Documentación completa
- [ ] Desplegado exitosamente

### Criterios de Calidad de Ingeniería (canónicos)

> **Obligatorio si la task toca código ejecutable** (.py/archivos bajo `agents/`, `tools/`, `callbacks/`, `config/`, `evals/`). Para tasks puramente documentales/config sin runtime, declarar excepción literal `Excepción a Criterios de Calidad de Ingeniería: task no toca código ejecutable (solo <docs/config>).` dentro del cuerpo de la sección "Riesgos aceptados", "Decisiones aceptadas" o "Riesgos y mitigaciones".

- [ ] **Cleanup exhaustivo de comentarios:** archivos modificados sin comentarios narrativos del "qué hace el código", sin TODO/FIXME residual sin issue trackeado, sin código comentado. Verificable: `grep -nE "(TODO|FIXME|XXX)" <archivos>` retorna ≤ baseline previo + `ruff check` sin reportar `FIX001`/`TD002`. Comentarios permitidos solo cuando explican el WHY no obvio (decisión arquitectónica ADK, constraint del SDK, workaround citado).

- [ ] **Sin dead/legacy code:** sin tools/callbacks/agents declarados y nunca registrados en el orquestador, sin variables `state_keys` huérfanas, sin imports muertos, sin código inalcanzable. Verificable: `vulture agents/ tools/`, `pyflakes` o `ruff check --select F401,F841` sin nuevos hallazgos; `grep -r "<symbol>"` confirma registro en `root_agent` o `tools=[...]` (excepto APIs públicas declaradas).

- [ ] **DRY/KISS/early returns aplicados:** sin bloques de 3+ líneas duplicados entre tools/callbacks/agents (extraer a `tools/_shared.py` o citar duplicación existente), sin abstracciones para 1 callsite, sin nesting innecesario donde un early return guard simplifica (validación de `tool_input` temprana). Verificable: revisión humana o `reviewer` agent §9, con verdict explícito por archivo modificado.

- [ ] **TDD reutilizando infra existente:** todo agent/tool/callback nuevo/modificado tiene test(s) escritos junto al código (no después), reutilizando `pytest` fixtures existentes en `tests/conftest.py`, evaluators en `evals/` y `AgentEvaluator` del SDK ADK. Verificable: archivo de test correspondiente existe + kill-the-mutant pasa (comentar línea clave del tool → al menos 1 test/eval relevante falla). Activar la skill `adk-evaluation-testing` para evaluators de regresión sobre comportamiento del agent.

**Defense-in-depth automático:** este bloque es validado por hook `task-doc-validator.js` + plan-checker D10 + reviewer §9 + task-implementation-review §10. El `task-planner` Paso 7.4 (o `adk` agent) lo inyecta automáticamente.

---

## Bloque `contract:` (opcional)

> Ver `task_template.md` §"20. Bloque `contract:` opcional" para schema completo. Aplicable a tareas ESTÁNDAR+ con `depends_on:` declarado o handoffs explícitos. Sin delta ADK (los `state_keys` de upstream se documentan como prerequisitos en T1, no en `contract:`).

---

## Agent Recomendado

Después de crear el documento de tarea, usar el siguiente agent para implementación:

| Stack | Agent | Complementos |
|-------|-------|-------------|
| Google ADK | `adk` (orquestación + referencia) | Skills ADK según necesidad |

---

**Versión de Plantilla**: 3.0
**Compatibilidad ADK**: para docs oficiales del SDK Google ADK, ejecutar `pip show google-adk`.
**Última Actualización**: 2026-03-15
