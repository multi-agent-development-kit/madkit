# Creador de Tareas

> Crea documentos de tareas numerados con secuenciamiento automático, detección de tipo de proyecto, triaje de complejidad y delegación a la plantilla de tarea apropiada. Funciona en cualquier proyecto.

**Trigger:** El usuario dice "crear tarea", "nueva tarea", "make task", o invoca `/task-creator`
**Input:** `$ARGUMENTS` -- descripción de lo que necesita hacerse

---

## Paso 1: Detectar Siguiente Número de Tarea

Escanear `ai_docs/tasks/` en busca de archivos de tareas existentes y determinar el siguiente número secuencial.

**Acciones Requeridas:**
1. Listar todos los archivos en `ai_docs/tasks/`
2. Encontrar archivos que coincidan con el patrón `NNN_*` (prefijo de 3 dígitos)
3. Extraer el número más alto encontrado
4. Siguiente número = más alto + 1 (formato de 3 dígitos: `001`, `042`, `156`)

**Si `ai_docs/tasks/` no existe:** Crearlo, iniciar en `001`
**Si el directorio está vacío:** Iniciar en `001`

---

## Paso 2: Detectar Tipo de Proyecto

Analizar la raíz del proyecto para identificar el stack tecnológico. La detección sigue la misma tabla de prioridad que el agente `task-planner` (primera coincidencia gana):

1. Django (`manage.py` + `settings.py`) → `snake_case` → `task_template_django`
2. Google ADK (`agent.py` + `google-adk`) → `UPPER_SNAKE_CASE` → `task_template_adk`
3. Python (`pyproject.toml` o `setup.py`, sin Django) → `snake_case` → `task_template_python`
4. TypeScript/Next.js (`tsconfig.json` o `next.config.*`) → `camelCase` → `task_template_typescript`
5. WordPress (`wp-content/` o `wp-config.php`) → `camelCase` → `task_template_wordpress`
6. PHP (`composer.json` + archivos `.php`) → `camelCase` → `task_template_php`
7. Web/JS genérico (`package.json` sin tsconfig) → `camelCase` → `task_template`

**Monorepo:** Si se detectan múltiples stacks → preguntar al usuario a cuál se dirige esta tarea.
**Fallback:** Sin stack detectado → `snake_case`, plantilla genérica.

---

## Paso 2.5: Triaje de Ingeniería

Antes de evaluar complejidad, analizar la petición como ingeniero de software senior:

**Analizar:**
- **Radio de impacto:** ¿Cuántos archivos/módulos/servicios afecta? Examinar el codebase brevemente.
- **Prerequisitos:** ¿Qué debe existir para que funcione? ¿Falta algo bloqueante?
- **Atomicidad:** ¿Es una tarea o varias? Si cubre 2+ funcionalidades independientes → proponer desglose.

**Cuestionar (solo si hay razón):**
- ¿Existe solución más simple en el codebase? → proponerla
- ¿Prerequisitos bloqueantes? → proponer tareas separadas primero
- ¿Alcance excesivo? → proponer desglose

**Si hay problemas de alcance:** Comunicar al usuario y esperar confirmación ANTES de crear el documento.
**Si todo está en orden:** Proceder a Paso 3.

---

## Paso 3: Evaluar Complejidad

Basado en el radio de impacto real del Paso 2.5 (no en intuición):

### SIMPLE (~150 líneas)
<=2 archivos en 1 módulo, sin prerequisitos, sin decisiones de diseño. Bug fix directo, actualización de config, función utilitaria simple.

**Secciones:** Resumen de tarea, Problema, Plan de Implementación
**Omitir:** Análisis estratégico, análisis del codebase, cambios de base de datos, análisis de impacto

### ESTÁNDAR (~400 líneas)
3-6 archivos, prerequisitos existen, algo de diseño necesario. Endpoint API, cambio de esquema, integración de servicio.

**Secciones:** Análisis completo, omitir impacto profundo de segundo orden

### COMPLEJA (~600+ líneas)
6+ archivos o 2+ módulos. Integración multi-servicio, cambio de arquitectura, breaking changes.

**Secciones:** Todas las secciones con detalle completo

### CRÍTICA
Sistemas externos, datos de producción, prerequisitos bloqueantes, cambios irreversibles.

**Secciones:** Todas las secciones + estrategia de rollback obligatoria + revisión de seguridad

### Inicio Rápido (para tareas SIMPLE)
Si es claramente SIMPLE, usar este formato mínimo y DETENERSE — no proceder al Paso 5:

```markdown
# Tarea {NNN}: {Título}

## Problema
[1-2 frases]

## Solución
[1-2 frases]

## Implementación
- [ ] **Paso 1:** [Acción]
  - Archivos: [ruta]
  - Detalles: [Qué cambiar]
- [ ] **Paso 2:** [Acción]
  - Archivos: [ruta]
  - Detalles: [Qué cambiar]

## Archivos a Modificar
- `ruta/al/archivo` — [Qué cambia]

## Estado
- Creado: {fecha}
- Complejidad: Simple
- Estado: En Progreso
```

---

## Paso 4: Crear Documento de Tarea

Crear archivo en `ai_docs/tasks/{NNN}_{name}.md`

**Reglas de nombre por convención:**

| Convención | Solicitud del Usuario | Nombre de Archivo |
|-----------|--------------|----------|
| `snake_case` | "agregar notificaciones email" | `029_add_email_notifications.md` |
| `camelCase` | "refactorizar sistema auth" | `029_refactorAuthSystem.md` |
| `UPPER_SNAKE_CASE` | "implementar agente coordinador" | `029_IMPLEMENT_COORDINATOR_AGENT.md` |

**Estructura inicial (para Standard y Complex):**

```markdown
# Tarea {NNN}: {Título}

## Objetivo
{Objetivo en una línea}

## Contexto
{Breve contexto}

## Complejidad: {SIMPLE | ESTÁNDAR | COMPLEJA | CRÍTICA}

## Requisitos
- [ ] {Requisito 1}
- [ ] {Requisito 2}

## Plan de Implementación
{A completar por el workflow de la plantilla de tarea}

## Estado
- Creado: {fecha}
- Complejidad: {nivel}
- Stack: {stack detectado}
- Plantilla: {plantilla usada}
- Estado: En Progreso
```

---

## Paso 5: Delegar a Plantilla de Tarea

Después de crear el documento, seguir la plantilla de tarea apropiada.

**Orden de Búsqueda de Plantillas:**
1. `.claude/commands/{template_name}.md`
2. `ai_docs/templates/{template_name}.md`

**Mapeo de Plantillas:**

| Stack | Plantilla | Skill/Agent Recomendado |
|-------|----------|------------------------|
| Google ADK | `task_template_adk` | `adk` |
| Python | `task_template_python` | `cleanup-python` + `reviewer` |
| TypeScript/Next.js | `task_template_typescript` | `cleanup` + `reviewer` |
| Django | `task_template_django` | `cleanup-django` + `reviewer` |
| PHP/Web Legacy | `task_template_php` | `cleanup-php` + `reviewer` |
| WordPress | `task_template_wordpress` | `cleanup-php` + `reviewer` |
| Web/JavaScript (genérico) | `task_template` | `cleanup` + `reviewer` |

**Si se encuentra la plantilla:** Seguir su workflow. La plantilla maneja validación pre-flight, análisis, planificación de implementación y tracking de completitud.

**Si NO se encuentra la plantilla:** Completar el análisis, identificar archivos, escribir pasos de implementación, agregar criterios de éxito, presentar al usuario.

---

## Paso 6: Presentar al Usuario

```
Tarea {NNN} creada: ai_docs/tasks/{nombre_archivo}

Stack: {stack detectado}
Complejidad: {SIMPLE | ESTÁNDAR | COMPLEJA | CRÍTICA}
Plantilla: {plantilla usada o "inicio rápido"}
Agente Recomendado: {nombre del agente del mapeo de plantillas}

Opciones:
  A) Revisar el documento de tarea
  B) Comenzar implementación
  C) Modificar el plan
```

**ESPERAR aprobación explícita del usuario antes de implementar.**

---

## Lista de Validación

- [ ] Número secuencial correcto de 3 dígitos
- [ ] Ubicado en `ai_docs/tasks/`
- [ ] Convención de nombres coincide con el stack del proyecto
- [ ] Sin números de tarea duplicados
- [ ] Nivel de complejidad asignado
- [ ] UN número = UN archivo (regla de documento único)

---

## Reglas

1. **REGLA DE DOCUMENTO ÚNICO**: Un número = un archivo. Las actualizaciones van DENTRO del documento existente.
2. **VERIFICAR ANTES DE CREAR**: Si una tarea activa cubre este trabajo, actualizarla en su lugar.
3. **NUNCA IMPLEMENTAR SIN APROBACIÓN**: Esto solo crea documentos de planificación.
4. **LOS DOCUMENTOS DE TAREA NO SON CÓDIGO**: Escribir descripciones y pasos, no código de implementación.
5. **PRECISIÓN DE FECHAS**: Obtener la fecha actual antes de escribir timestamps.
