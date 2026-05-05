# Plantilla de Tarea para Sistema de Agentes ADK

> **Instrucciones:** Crea documentos de tareas comprensivos para sistemas Google Agent Development Kit (ADK). Asegura diseño apropiado de flujo multi-agente, integración de herramientas y despliegue.
>
> **Prerrequisito:** subagent `adk` debe estar cargado como referencia de patrones ADK.
>
> **Cabecera de Metadatos opcional (T079):** los task docs ADK pueden incluir cabecera blockquote con `> **Depende de:**`, `> **Asunciones:**` y sub-sección "Wiring esperado" para el flujo `task-planner` Paso 0.6 (waves). Ver documentación completa en [`task_template.md`](task_template.md) §"Cabecera de Metadatos del Task Doc (opcional)" — esta plantilla hereda esa especificación. Para ADK, las "Asunciones" típicas incluyen: SDK ADK ≥1.27.1, modelo Gemini disponible, evalsets configurados.

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
- Si NO existen: ejecutar `calibrate_templates` primero o clonar manualmente

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

<!-- AI Agent: Para tareas SIMPLE (<=2 archivos), el triaje es mental. Para ESTÁNDAR+, es conversación explícita con el usuario. RECORDAR: En ADK, la complejidad MÍNIMA es MEDIA — siempre hacer triaje explícito. -->

**T1: Analizar** — Examinar el codebase para responder:

- **Radio de impacto:** ¿Cuántos agentes, state keys, tools, callbacks se ven afectados?
  - <=2 archivos en 1 agente → SIMPLE (raro en ADK)
  - 3-6 archivos en 1-2 agentes → ESTÁNDAR
  - 6+ archivos o 3+ agentes → COMPLEJA
  - Agentes en producción, migración de state, cambio de session backend → CRÍTICA
- **Prerequisitos:** ¿SDK version correcta? ¿Session backend configurado? ¿State keys de upstream existen? Trazar dependencias de estado (max 2 niveles). ✅ existe | ❌ falta.
- **Integración:** ¿Hay patrones de agentes/tools establecidos? ¿State keys existentes que reutilizar?
- **Stack-specific:** ¿Nuevo agente o extender existente? ¿LLM o FunctionTool? ¿Callback o instrucción? Verificar antes de planificar.

**T2: Cuestionar (solo si hay razón):**

- Alcance cubre 2+ funcionalidades independientes → proponer desglose
- FunctionTool puede resolver lo que se pide con LLM → proponerlo (ahorra costes)
- Prerequisitos bloqueantes (state keys faltantes, session backend) → proponer resolverlos primero
- Sobre-diseño detectado (jerarquía de agentes innecesaria) → proponer simplificación (KISS)

**T3: Alinear** — Presentar al usuario (SIEMPRE en ADK, no solo ESTÁNDAR+):

```
Alcance: [1-2 frases]
Complejidad: [nivel] — [N archivos, M agentes]
Prerequisitos: [lista si hay] / Ninguno detectado
Costes LLM estimados: [flash: N llamadas, pro: M llamadas]
¿Confirmas este alcance para crear el documento de tarea?
```

**PUNTO DE ESPERA:** Esperar confirmación antes de proceder.

---

### Paso 0.1: Verificar Estructura del Proyecto

**Información Requerida:**
- Verificar que el directorio `ai_docs/` existe
- Verificar que el subdirectorio `ai_docs/tasks/` existe

**DETENER si** `ai_docs/` o `ai_docs/tasks/` no existen -- preguntar si crear.

### Paso 0.2: Verificar Documento de Tarea Activa

**Antes de crear una nueva tarea, verificar si ya existe una para este trabajo:**

1. Listar archivos en `ai_docs/tasks/` y buscar un documento relacionado con la solicitud actual
2. Si el usuario pide correcciones/revisiones -- buscar y ACTUALIZAR ese documento
3. Si el usuario pide continuar implementación -- buscar y ACTUALIZAR ese documento
4. Si el usuario pide una revisión -- buscar y ACTUALIZAR ese documento
5. **Solo crear un nuevo número de tarea si es trabajo GENUINAMENTE NUEVO**

**Si se encuentra tarea activa:** Saltar al Paso 0.5 (Manejar Actualizaciones) y trabajar sobre el documento existente.

### Paso 0.3: Detectar Siguiente Número de Tarea

**Solo si el Paso 0.2 confirmo que no aplica ninguna tarea existente:**

1. Listar archivos en `ai_docs/tasks/`
2. Extraer el prefijo de 3 dígitos de CADA nombre de archivo
3. Encontrar el número mas alto entre TODOS los archivos
4. Sumar 1 y formatear con 3 dígitos
5. Si no hay archivos: usar 001

**Reglas:**
- Secuencia global compartida (no reiniciar por tipo)
- Siempre 3 dígitos: 001, 042, 156
- Cada número se usa EXACTAMENTE UNA VEZ -- un número, un archivo
- ❌ El número `000` está RESERVADO para calibración del proyecto — nunca usar para tareas normales

### Paso 0.4: Crear Documento de Tarea

**CRÍTICO: UNA tarea = UN archivo. UN número = UN archivo. Sin excepciones.**

**Nomenclatura**: `XXX_UPPER_SNAKE_CASE.md`
**Verificar:** NO existe ningun archivo con ese prefijo numerico

**Ejemplos**:
```
043_IMPLEMENT_COORDINATOR_AGENT.md
044_REFACTOR_TOOL_INTEGRATION.md
045_ADD_CALLBACK_HANDLERS.md
```

### Paso 0.5: Presentar al Usuario

**NOTA:** El análisis crítico de impacto, prerequisitos y alcance ya se realizó en el Triaje de Ingeniería (Paso 0.0.6). Aquí se presenta el documento ya validado.

**Verificación rápida antes de presentar:**
- ¿El documento refleja el alcance validado en T3? Si no → actualizar.
- ¿La exploración de arquitectura reveló algo nuevo? Si sí → comunicar como observación.

Despues de completar el triaje Y la exploración de arquitectura:

```
Tarea Creada: ai_docs/tasks/XXX_UPPER_SNAKE_CASE.md

Resumen: [2-3 oraciones]
Arquitectura: [SequentialAgent | LlmAgent | etc.]
Decisiones Clave: [Opciones principales y justificación]

[Solo si se descubrió algo nuevo:]
Observaciones y Sugerencias del Asistente:
Tras analizar la tarea y el codebase, he identificado lo siguiente:

1. **[Categoría]:** [Observación o sugerencia concreta]
2. **[Categoría]:** [Observación o sugerencia concreta]
3. **[Categoría]:** [Observación o sugerencia concreta — si aplica]

> Categorías válidas: Dependencia detectada | Prerequisito | Alternativa de enfoque | Optimización | Riesgo identificado | Ajuste de alcance | Refactorización recomendada

Opciones:
A) Vista Previa de Cambios de Código Detallados
B) Aprobar e Iniciar Implementación
C) Modificar o Iterar sobre el Plan
   Ajustar el enfoque, explorar las sugerencias, o refinar el plan antes de comprometerse.
```

**ESPERAR elección explicita del usuario** - NO asumir aprobación

**NOTA SOBRE ITERACIÓN:** La iteración es el proceso normal. Las tareas raramente están perfectas en la primera versión. Si el usuario elige C, actualizar el documento existente, incorporar el feedback, y re-presentar con nuevas sugerencias basadas en la conversación.

### Paso 0.6: Manejar Actualizaciones

**Si el usuario solicita cambios**:
- Editar archivo original (usar herramienta Edit)
- NO crear nuevas versiones (_v2, _updated, etc.)
- Agregar notas de revisión con timestamps

```markdown
**[REVISIÓN - 2025-01-23 15:30]**
Retroalimentación del usuario: [Que cambio]
Enfoque actualizado: [Como cambio]
```

### Paso 0.7: Rastrear Progreso de Implementación

**Durante implementación, actualizar documento de tarea**:
```markdown
## Registro de Implementación Fase X
**Estado**: Completado | En Progreso | Bloqueado
**Completado**: 2025-01-23 16:45
**Archivos Modificados**: [lista con conteos de líneas]
**Detalles ADK**: Tipo de agente, state keys, herramientas
**Desviaciones**: [Cambios del plan]
**Problemas**: [Problemas específicos de ADK]
```

#### Regla de Alcance Estricto (ACTIVA durante toda la implementación)

> OBLIGATORIO: Solo modificar código directamente relacionado con la sección "Incluye".

- Si se descubre un problema FUERA del alcance:
  1. **NO arreglarlo** — documentarlo como nota en "Descubrimientos fuera de alcance" del task document
  2. Si es BLOQUEANTE para la tarea actual: PAUSAR, informar al usuario, esperar decisión
  3. Si NO es bloqueante: ignorarlo completamente
- **Test rápido:** ¿Este cambio está en "Incluye"? → SI: proceder. NO: no tocarlo.
- **Excepción única:** errores de sintaxis/compilación en líneas que YA se están modificando
- **Prohibido:** arreglar warnings, code smells, o deuda técnica encontrada "de paso"

### Paso 0.8: Revisión Post-Implementación

```markdown
## Implementación Completa
**Fecha**: 2025-01-23 20:30
**Duración**: 8.5 horas
**Estado**: Todos los Criterios de Éxito Cumplidos

### Resultados de Validación
- [x] Agente responde correctamente
- [x] Gestión de estado funcionando
- [x] Herramientas integradas
- [x] Manejo de errores validado
```

---

## ACCIONES PROHIBIDAS

### NO HACER:
- Crear documentos de tarea sin aprobación del usuario
- Implementar antes de crear documento de tarea
- Omitir exploración de arquitectura
- Empezar a codificar sin validación Fase 1-2-3
- Crear nuevas versiones (_v2, _updated)
- Crear multiples archivos con el mismo número de tarea
- Crear archivos de resumen/reporte separados del documento de tarea
- Asumir aprobación del usuario

### REGLA DE DOCUMENTO ÚNICO (ABSOLUTA):
- UN número de tarea = UN archivo. Punto.
- Correcciones -- actualizar el documento de tarea existente
- Progreso de implementación -- marcar checkboxes en el documento existente
- Revisiones -- agregar notas de revisión al documento existente
- Sub-reportes, archivos de verificación -- agregar como secciones EN el documento existente

### PARADA DE EMERGENCIA si:
- Usuario no ha aprobado arquitectura
- Validación de dependencias de estado falla
- Directorios requeridos no existen
- A punto de crear un segundo archivo con un número existente -- editar el archivo existente

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

**Rol: Ingeniero de Software Senior especializado en ADK, no documentador.**

El asistente NO acepta la petición del usuario sin análisis. ANTES de crear cualquier documento de tarea, ejecutar el Triaje de Ingeniería (Paso 0.0.6): analizar impacto en agentes y estado, trazar prerequisitos, evaluar alcance.

### Disciplina de Alcance (OBLIGATORIO)

> Complementa la "Regla de Alcance Estricto" del Paso 0.6 con principios de decisión.

- **Decisiones intencionales:** Asumir que código existente fuera del alcance refleja decisiones de negocio válidas. No sugerir cambios a código funcional que no está en el scope.
- **Auto-remediación prohibida:** Nunca corregir problemas descubiertos durante review sin confirmación explícita del usuario. Reportar → esperar → actuar.

### Señales de Alerta (DETENER y comunicar al usuario)

- Petición que cubre 2+ funcionalidades independientes → proponer desglose en tareas separadas
- Prerequisitos bloqueantes (state keys faltantes, SDK incompatible) → proponer resolverlos primero
- FunctionTool puede reemplazar llamada LLM → proponerlo (ahorra costes)
- Radio de impacto sugiere complejidad diferente a la intuida → advertir y re-clasificar
- Jerarquía de agentes innecesaria → proponer simplificación (KISS)

### Flujo de Trabajo

1. **Triaje** — Analizar impacto, prerequisitos, alcance (Paso 0.0.6 — T1/T2/T3)
2. **Alinear** — Presentar alcance al usuario, esperar confirmación
3. **Pre-flight** — Verificar entorno ADK (Python, SDK, estructura de agentes)
4. **Documentar** — Crear documento de tarea con alcance validado
5. **Presentar** — Opciones A/B/C
6. **Implementar** — Solo tras aprobación explícita (opción B)

### Opciones de Implementación (presentar siempre)

**A)** Vista Previa de Cambios de Código — fragmentos antes/después
**B)** Proceder con Implementación — fase por fase
**C)** Modificar o Iterar sobre el Plan — ajustar antes de comprometerse

Esperar elección explícita. NUNCA asumir aprobación.

### Durante Implementación

Por cada fase completada:
- Actualizar checkbox: `[x]` + timestamp + archivos modificados + resultado de verificación (lint/tipos/state validation)
- Si se descubre que el alcance era incorrecto → DETENER, comunicar, re-planificar
- Esperar "proceder" antes de siguiente fase

Tras todas las fases: cambiar estado a `Pending Review` → ejecutar checklist de revisión → si APROBADO cambiar a `Completado`.

### Checklist de Revisión (SE Principles)

1. **Requisitos**: Todos los criterios de éxito verificables cumplidos
2. **Linting**: `ruff check .` + `mypy .` sin errores
3. **Code smells**: En módulos modificados, verificar anti-patrones ADK (ver §17). En el scope del cambio, verificar que no se crean agents sin uso ni state keys huérfanas. NO auditar todo el proyecto.
4. **DRY**: En archivos modificados, verificar que no se duplica lógica entre agents — instrucciones compartidas → reportar propuesta `global_instruction`, tools duplicadas → reportar propuesta de refactorización. NO refactorizar automáticamente.
5. **KISS**: ¿Mínimos agents necesarios? ¿Se puede resolver con 1 agent en vez de 3? Sin sobre-ingeniería de jerarquías
6. **SoC**: Cada agent tiene responsabilidad única. Root coordina, sub-agents procesan. Tools deterministas separadas de LLM
7. **Seguridad**: Sin secretos hardcodeados, API keys en variables de entorno, tools con mínimo privilegio
8. **Integración**: Tabla de dependencias de state keys para el agente/módulo modificado (§6). Verificar que no se crean keys huérfanas en el scope del cambio. Verificar imports MCP correctos.
9. **Regresión**: Probar flujo end-to-end del agente/módulo modificado. Verificar que agents directamente conectados no cambiaron comportamiento.
10. **Arquitectura**: Checklist de 30 puntos (§3) con puntuación ≥27
11. **Baseline de deuda técnica** (ESTÁNDAR+): Documentar agents/tools/state keys sin uso existentes. Verificar que la tarea no añade deuda nueva

### Aprobación Explícita

**APROBADO**: "ejecuta", "adelante", "aprobado", "proceder", "se ve bien"
**NO APROBADO**: "interesante", "ya veo", preguntas sobre el plan, silencio
**AMBIGUO**: "ok", "vale", "claro" → confirmar antes de proceder

---

## CRÍTICO: Referencia de Documentación ADK

**Docs Oficiales**: https://google.github.io/adk-docs/

**Leer ANTES de diseñar**: Siempre verificar docs oficiales para patrones y mejores prácticas actuales.

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

Antes de iniciar cualquier implementación, TODOS los checkboxes deben estar marcados:

- [ ] Triaje de Ingeniería completado — alcance validado con usuario
- [ ] Prerequisitos verificados — todos existen o tienen tarea separada
- [ ] Complejidad clasificada (SIMPLE / ESTÁNDAR / COMPLEJA / CRÍTICA)
- [ ] Pre-flight completado sin errores
- [ ] Archivos afectados identificados
- [ ] Alternativas evaluadas (ESTÁNDAR+)
- [ ] Casos extremos analizados (ESTÁNDAR+)
- [ ] Rollback documentado (COMPLEJA/CRÍTICA)
- [ ] Criterios de éxito medibles definidos
- [ ] Documento presentado y aprobado por usuario

→ Si CUALQUIER checkbox sin marcar: DETENER. No implementar.

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

---

## Agent Recomendado

Después de crear el documento de tarea, usar el siguiente agent para implementación:

| Stack | Agent | Complementos |
|-------|-------|-------------|
| Google ADK | `adk` (orquestación + referencia) | Skills ADK según necesidad |

---

**Versión de Plantilla**: 3.0
**Compatibilidad ADK**: v1.22+ (verificado contra SDK v1.27.1, 2026-03-15)
**Última Actualización**: 2026-03-15
