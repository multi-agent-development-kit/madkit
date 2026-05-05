# Plantilla de Tarea AI (Protocolo Genérico)

> Protocolo genérico de creación de documentos de tarea para desarrollo impulsado por IA. Las plantillas especializadas por stack (TypeScript, Python, Django, PHP, ADK, WordPress) extienden este protocolo con análisis y validación específicos.

---

## CRÍTICO: Protocolo de Creación de Documentos de Tarea

**Esta plantilla crea un DOCUMENTO DE PLANIFICACIÓN únicamente. NO implementar cambios directamente.**

---

## CLASIFICACIÓN DE COMPLEJIDAD DE TAREA - LEE ESTO PRIMERO

<!-- AI Agent: Determina la complejidad ANTES de crear el documento de tarea. La mayoría de tareas son SIMPLE. -->

### TAREA SIMPLE (Usa secciones 1,4,14,16 solamente - ~150 líneas)

**Criterios — TODOS deben ser verdaderos:**
- Cambios afectan <=2 archivos
- Sin nuevas funciones/clases/módulos
- Sin cambios de schema de base de datos
- Sin nuevas dependencias
- Requisitos claros e inequívocos

**Ejemplos:**
- Corregir typo o valor de configuración
- Agregar logging o cambiar valor por defecto
- Actualizar nombre de variable de entorno
- Corregir validación en funcion existente

### TAREA ESTÁNDAR (Usa secciones 1,2,4,6,8,14,16 - ~400 líneas)

**Criterios — CUALQUIERA activa ESTÁNDAR:**
- Cambios afectan 3-6 archivos
- Agregar nuevas funciones/clases
- Cambios de schema de base de datos
- Nuevas dependencias requeridas
- Algunas decisiones de arquitectura

**Ejemplos:**
- Nuevo endpoint con lógica de negocio
- Integración de servicio externo
- Nueva tabla o cambio de schema
- Implementar capa de cache

### TAREA COMPLEJA (Usa todas las secciones - ~600+ líneas)

**Criterios — CUALQUIERA activa COMPLEJA:**
- Cambios afectan 7+ archivos
- Creación de nuevo servicio/modulo
- Cambios breaking en APIs
- Multiples nuevas dependencias
- Cambios mayores de arquitectura

**Ejemplos:**
- Pipeline de datos multi-etapa
- Sistema de autenticación completo
- Migracion de base de datos con transformacion

### TAREA CRÍTICA (Usa todas las secciones + plan de rollback obligatorio - ~800+ líneas)

**Criterios — CUALQUIERA activa CRÍTICA:**
- Cambios en schema de tablas grandes (>100K filas)
- Migraciones de datos en producción
- Cambios en sistema de autenticación
- Cambios de motor de base de datos
- Cambios que afectan disponibilidad del servicio

**Ejemplos:**
- Alterar tipo de campo en tabla masiva
- Cambiar backend de autenticación
- Migrar entre motores de base de datos

---

## 0. Validación Pre-Vuelo (OBLIGATORIA)

DETENER. NO proceder si CUALQUIER validación falla. Resolver TODOS los fallos antes de continuar.

---

### Lista de Verificación Pre-Vuelo (Pasos 0.0.1-0.0.5)

Completar cada verificación. Si alguna falla, resolver antes de continuar.

**0.0.1 - Acceso al Sistema de Archivos:**
- [ ] El directorio de trabajo actual es accesible con permisos de lectura/escritura
- [ ] Se puede listar el contenido del directorio raíz del proyecto
- [ ] Permisos de escritura confirmados para `ai_docs/tasks/` (si existe)

**0.0.2 - Disponibilidad de Herramientas:**
- [ ] Verificar que las herramientas específicas del stack están instaladas y accesibles
- [ ] Herramientas de linting y análisis estático disponibles para el lenguaje del proyecto

**0.0.3 - Configuración del Entorno:**
- [ ] Dependencias instaladas (existe el directorio de paquetes/módulos específico del proyecto)
- [ ] Variables de entorno configuradas (`.env` o equivalente existe)
- [ ] Archivos de configuración del proyecto presentes (específicos del lenguaje/framework)
- [ ] Auditoría de dependencias: sin vulnerabilidades conocidas (`npm audit` / `pip-audit` / `composer audit` según stack)

**0.0.4 - Detección del Estado del Proyecto:**

Realiza estas preguntas para determinar la fase del proyecto:
1. ¿Este sistema procesa datos de producción de usuarios reales? [Sí/No]
2. ¿Hay usuarios activos que dependen de este sistema? [Sí/No]
3. ¿Existe código que debe preservarse? [Sí/No]

| Respuestas | Fase | Enfoque |
|------------|------|---------|
| Todas "No" | Greenfield | Mejores prácticas modernas, empezar desde cero |
| Cualquier "Sí" | Brownfield | Incremental, compatible hacia atrás |
| Mixto | Híbrido | Equilibrar prácticas modernas con preservación |

CRÍTICO: NO asumir la fase del proyecto. Preguntar al usuario explícitamente si no está claro.

**0.0.5 - Nomenclatura de Archivos de Tarea y Redirección de Plantilla:**

Detectar el stack del proyecto y redirigir a la plantilla especializada apropiada:

| Indicador de Stack | Plantilla | Convención de Nomenclatura |
|-------------------|----------|---------------------------|
| `manage.py` + Django en deps | `task_template_django` | `XXX_snake_case_name.md` |
| `agent.py` + `google-adk` en deps | `task_template_adk` | `XXX_UPPER_SNAKE_CASE.md` |
| `pyproject.toml` o `requirements.txt` | `task_template_python` | `XXX_snake_case_name.md` |
| `package.json` + `tsconfig.json` + `.tsx` | `task_template_typescript` | `XXX_camelCaseName.md` |
| `wp-content/` o `functions.php` | `task_template_wordpress` | `XXX_camelCaseName.md` |
| `composer.json` o archivos `.php` | `task_template_php` | `XXX_camelCaseName.md` |
| `package.json` + `.js` (sin tsconfig) | `task_template` (este archivo) | `XXX_camelCaseName.md` |

Si una plantilla especializada coincide, usar esa plantilla en lugar de esta genérica.
Esta plantilla sirve como respaldo para stacks sin coincidencia y como base del protocolo compartido referenciado por las plantillas PHP y WordPress.

---

### Pre-Vuelo Completo

Todas las verificaciones deben pasar antes de proceder al Paso 0.0.6.

---

## Cabecera de Metadatos del Task Doc (opcional)

> Documenta 3 elementos opcionales que el task doc generado puede incluir en su cabecera (formato blockquote `> **Campo:** valor`). Activar SOLO si el proyecto usa flujos con dependencias entre tareas (`depends_on:`) o el plan-checker pre-implementación. Para tareas aisladas SIMPLE, omitir esta cabecera completa.
>
> Ubicación recomendada: justo después del título `# Tarea NNN: ...` y antes de `## 1. Resumen de la Tarea`.

### `> **Depende de:** NNN, NNN` (opcional)

Lista de IDs de task docs (sin prefijo, sin extensión) que deben estar en estado COMPLETADA antes de empezar este. Permite a `task-planner` agrupar tareas relacionadas en waves de ejecución paralela determinista.

**Ejemplos:**
- `> **Depende de:** 042` — espera a 042 COMPLETADA
- `> **Depende de:** 042, 067` — espera a ambas
- omitir línea — sin dependencias (Wave 1)

**Reglas:**
- IDs separados por coma, sin saltos de línea.
- Solo IDs existentes en `ai_docs/tasks/`.
- Sin ciclos (A depende de B; B depende de A → inválido).
- Forward references inválidas: una tarea NNN no puede depender de NNN+k si NNN+k aún no existe.

**Cuándo usarla:** ≥3 tareas relacionadas en backlog cuyas dependencias importan para el orden.
**Cuándo NO usarla:** tarea aislada o backlog corto.

### `> **Asunciones:** Frase 1; Frase 2` (opcional)

Texto libre, frases cortas separadas por `;`. Declara explícitamente las pre-condiciones del entorno o convenciones que el plan asume. La skill `plan-checker` (si está desplegada) lee esta línea como pre-condiciones aceptadas en su Dimension 5 "CLAUDE.md Compliance" — no las flagea como violación.

**Ejemplo:**
```
> **Asunciones:** Drizzle v5+ disponible; Next.js 15+ App Router; CLAUDE.md no prohíbe librerías externas
```

**Cuándo usarla:** complejidad ESTÁNDAR+ con dependencias del entorno o convenciones implícitas que el plan asume.
**Sin validación mecánica:** task-planner no las valida contra el código (sería caro y propenso a falsos positivos). Es una declaración explícita del razonamiento.

### Sub-bullet "Tamaño estimado" dentro de "Impactos esperados" (obligatorio cuando lo produce task-planner)

El subagent `task-planner` produce este sub-bullet en el último paso de su workflow (Forecast de tamaño — paso 8 del Protocolo de Ejecución). Permite anticipar PRs gigantes inrevisables antes de codear.

**Formato:**
```markdown
- **Tamaño estimado:** [min]-[max] líneas en [N] archivos ([archivo1], [archivo2], ...).
  [Si max > 400:] Por encima de 400 → recomendado split en sub-tareas con `> **Depende de:**` declarado (T079). En proyectos con skill `pr` desplegada, ver su sub-flow "Estrategia de stacking" (T081) para materializar la cadena (Stacked PRs to main vs Feature Branch Chain).
  [Si max > 800:] Por encima de 800 → considerar reclasificar como CRÍTICA.
```

**Heurísticas:** edit puntual 5-20, sección nueva 30-100, archivo nuevo 100-300, refactor de módulo 200-500. Rangos amplios — no falsa precisión.

**Lectura por plan-checker (T078):** Dimension 3 "Scope vs Forecast" lee este número y aplica umbral 400 — sin recalcular. Heurística en un solo sitio (matriz S2 de T076).

**Versionado en reaperturas:** si task-planner reabre el task doc tras `plan-checker` → BLOCKED, conservar el bullet previo como `Tamaño estimado [v1, fecha]:` y añadir nuevo `Tamaño estimado [v2, fecha]:`. Max 3 versiones; a la 4ª, escalar al usuario (sugiere replantear el alcance).

### Sub-sección "Wiring esperado" dentro de "Impactos esperados" (opcional)

Cuando la tarea crea archivos nuevos (skill, hook, agent, command, template), declarar las conexiones esperadas con código existente. Va dentro de la sección que documenta impactos del task doc (en este template genérico es la Sección 10 "Resumen de Cambios de Código" o una sección dedicada "Impactos esperados" si se añade).

**Ejemplo:**
```markdown
- **Wiring esperado:**
  - skill `foo` referenciada desde `CLAUDE.md` §X (tabla de skills) y `bar-agent.md` (encadenamiento).
  - hook `validator.js` registrado como PreToolUse en `.claude/settings.json` (proyecto destino).
  - tipo `Foo` exportado desde `src/types.ts` y consumido por `src/services/bar.ts`.
```

**Cuándo usarla:** task crea ≥1 archivo nuevo. Para edits puros sin creación, omitir.
**Formato:** sub-bullets `[artifact] referenciado/registrado/invocado/consumido desde [archivo:ubicación]`.
**Lectura por plan-checker:** Dimension 6 "Wiring Coverage" verifica que cada artifact creado tiene al menos un wiring declarado. Sin wiring + artifact nuevo → BLOCKER.

### Relación con Reference Integrity

`Wiring esperado` es **declaración PRE-cambio**. El protocolo Reference Integrity (que ejecuta el implementador con `grep` + actualización de referencias tras crear/renombrar/borrar archivos) es **POST-cambio**. Capas distintas, sin solapamiento — el primero declara intención al planificar; el segundo verifica realización al codear.

---

### Plantillas de stack: herencia

Las plantillas especializadas (`task_template_python.md`, `task_template_typescript.md`, etc.) **heredan esta sección "Cabecera de Metadatos del Task Doc (opcional)"** en bloque. No replican su contenido — referencian este archivo. Si una plantilla de stack necesita campos adicionales propios (ej: ADK requiere `> **Coverage de evals:** ...`), los documenta aparte sin duplicar los 3 anteriores.

---

### 0.0.6 — Triaje de Ingeniería (OBLIGATORIO para ESTÁNDAR+)

<!-- AI Agent: Esta fase se ejecuta ANTES de crear el documento de tarea. Para tareas SIMPLE (<=2 archivos, sin decisiones de diseño), el triaje es mental — verificar rápidamente y pasar al Paso 0.1. Para ESTÁNDAR+, es conversación explícita con el usuario. -->

**Propósito:** Analizar la petición del usuario como ingeniero de software senior ANTES de documentar nada. Identificar el impacto real, los prerequisitos faltantes y los problemas de alcance que causan replanificación durante la implementación.

**T1: Analizar** — Examinar el codebase para responder:

- **Radio de impacto:** ¿Cuántos archivos, módulos, servicios, tablas se ven afectados? Esto determina la complejidad real.
  - <=2 archivos en 1 módulo → SIMPLE
  - 3-6 archivos en 1-2 módulos → ESTÁNDAR
  - 6+ archivos o 3+ módulos → COMPLEJA
  - Sistemas externos, datos de producción, prerequisitos bloqueantes → CRÍTICA
- **Prerequisitos:** ¿Qué debe existir para que esto funcione? Trazar dependencias hacia atrás (max 2 niveles). Marcar: ✅ existe | ❌ falta (bloqueante).
- **Integración:** ¿Cómo se conecta con lo existente? ¿Hay patrones establecidos que seguir o reutilizar?
- **Estado del codebase:** ¿Hay deuda técnica, migraciones pendientes, o conflictos que afecten esta tarea?

**T2: Cuestionar (solo si hay razón)** — NO cuestionar por cuota. Cuestionar cuando T1 revele algo que el usuario no ha considerado:

- **Alcance excesivo:** La petición cubre 2+ funcionalidades independientes → proponer desglose en tareas separadas
- **Enfoque subóptimo:** Existe una solución más simple en el codebase o framework → proponerla
- **Prerequisitos bloqueantes:** Falta código/infraestructura que son tareas en sí mismos → proponer crearlos primero
- **Viabilidad técnica:** El enfoque pedido tiene problemas técnicos conocidos → advertir y proponer alternativa
- **Sobre-diseño:** Se pide crear complejidad innecesaria → proponer simplificación (KISS)

Si no hay nada que cuestionar → pasar directo a T3. No fabricar objeciones.

**T3: Alinear** — Presentar al usuario un resumen del alcance antes de crear el documento:

```
Alcance: [1-2 frases de qué se va a hacer]
Complejidad: [SIMPLE|ESTÁNDAR|COMPLEJA|CRÍTICA] — [N archivos, M módulos]
Prerequisitos: [lista si hay] / Ninguno detectado
Fuera de alcance: [solo si hubo negociación en T2]

¿Confirmas este alcance para crear el documento de tarea?
```

**PUNTO DE ESPERA:** Para ESTÁNDAR+, esperar confirmación del usuario antes de proceder al Paso 0.1.

---

<!-- SHARED-BLOCK: protocolo-creacion-v1 -->
### Paso 0.1: Verificar Estructura del Proyecto

Confirmar que los directorios requeridos del proyecto existen antes de crear el documento de tarea.

- Verificar que el directorio `ai_docs/` existe en la raíz del proyecto
- Verificar que el subdirectorio `ai_docs/tasks/` existe

**CONDICIONES DE PARADA:**
- Si `ai_docs/` NO existe: Preguntar al usuario "No encuentro el directorio `ai_docs/`. ¿Debo crearlo?"
- Si `ai_docs/tasks/` NO existe: Preguntar al usuario "¿Debo crear el directorio `ai_docs/tasks/`?"
- Solo proceder si ambos directorios existen

---

### Paso 0.2: Verificar Documento de Tarea Activo

Antes de crear una nueva tarea, verificar si ya existe una para este trabajo:

1. Listar archivos en `ai_docs/tasks/` y buscar un documento relacionado con la solicitud actual
2. Si el usuario pide correcciones/revisiones/continuación: encontrar y ACTUALIZAR ese documento de tarea
3. Solo crear un nuevo número de tarea si es trabajo GENUINAMENTE NUEVO sin documento de tarea existente

Si se encuentra tarea activa: Saltar al Paso 0.5 (Manejar Retroalimentación y Actualizaciones del Usuario) y trabajar en el documento existente.

---

### Paso 0.3: Detectar Siguiente Número de Tarea

Solo si el Paso 0.2 confirmó que no aplica ninguna tarea existente:

1. Listar archivos en `ai_docs/tasks/`
2. Extraer el prefijo de 3 dígitos de CADA nombre de archivo
3. Encontrar el número más alto, sumar 1, formatear con 3 dígitos
4. Si no existen archivos: usar 001

**Reglas:**
- Secuencia global compartida (no reiniciar por tipo)
- Siempre 3 dígitos: 001, 042, 156
- Cada número se usa EXACTAMENTE UNA VEZ -- un número, un archivo
- ❌ El número `000` está RESERVADO para calibración del proyecto — nunca usar para tareas normales

---

### Paso 0.4: Crear Documento de Tarea con Nomenclatura Correcta

CRÍTICO: UNA tarea = UN archivo. UN número = UN archivo. Sin excepciones.

- Formato: `XXX_{nombre}.md` usando la convención de nomenclatura del Paso 0.0.5
- Ubicación: `ai_docs/tasks/`
- Verificar: NO existe un archivo con ese prefijo numérico

**Ejemplos:**
```
024_refactorAuthSystem.md      (camelCase - JS/TS/PHP/WordPress)
025_optimize_image_pipeline.md (snake_case - Python/Django)
026_IMPLEMENT_SEARCH_AGENT.md  (UPPER_SNAKE_CASE - ADK)
```

**Estructura del Documento de Tarea:**
1. Completar TODAS las secciones de esta plantilla
2. Incluir análisis estratégico si se cumplen los criterios de complejidad
3. Proporcionar fases de implementación detalladas
4. Agregar ejemplos de código antes/después
5. Definir criterios de éxito claros

---

### Paso 0.5: Presentar Documento de Tarea al Usuario

**NOTA:** El análisis crítico de impacto, prerequisitos y alcance ya se realizó en el Triaje de Ingeniería (Paso 0.0.6). Aquí se presenta el documento ya validado.

**Verificación rápida antes de presentar:**
- ¿El documento refleja el alcance validado en T3? Si no → actualizar antes de presentar.
- ¿Se descubrió algo nuevo durante el análisis de codebase que cambia el alcance? Si sí → comunicar al usuario como observación.

Presentar al usuario:

```
Documento de Tarea Creado: `ai_docs/tasks/XXX_{nombre}.md`

Resumen del Enfoque Planificado:
[Resumen breve de 2-3 oraciones sobre lo que esta tarea logrará]

[Solo si se descubrió algo nuevo durante el análisis detallado:]
Observaciones Adicionales:
- **[Categoría]:** [Observación concreta]

> Categorías válidas: Dependencia detectada | Prerequisito | Alternativa de enfoque | Optimización | Riesgo identificado | Ajuste de alcance

¿Cómo deseas proceder?

A) Vista Previa de Cambios de Código Detallados
B) Aprobar e Iniciar Implementación
C) Modificar o Iterar sobre el Plan
```

PUNTO DE ESPERA OBLIGATORIO:
- DETENERSE aquí y esperar la elección explícita del usuario (A, B o C)
- NO asumir aprobación ni elegir una opción por defecto
- NO iniciar implementación sin respuesta explícita de "B" o "Aprobado"

**NOTA SOBRE ITERACIÓN:** La iteración es el proceso normal. Las tareas raramente están perfectas en la primera versión. Si el usuario elige C, actualizar el documento existente, incorporar el feedback, y re-presentar.

---

### Paso 0.5b: Manejar Retroalimentación y Actualizaciones del Usuario

Si el usuario elige la Opción C o solicita cambios:

- Leer el documento de tarea actual
- Identificar secciones que requieren actualizaciones según la retroalimentación del usuario
- Usar la herramienta Edit para actualizar el archivo EXISTENTE (nunca crear archivos `_v2`, `_updated`, `_revised`)
- Preservar estructura, actualizar solo contenido
- Agregar notas de revisión:

**Formato de Nota de Revisión:**
```markdown
**[REVISIÓN - YYYY-MM-DD HH:MM]**
Retroalimentación del usuario: [Descripción breve de qué cambió y por qué]
Enfoque actualizado: [Qué se modificó]
```

---

### Paso 0.6: Actualizaciones de Fase de Implementación

Durante la implementación (Opción B), actualizar continuamente el documento de tarea:

#### Regla de Alcance Estricto (ACTIVA durante toda la implementación)

> OBLIGATORIO: Solo modificar código directamente relacionado con la sección "Incluye".

- Si se descubre un problema FUERA del alcance:
  1. **NO arreglarlo** — documentarlo como nota en "Descubrimientos fuera de alcance" del task document
  2. Si es BLOQUEANTE para la tarea actual: PAUSAR, informar al usuario, esperar decisión
  3. Si NO es bloqueante: ignorarlo completamente
- **Test rápido:** ¿Este cambio está en "Incluye"? → SI: proceder. NO: no tocarlo.
- **Excepción única:** errores de sintaxis/compilación en líneas que YA se están modificando
- **Prohibido:** arreglar warnings, code smells, o deuda técnica encontrada "de paso"

#### Actualizaciones de Progreso

- Marcar tareas completadas como [x] con timestamps de finalización
- Documentar cualquier desviación del plan original
- Registrar problemas encontrados y resoluciones
- Actualizar estado de criterios de éxito

**Formato de Actualización de Implementación:**
```markdown
## Registro de Implementación de Fase X

**Estado:** Completado | En Progreso | Bloqueado
**Completado:** YYYY-MM-DD HH:MM
**Duración:** X horas
**Archivos Modificados:**
- ruta/al/archivo (+45 líneas, -12 líneas)
- ruta/a/otro/archivo (+23 líneas)

**Desviaciones del Plan:**
- [Cualquier cambio respecto al enfoque original y razones]

**Problemas Encontrados:**
- [Problemas y resoluciones]

**Siguiente Fase:** Fase X+1 - [Nombre]
```

---

### Paso 0.7: Revisión Post-Implementación

Después de completar TODAS las fases, actualizar el documento de tarea con el estado final:

```markdown
## Implementación Completa

**Fecha de Finalización:** YYYY-MM-DD HH:MM
**Duración Total:** X horas
**Estado:** Todos los Criterios de Éxito Cumplidos

### Resultados de Validación Final
- [x] Criterio 1: [Resultado]
- [x] Criterio 2: [Resultado]
- [x] Criterio 3: [Resultado]

### Notas Finales
[Observaciones importantes, lecciones aprendidas o tareas de seguimiento necesarias]

### Tareas Relacionadas
[Enlace a cualquier tarea de seguimiento creada: #024, #025, etc.]
```

CRÍTICO: El archivo .md de tarea es la fuente única de verdad desde la creación hasta la finalización. Nunca crear archivos separados de resumen, reportes de finalización o documentos de estado.
<!-- /SHARED-BLOCK -->

---

## ACCIONES PROHIBIDAS

1. NO crear múltiples versiones de documentos de tarea (`_v2`, `_updated`, `_final`)
2. NO saltar la secuencia de números de tarea ni reiniciar la numeración
3. NO crear múltiples archivos con el mismo número de tarea
4. NO implementar sin aprobación -- siempre esperar la elección explícita del usuario
5. NO asumir la estructura del proyecto -- siempre verificar que los directorios existen primero

### REGLA DE DOCUMENTO ÚNICO (ABSOLUTA):
- UN número de tarea = UN archivo. Punto.
- Correcciones, progreso de implementación, revisiones, sub-reportes: actualizar el documento de tarea existente

---

## Sección de Seguimiento del Ciclo de Vida de la Tarea

Agregar esta sección a cada documento de tarea que crees:

```markdown
---

## Seguimiento del Ciclo de Vida de la Tarea

### Creación
- **Creado:** [timestamp]
- **Creado Por:** task_template.md
- **Número de Tarea:** [XXX]
- **Complejidad Inicial:** [Simple | Media | Alta | Crítica]

### Revisiones
- [Fecha]: [Qué cambió y por qué]

### Progreso de Implementación

### Estado de Finalización
- **Estado:** [Planificación | En Progreso | Pending Review | Completado | Bloqueado]
- **Última Actualización:** [timestamp]

---
```

---

## 1. Resumen de la Tarea

### Título de la Tarea
**Título:** [Título breve y descriptivo de lo que estás construyendo/corrigiendo]

### Declaración del Objetivo
**Objetivo:** [Declaración clara de lo que quieres lograr y por qué es importante]

### Alcance (del Triaje de Ingeniería)
- **Incluye:** [qué se va a hacer — validado con el usuario en T3]
- **No incluye:** [qué queda fuera y por qué — solo si se negoció alcance]
- **Prerequisitos:** [lo que debe existir, con estado ✅/❌ — del análisis T1]

### Criterios de Éxito (medibles)
- [ ] [Resultado específico y verificable 1]
- [ ] [Resultado específico y verificable 2]
- [ ] [Resultado específico y verificable 3]

### Restricciones Técnicas (si aplica)
- [Restricción 1: Debe usar el sistema X existente]
- [Restricción 2: No puede modificar Y]
- [Restricción 3: Debe ser compatible hacia atrás con Z]

---

<!-- SHARED-BLOCK: alternativas-v1 -->
## 2. Analisis de Alternativas de Implementación

**OBLIGATORIO para tareas ESTÁNDAR o superior. Para SIMPLE, documentar brevemente por que solo hay un enfoque viable.**

### Contexto del Problema
[Explicar el problema y por qué se deben considerar múltiples soluciones]

### Análisis de Alternativas de Solución

#### Alternativa 1: [Nombre de la Solución]
**Enfoque:** [Descripción breve]

**Pros:**
- [Ventaja 1 - beneficio específico]
- [Ventaja 2 - cuantificada cuando sea posible]
- [Ventaja 3]

**Contras:**
- [Desventaja 1 - limitación específica]
- [Desventaja 2 - compensación o costo]
- [Desventaja 3]

**Complejidad de Implementación:** [Baja/Media/Alta] - [Justificación breve]
**Nivel de Riesgo:** [Bajo/Medio/Alto] - [Factores de riesgo principales]

#### Alternativa 2: [Nombre de la Solución]
**Enfoque:** [Descripción breve]

**Pros:**
- [Ventaja 1]
- [Ventaja 2]
- [Ventaja 3]

**Contras:**
- [Desventaja 1]
- [Desventaja 2]
- [Desventaja 3]

**Complejidad de Implementación:** [Baja/Media/Alta] - [Justificación breve]
**Nivel de Riesgo:** [Bajo/Medio/Alto] - [Factores de riesgo principales]

#### Alternativa 3: [Nombre de la Solución] (si aplica)
[Mismo formato que arriba]

### Matriz de Compromisos

| Factor | Alternativa 1 | Alternativa 2 | Alternativa 3 | Ganador |
|--------|----------|----------|----------|---------|
| **Complejidad** | B/M/A | B/M/A | B/M/A | [ ] |
| **Rendimiento** | B/M/A | B/M/A | B/M/A | [ ] |
| **Mantenibilidad** | B/M/A | B/M/A | B/M/A | [ ] |
| **Escalabilidad** | B/M/A | B/M/A | B/M/A | [ ] |
| **Deuda Técnica** | B/M/A | B/M/A | B/M/A | [ ] |

### Recomendación y Justificación

SOLUCIÓN RECOMENDADA: Alternativa [X] - [Nombre de la Solución]

**Por qué esta es la mejor opción:**
1. **[Razón principal]** - [Justificación específica]
2. **[Razón secundaria]** - [Evidencia de soporte]
3. **[Razón adicional]** - [Consideraciones a largo plazo]

**Alternativas Rechazadas:**
- Alternativa [Y]: Rechazada porque [razón concreta, no "es peor"]
- Alternativa [Z]: Rechazada porque [razón concreta]

### DECISIÓN DEL USUARIO REQUERIDA

Presentar las alternativas al usuario con la recomendación. **Esperar aprobación antes de proceder con las secciones de implementación.**
<!-- /SHARED-BLOCK -->

---

## 3. Análisis del Proyecto y Estado Actual

### Tecnología y Arquitectura
Analizar el proyecto para identificar:

- **Frameworks y Versiones:** [ej., Framework X.Y]
- **Lenguaje:** [ej., Python 3.12, TypeScript 5.4]
- **Base de Datos y ORM:** [ej., PostgreSQL via SQLAlchemy]
- **UI y Estilos:** [ej., Tailwind CSS, Bootstrap]
- **Autenticación:** [ej., OAuth 2.0, basada en sesiones]
- **Patrones Arquitectónicos Clave:** [ej., MVC, microservicios, server components]
- **Código Existente Relevante:** [ej., módulos, componentes, servicios a reutilizar]

### Estado Actual
[Describir la situación actual, código existente y qué funciona/no funciona -- basado en análisis real de archivos, no suposiciones]

### Análisis del Código Base
Analizar patrones existentes del código relevantes para la tarea: inyección de dependencias, gestión de estado, flujo de datos y oportunidades de reutilización. Seguir el protocolo de análisis de tu plantilla específica del stack si está disponible.

---

---

## 5. Contexto del Proyecto y Enfoque de Desarrollo

### Detectar Fase del Proyecto

Antes de planificar la implementación, determinar la fase del proyecto:

**PROYECTO GREENFIELD** (Desarrollo nuevo):
- Código base inicializado recientemente (< 6 meses)
- Sin usuarios en producción aún
- Datos mínimos o inexistentes
- Fase de desarrollo activo

**PROYECTO BROWNFIELD** (Sistema establecido):
- Sistema en producción existente con usuarios activos
- Datos de producción que no pueden perderse
- Código legacy o dependencias no documentadas
- Los cambios podrían romper funcionalidad existente

### Enfoque de Desarrollo por Fase del Proyecto

#### Para Proyectos GREENFIELD
*"Avanzar rápido, iterar, priorizar aprendizaje sobre preservación"*

- Cambios que rompen compatibilidad en APIs e interfaces son aceptables
- Cambios de esquema de base de datos sin migraciones complejas
- Refactorización y reestructuración agresiva
- Los datos pueden ser borrados y regenerados
- Documentar cambios que rompen compatibilidad para conocimiento del equipo

#### Para Proyectos BROWNFIELD
*"No romper nada. Análisis exhaustivo antes de cada cambio."*

- Análisis exhaustivo de dependencias antes de CUALQUIER cambio
- Respaldos completos antes de modificaciones
- Pruebas comprensivas de funcionalidad existente
- Planes de rollback para todos los cambios
- Estrategias de migración cuidadosas para datos

#### Proyectos HÍBRIDOS (Fase Mixta)
- Para código existente/en producción: Usar enfoque brownfield
- Para nuevas funcionalidades aisladas: Puede usar enfoque greenfield
- En puntos de integración: Usar enfoque brownfield (proteger lo existente)

### Documentación del Contexto del Proyecto

Documentar esto en cada tarea:

```markdown
## Contexto del Proyecto

**Fase del Proyecto**: [Greenfield / Brownfield / Híbrido]

**Evidencia**:
- [Qué indica esta fase]

**Enfoque de Desarrollo**: [Iteración rápida / Preservación cuidadosa / Mixto]

**Restricciones**:
- Compatibilidad hacia atrás: [Requerida / No requerida]
- Preservación de datos: [Crítica / Se puede regenerar]
- Cambios que rompen compatibilidad: [Aceptables / Prohibidos]
- Profundidad de pruebas: [Básica / Regresión exhaustiva]
```

CRÍTICO: Ante la duda, usar enfoque brownfield. Es más seguro ser precavido que romper producción.

---

---

## 7. Datos y Cambios de Base de Datos

### Cambios de Esquema de Base de Datos
```sql
-- Creación de nuevas tablas, sentencias DDL, migraciones, índices
```

### Plan de Migración de Datos
- [ ] [Paso de migración 1]
- [ ] [Paso de migración 2]
- [ ] [Pasos de validación de datos]

### Seguridad de Migración
Antes de ejecutar CUALQUIER migración de base de datos, asegurar que existe una estrategia de rollback. Seguir el protocolo de seguridad de migración de tu stack (ej., `drizzle-migration-rollback`, `django-migration-workflow`).

---

---

## 9. Cambios de Frontend (si aplica)

### Nuevos Componentes / Páginas
- [ ] [Componente/página 1: Ruta, propósito]
- [ ] [Componente/página 2: Ruta, propósito]

### Gestión de Estado
- [Enfoque de estado, decisiones de flujo de datos]

---

## 10. Resumen de Cambios de Código

### OBLIGATORIO: Mostrar Cambios de Código de Alto Nivel Antes de Implementación

Antes de presentar el documento de tarea para aprobación, proporcionar una visión clara de los cambios de código planificados.

### Archivo: [ruta/al/archivo] (Líneas: actual -> propuesto)
**Tipo de Cambio**: [Archivo Nuevo / Refactorización Mayor / Actualización Menor / Eliminación]
**Líneas**: [Conteo actual] -> [Conteo nuevo] (+X/-Y líneas)

**Implementación Actual** (solo secciones clave):
```
// Mostrar 5-10 líneas del código actual crítico
// Enfocarse en las partes que se modifican
```

**Cambios Propuestos**:
```
// Mostrar las mismas secciones con cambios
// CHANGED: explicación
// ADDED: explicación
// REMOVED: explicación
```

**Impacto**:
- Funcionalidad: [Qué comportamiento cambia]
- Dependencias: [Qué otros archivos se afectan]
- Cambios que rompen compatibilidad: [Cualquier cambio de API/interfaz]

**Requisitos Mínimos**:
- Mostrar al menos 3 bloques de código para tareas que modifican 3+ archivos
- Incluir firmas de funciones para cualquier función modificada
- Mostrar definiciones de tipos para cualquier interfaz/tipo modificado
- Resaltar puntos de integración donde los archivos se conectan

### Resumen de Cambios Clave
- [ ] **Cambio 1:** Descripción breve de qué se modifica y por qué
- [ ] **Cambio 2:** Otro cambio mayor con justificación
- [ ] **Archivos Modificados:** Lista de archivos con cambios en conteo de líneas
- [ ] **Impacto:** Cómo esto afecta el comportamiento de la aplicación

Si no se requieren cambios de código (tareas puramente de documentación/planificación), indicar "No se requieren cambios de código."

---

## 11. Plan de Implementación

### Fase 1: Cambios de Base de Datos (Si se Requieren)
**Objetivo:** Preparar y aplicar cambios de esquema de base de datos con capacidad de rollback seguro

- [ ] **Tarea 1.1:** Actualizar Archivos de Esquema / Modelo
  - Archivos: [rutas de archivos de esquema/modelo]
  - Detalles: Actualizar archivos de esquema con nuevos campos, tablas o índices
- [ ] **Tarea 1.2:** Crear Estrategia de Rollback (OBLIGATORIO)
  - Archivos: [rutas de archivos de rollback de migración]
  - Detalles: Seguir el protocolo de seguridad de migración específico del stack
- [ ] **Tarea 1.3:** Aplicar Migración
  - Detalles: Solo ejecutar después de que la estrategia de rollback esté creada y verificada

### Fase 2: [Nombre de la Fase]
**Objetivo:** [Lo que esta fase logra]

**Subtareas:**
- [ ] **Tarea 2.1:** [Tarea específica con rutas de archivos]
  - Archivos: [rutas]
  - Detalles: [Especificaciones técnicas]
  - **Listo Cuando**: [Estado de finalización específico y medible]
- [ ] **Tarea 2.2:** [Otra tarea]
  - Archivos: [Archivos afectados]
  - Detalles: [Notas de implementación]
  - **Listo Cuando**: [Criterio de finalización medible]

**Criterios de Finalización de Fase** (TODOS deben ser verdaderos para proceder):
- [ ] Todas las subtareas marcadas [x] con timestamps de finalización
- [ ] Todos los archivos modificados existen en las rutas especificadas
- [ ] Linting/validación apropiada del stack pasa correctamente
- [ ] La lectura de archivos confirma que todo el código coincide con las descripciones de la tarea
- [ ] Sin comentarios TODO o código comentado en archivos modificados

**Reporte de Aprobación de Fase** (Generar antes de solicitar "proceder"):
```markdown
## Reporte de Finalización de Fase N

**Archivos Modificados**: [cantidad]
- ruta/al/archivo (+X líneas, -Y líneas): [Descripción breve]

**Resultados de Validación**:
- Linting: Pass / Fail (Código de salida: [0 o distinto de cero])
- Verificación de tipos/sintaxis: Pass / Fail (Errores: [0 o lista])
- Verificación de archivos: Todos los archivos creados / Faltantes: [lista]
- Calidad de código: Limpio / Problemas: [TODOs, código comentado]

**Listo para Proceder**: SÍ / NO
**Bloqueantes** (si NO): [Listar problemas]
```

REGLA: Si "Listo para Proceder" = NO, NO solicitar aprobación del usuario. Resolver bloqueantes primero.

### Fase 3: [Nombre de la Fase]
**Objetivo:** [Lo que esta fase logra]

**Subtareas:**
- [ ] **Tarea 3.1:** [Tarea específica]
  - Archivos: [rutas]
  - **Listo Cuando**: [Criterio de finalización medible]

### Fase 4: Validación Básica de Código (Solo AI)
**Objetivo:** Ejecutar solo análisis estático seguro -- NUNCA ejecutar servidor de desarrollo, build o comandos de aplicación

- [ ] **Tarea 4.1:** Verificación de Calidad de Código
  - Ejecutar linting y análisis estático SOLAMENTE
- [ ] **Tarea 4.2:** Revisión de Lógica Estática
  - Leer código para verificar lógica de sintaxis, manejo de casos extremos, patrones de respaldo
- [ ] **Tarea 4.3:** Verificación de Contenido de Archivos (si aplica)
  - Leer archivos para verificar estructura de datos, corrección de configuración (SIN llamadas a base de datos/API en vivo)

PUNTO DE CONTROL CRÍTICO DEL FLUJO DE TRABAJO: Después de la Fase 4, presentar el mensaje "¡Implementación Completa!" (Sección 16, Paso 6), esperar aprobación del usuario, luego ejecutar revisión comprensiva de código. NUNCA proceder a pruebas del usuario sin completar la revisión de código.

### Fase 5: Revisión Comprensiva de Código (Obligatoria)

- [ ] **Tarea 5.1:** Presentar "¡Implementación Completa!" y esperar aprobación del usuario
- [ ] **Tarea 5.2:** Ejecutar Revisión de Código (si se aprueba):

**Checklist de Revisión (TODOS obligatorios):**

1. **Requisitos** — Mapear cada criterio de éxito a su implementación (archivo:línea). Si alguno NO CUMPLIDO → DETENER.
2. **Linting y tipos** — Ejecutar herramientas del stack (eslint/ruff/etc + tsc/mypy/etc). 0 NUEVOS errores introducidos por los cambios (errores preexistentes fuera de alcance).
3. **Code smells** — Buscar EN ARCHIVOS MODIFICADOS: TODO/FIXME, console.log/print, código comentado, imports no usados. Reportar hallazgos; NO eliminar sin confirmación del usuario.
4. **DRY** — En archivos modificados, verificar que no se duplica lógica ya existente en el codebase. Si se encuentra duplicación → reportar al usuario con propuesta de extracción; NO extraer automáticamente.
5. **KISS** — ¿Es la implementación más simple que satisface los criterios? Complejidad adicional requiere justificación explícita.
6. **Separación de responsabilidades** — Validación, lógica de negocio y acceso a datos en capas separadas. Sin lógica de negocio en controllers/views. Sin queries en capa de presentación.
7. **Seguridad** — Validación de inputs en servidor, sin SQL/XSS/injection, permisos verificados, sin secretos hardcoded.
8. **Integración** — Listar callers/importers de las funciones/módulos modificados (todos los que existan, sin mínimo artificial) → verificar que cada uno sigue compilando. Firmas de funciones compatibles. Sin dependencias circulares.
9. **Regresión** — Ejecutar suite de tests COMPLETA (no solo tests "related"). Resultado: X/Y tests pasan. Si no hay tests para código modificado, documentar como riesgo.
10. **Arquitectura** — Patrones de acceso a datos siguen convenciones del proyecto. Sin violaciones de límites.
11. **Migración de BD** (si aplica) — Rollback existe ANTES de aplicar. Operaciones seguras (IF EXISTS, etc).
12. **Accesibilidad** (si cambios frontend) — Contraste suficiente, alt text en imágenes, navegación por teclado funcional, aria labels donde corresponda.
13. **Dependencias** — `npm audit` / `pip-audit` / `composer audit` sin vulnerabilidades críticas introducidas por el cambio.

**Baseline de deuda técnica y rendimiento (ESTÁNDAR+):** Registrar al inicio y al final: errores de lint, errores de tipos, cobertura de tests (si existe), tiempos de respuesta y conteo de queries en rutas afectadas. El cambio no debe empeorar métricas significativamente: lint/tipos (+0 nuevos), coverage (tolerancia -2%), response time (tolerancia +10% en rutas modificadas). Métricas preexistentes fuera de alcance.

**Veredicto:** APROBADO (0 problemas) / CONDICIONAL (problemas menores) / RECHAZADO (problemas críticos → REPORTAR al usuario con propuesta de corrección; NO corregir automáticamente sin aprobación)

### Fase 6: Pruebas del Usuario (Solo Después de Revisión de Código)

- [ ] **Tarea 6.1:** Presentar Resultados de Pruebas AI
- [ ] **Tarea 6.2:** Solicitar Pruebas del Usuario con checklist específico
- [ ] **Tarea 6.3:** Esperar Confirmación del Usuario

---

---

---

<!-- SHARED-BLOCK: edge-cases-v1 -->
## 14. Analisis de Modos de Falla y Casos Extremos

**OBLIGATORIO para tareas ESTÁNDAR o superior. Para SIMPLE, omitir esta sección.**

### Escenarios de Error a Analizar
- [ ] **Escenario de Error 1:** [Qué podría salir mal]
  - **Foco de Revisión de Código:** [Qué archivos/funciones examinar]
  - **Corrección Potencial:** [Enfoque sugerido]
- [ ] **Escenario de Error 2:** [Otro punto potencial de falla]
  - **Foco de Revisión de Código:** [Dónde buscar]
  - **Corrección Potencial:** [Solución recomendada]

### Preguntas Obligatorias de Edge Cases

- [ ] **Inputs vacios/nulos**: Que pasa si el usuario envia datos vacios, campos nulos, strings vacios?
- [ ] **Escala**: Que pasa con 10x el volumen actual de datos? Las operaciones son eficientes?
- [ ] **Concurrencia**: Que pasa si dos usuarios modifican el mismo recurso simultaneamente?
- [ ] **Dependencias externas**: Que pasa si la base de datos esta lenta, un servicio externo no responde, o una API falla?
- [ ] **Estado inconsistente**: Que pasa si una operación multi-paso falla a la mitad? Hay rollback?
- [ ] **Seguridad**: Se validan inputs en el servidor? Se verifican permisos? Hay inyeccion posible?
- [ ] **Permisos**: Diferentes roles de usuario ven/hacen lo correcto?
- [ ] **Migracion de datos**: Si hay cambios en BD, que pasa con datos existentes?
- [ ] **Limites de sistema**: Que pasa con archivos grandes, timeouts, o limites de memoria?

### Fallas Criticas (Alto Impacto + Alta Probabilidad)
- [Listar las que requieren mitigacion obligatoria]

### Riesgos Aceptados (Bajo Impacto o Baja Probabilidad)
- [Listar con justificación]

### Revisión de Seguridad y Control de Acceso
- [ ] **Control de Acceso de Administrador:** ¿Las funcionalidades solo de administrador están correctamente restringidas?
- [ ] **Estado de Autenticación:** ¿El sistema maneja apropiadamente los usuarios sin sesión?
- [ ] **Validación de Entrada de Formularios:** ¿Las entradas se validan del lado del cliente y del servidor?
- [ ] **Límites de Permisos:** ¿Pueden los usuarios acceder a datos/funcionalidades que no deberían?

### Enfoque de Análisis del Agente AI
Revisar código existente para identificar puntos de falla y brechas de seguridad. Proporcionar recomendaciones específicas con rutas de archivos y ejemplos de código.

**Orden de Prioridad:**
1. CRÍTICO: Problemas de seguridad y control de acceso
2. IMPORTANTE: Escenarios de error y casos extremos visibles al usuario
3. DESEABLE: Mejoras de UX y mensajes de error mejorados
<!-- /SHARED-BLOCK -->

---

<!-- SHARED-BLOCK: rollback-v1 -->
## 14B. Estrategia de Rollback (OBLIGATORIO para COMPLEJA/CRÍTICA)

Cada tarea COMPLEJA o CRÍTICA DEBE incluir un plan de rollback:

### Si el cambio de código rompe funcionalidad:
1. `git revert <commit_hash>`
2. Verificar que la funcionalidad anterior esta restaurada
3. Re-desplegar version anterior si es necesario

### Si la migración de base de datos falla:
1. Ejecutar migración reversa (si existe)
2. Restaurar desde backup si no hay migración reversa
3. Verificar integridad de datos

### Si la migración de datos corrompe datos:
1. Restaurar desde backup
2. Verificar datos con consultas de validación
3. Documentar causa raiz

**Documentar:**
- **Disparadores de rollback:** [Que condiciones activan el rollback]
- **Tiempo estimado de rollback:** [Minutos/horas]
- **Datos en riesgo:** [Que datos podrian perderse]
- **Verificación post-rollback:** [Como confirmar éxito]
<!-- /SHARED-BLOCK -->

---

---

<!-- SHARED-BLOCK: puerta-pre-impl-v2 -->
## PUERTA PRE-IMPLEMENTACIÓN (OBLIGATORIO)

Antes de iniciar cualquier implementación, TODOS los checkboxes deben estar marcados:

- [ ] Triaje de Ingeniería completado — alcance validado con usuario (ESTÁNDAR+)
- [ ] Complejidad clasificada basada en radio de impacto real
- [ ] Pre-flight completado sin errores
- [ ] Prerequisitos verificados — todos existen o tienen tarea separada
- [ ] Archivos afectados identificados
- [ ] Alternativas evaluadas (ESTÁNDAR+)
- [ ] Casos extremos analizados (ESTÁNDAR+)
- [ ] Rollback documentado (COMPLEJA/CRÍTICA)
- [ ] Criterios de éxito medibles definidos
- [ ] Documento presentado y aprobado por usuario

→ Si CUALQUIER checkbox sin marcar: DETENER. No implementar.
<!-- /SHARED-BLOCK -->

---

<!-- SHARED-BLOCK: instrucciones-agente-v3 -->
## Instrucciones para el Agente de IA

**Rol: Ingeniero de Software Senior, no documentador.**

El asistente NO acepta la petición del usuario sin análisis. ANTES de crear cualquier documento de tarea, ejecutar el Triaje de Ingeniería (Paso 0.0.6): analizar impacto, trazar prerequisitos, evaluar alcance.

### Disciplina de Alcance (OBLIGATORIO)

> Complementa la "Regla de Alcance Estricto" del Paso 0.6 con principios de decisión.

- **Decisiones intencionales:** Asumir que código existente fuera del alcance refleja decisiones de negocio válidas. No sugerir cambios a código funcional que no está en el scope.
- **Auto-remediación prohibida:** Nunca corregir problemas descubiertos durante review sin confirmación explícita del usuario. Reportar → esperar → actuar.

### Señales de Alerta (DETENER y comunicar al usuario)

- Petición que cubre 2+ funcionalidades independientes → proponer desglose en tareas separadas
- Prerequisitos bloqueantes que son tareas en sí mismos → proponer crearlos primero
- Existe solución más simple en el codebase o framework → proponerla
- Radio de impacto sugiere complejidad diferente a la intuida → advertir y re-clasificar
- Se pide crear complejidad innecesaria → proponer simplificación (KISS)

### Flujo de Trabajo

1. **Triaje** — Analizar impacto, prerequisitos, alcance (Paso 0.0.6 — T1/T2/T3)
2. **Alinear** — Presentar alcance al usuario, esperar confirmación (ESTÁNDAR+)
3. **Pre-flight** — Verificar entorno y herramientas del stack
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
- Actualizar checkbox del documento de tarea: `[x]` + timestamp + archivos modificados + resultado de verificación (lint/tipos)
- Si se descubre que el alcance era incorrecto → DETENER, comunicar, re-planificar
- Esperar "proceder" antes de siguiente fase

Tras todas las fases: cambiar estado a `Pending Review` → ejecutar checklist de revisión → si APROBADO cambiar a `Completado`.

### Aprobación Explícita

**APROBADO**: "ejecuta", "adelante", "aprobado", "proceder", "se ve bien"
**NO APROBADO**: "interesante", "ya veo", preguntas sobre el plan, silencio
**AMBIGUO**: "ok", "vale", "claro" → confirmar antes de proceder
<!-- /SHARED-BLOCK -->

---

---

## 18. Consecuencias de Segundo Orden y Análisis de Impacto

Antes de implementar cualquier cambio, analizar sistemáticamente las potenciales consecuencias de segundo orden y alertar al usuario sobre impactos significativos.

### Marco de Evaluación de Impacto

#### 1. Análisis de Cambios que Rompen Compatibilidad
- [ ] **Contratos de API Existentes:** ¿Esto romperá endpoints o contratos de datos existentes?
- [ ] **Dependencias de Base de Datos:** ¿Hay otras tablas/consultas que dependen de las estructuras modificadas?
- [ ] **Dependencias de Componentes:** ¿Qué componentes consumen las interfaces/props que se cambian?
- [ ] **Autenticación/Autorización:** ¿Esto afectará permisos o patrones de acceso existentes?

#### 2. Evaluación de Efectos en Cascada
- [ ] **Impacto en Flujo de Datos:** ¿Cómo afectarán los cambios a los consumidores posteriores?
- [ ] **Efectos en Cascada de UI/UX:** ¿Los cambios de componentes requerirán actualizaciones padre/hijo?
- [ ] **Gestión de Estado:** ¿Las nuevas estructuras de datos conflictarán con patrones existentes?
- [ ] **Dependencias de Rutas:** ¿Hay dependencias de rutas afectadas por cambios de estructura?

#### 3. Implicaciones de Rendimiento
- [ ] **Impacto en Consultas de Base de Datos:** ¿Las nuevas consultas afectarán el rendimiento de consultas existentes?
- [ ] **Tamaño de Bundle/Paquete:** ¿Las nuevas dependencias aumentan significativamente el payload?
- [ ] **Carga del Servidor:** ¿Las nuevas operaciones aumentarán el uso de recursos del servidor?
- [ ] **Estrategia de Caché:** ¿Los cambios invalidan mecanismos de caché existentes?

#### 4. Consideraciones de Seguridad
- [ ] **Superficie de Ataque:** ¿Esto introduce nuevas vulnerabilidades potenciales?
- [ ] **Exposición de Datos:** ¿Riesgos de exponer inadvertidamente datos sensibles?
- [ ] **Escalación de Permisos:** ¿Las nuevas funcionalidades podrían evadir la autorización existente?
- [ ] **Validación de Entrada:** ¿Todos los nuevos puntos de entrada de datos están correctamente validados?

#### 5. Impactos en la Experiencia de Usuario
- [ ] **Disrupción del Flujo de Trabajo:** ¿Los cambios confundirán a los usuarios existentes?
- [ ] **Migración de Datos:** ¿Los usuarios necesitan tomar acción para migrar datos?
- [ ] **Deprecación de Funcionalidades:** ¿Se están eliminando funcionalidades existentes?

#### 6. Carga de Mantenimiento
- [ ] **Complejidad del Código:** ¿Estamos introduciendo patrones más difíciles de mantener?
- [ ] **Dependencias:** ¿Las nuevas dependencias de terceros son confiables?
- [ ] **Overhead de Pruebas:** ¿Esto requerirá cobertura de pruebas adicional significativa?

### Identificación de Problemas Críticos

**INDICADORES ROJOS - Alertar al Usuario Inmediatamente:**
- [ ] Migración de base de datos que requiere migración de datos en producción
- [ ] Cambios que rompen compatibilidad de API afectando integraciones existentes
- [ ] Degradación de rendimiento que impacta significativamente la velocidad
- [ ] Vulnerabilidades de seguridad o riesgos de exposición de datos
- [ ] Riesgo de perder o corromper datos de usuario

**INDICADORES AMARILLOS - Discutir con el Usuario:**
- [ ] Complejidad aumentada del código base
- [ ] Nuevas dependencias que aumentan el tamaño del bundle/paquete
- [ ] Cambios de UI/UX que modifican flujos de trabajo familiares
- [ ] Funcionalidades que requieren mantenimiento continuo

### Estrategias de Mitigación

**Cambios de Base de Datos:**
- [ ] Asegurar respaldos antes de cambios de esquema
- [ ] Definir procedimientos claros de rollback
- [ ] Probar en entorno de staging primero

**Cambios de API:**
- [ ] Usar versionado de API para compatibilidad hacia atrás
- [ ] Proporcionar cronograma de deprecación
- [ ] Asegurar degradación elegante durante la transición

**Cambios de UI/UX:**
- [ ] Usar feature flags para despliegue gradual
- [ ] Actualizar documentación antes de lanzar

### Checklist del Agente AI

Antes de presentar el documento de tarea:
- [ ] Completar todas las secciones de evaluación de impacto
- [ ] Señalar cualquier indicador rojo o amarillo
- [ ] Proponer estrategias de mitigación para riesgos identificados
- [ ] Comunicar claramente impactos significativos de segundo orden
- [ ] Recomendar alternativas si se identifican impactos de alto riesgo

---

## Agente Recomendado

Después de crear el documento de tarea, usar la skill de codificación apropiada y el subagent `reviewer`:

| Stack | Skill de codificación | Revisor |
|-------|----------------------|---------|
| TypeScript/Next.js | `cleanup` | `reviewer` |
| Python | `cleanup-python` | `reviewer` |
| Django | `cleanup-django` | `reviewer` |
| Google ADK | `adk` | `reviewer` |
| PHP | `cleanup-php` | `reviewer` |
| Drizzle ORM | `drizzle-migration-rollback` | `reviewer` |

---

## 20. Bloque `contract:` opcional (T087)

Para tareas ESTÁNDAR+ con `depends_on:` declarado o handoffs explícitos entre subagents, añadir al final del task doc un bloque YAML que formaliza los campos críticos para parsing mecánico:

````yaml
contract:
  task_id: "NNN"
  complexity: "ESTÁNDAR"        # SIMPLE | ESTÁNDAR | COMPLEJA | CRÍTICA
  depends_on: []                 # IDs sin prefijo, sin extensión
  forecast:
    min_lines: 0
    max_lines: 0
    files_modified: 0
    files_created: 0
  wiring:
    - "ruta/al/archivo (creado|modificado)"
  produced_by: "task-planner"
  validated_by: ["plan-checker"]
  consumed_by: ["implementer", "reviewer", "doc-syncer"]
````

**Opcional.** Si ausente, plan-checker y demás agents leen las cabeceras blockquote (`> **Depende de:**`, `> **Asunciones:**`) y los sub-bullets ("Tamaño estimado", "Wiring esperado") como hasta T086. Ver detalle del schema en `CLAUDE.md` raíz §3.2 "Bloque `contract:` opcional (T087)".

---

*Versión de Plantilla: 4.0 - Triaje de Ingeniería + Patrones Modernos*
*Última Actualización: 2026-05-05*
*Creado Por: Brandon Hancock*
