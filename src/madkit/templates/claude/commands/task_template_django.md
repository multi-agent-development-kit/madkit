# Plantilla de Tarea de IA para Django

> **Instrucciones:** Esta plantilla te ayuda a crear documentos de tareas del tamaño apropiado para el desarrollo de Django con IA en **proyectos brownfield con deuda técnica**. **Lee PRIMERO la clasificación de complejidad a continuación** para evitar crear documentos innecesariamente verbosos.
>
> **Cabecera de Metadatos opcional (T079):** los task docs pueden incluir cabecera blockquote con `> **Depende de:**`, `> **Asunciones:**` y sub-sección "Wiring esperado" para el flujo `task-planner` Paso 0.6 (waves). Ver documentación completa en [`task_template.md`](task_template.md) §"Cabecera de Metadatos del Task Doc (opcional)" — esta plantilla hereda esa especificación.

---

## CLASIFICACIÓN DE COMPLEJIDAD DE TAREA - LEE ESTO PRIMERO

<!-- AI Agent: Determina la complejidad ANTES de crear el documento de tarea. La mayoría de tareas son SIMPLE. -->

### TAREA SIMPLE (Usa secciones 1,4,10,11 solamente - ~150 líneas)

**Criterios — TODOS deben ser verdaderos:**
- Cambio en una sola vista, serializer, admin o URL
- Sin cambios en modelos (sin nuevas migraciones)
- Sin cambios de permisos/autenticación
- Limitado a 1-2 archivos
- Requisitos claros e inequívocos

**Ejemplos:**
- Agregar un campo a un serializer existente (sin cambio de modelo)
- Corregir un filtro de queryset en una vista
- Actualizar campos de visualización en admin
- Agregar una nueva ruta URL a una vista existente
- Modificar lógica de renderizado de plantillas

### TAREA ESTÁNDAR (Usa secciones 1,3,4,6,8,10,11,15 - ~400 líneas)

**Criterios — CUALQUIERA activa ESTÁNDAR:**
- Cambios en modelos SIN migraciones (ej: agregar opciones Meta, métodos, propiedades)
- Nuevo endpoint de API (vista + serializer + URL)
- Cambios en middleware
- Múltiples archivos afectados (3-5 archivos)
- Cambios en cobertura de tests existente

**Ejemplos:**
- Agregar un nuevo endpoint REST con serializer y tests
- Implementar middleware personalizado para registro de solicitudes
- Agregar métodos de modelo y consultas con manager personalizado
- Refactorizar lógica de vistas en múltiples vistas

### TAREA COMPLEJA (Usa todas las secciones - ~600+ líneas)

**Criterios — CUALQUIERA activa COMPLEJA:**
- Cambios en modelos CON migraciones (nuevos campos, campos alterados, nuevos modelos)
- Cambios en sistema de autenticación/permisos
- Manejadores de señales que afectan múltiples apps
- Migraciones de datos (operaciones RunPython)
- Cambios que afectan más de 5 archivos
- Cambios en claves foráneas o relaciones
- Modificaciones de tareas Celery
- Cambios en invalidación de caché

**Ejemplos:**
- Agregar un nuevo modelo con claves foráneas y migración de datos
- Implementar sistema de permisos personalizado con DRF
- Refactorizar estructura de apps (mover modelos entre apps)
- Implementar pipeline de tareas Celery con lógica de reintento

### TAREA CRÍTICA (Usa todas las secciones + plan de rollback - ~800+ líneas)

**Criterios — CUALQUIERA activa CRÍTICA:**
- Cambios de campo en tablas grandes (>100K filas)
- Cambios de clave foránea en modelos de producción
- Migraciones de datos en datos de producción
- Cambios en backend de autenticación
- Cambios de backend/router de base de datos
- Operaciones multi-base de datos

**Ejemplos:**
- Alterar tipo de campo en una tabla con millones de filas
- Dividir un modelo monolítico en múltiples modelos con migración de datos
- Cambiar backend de autenticación (sesión → JWT)
- Implementar réplicas de lectura de base de datos

---

## ⚠️ CRÍTICO: Protocolo de Creación de Documentos de Tarea

### COMPORTAMIENTO OBLIGATORIO - LEE CUIDADOSAMENTE

**Esta plantilla crea un DOCUMENTO DE PLANIFICACIÓN únicamente. NO implementes cambios directamente.**

---

## 0. Triaje de Ingeniería (OBLIGATORIO ANTES de crear documento)

<!-- AI Agent: Esta fase se ejecuta ANTES de crear el documento de tarea. Para tareas SIMPLE (<=2 archivos), el triaje es mental. Para ESTÁNDAR+, es explícito y se comunica al usuario. -->

**DETENER. No crear documento de tarea sin completar este triaje.**

### T1: Analizar — Examinar el codebase ANTES de planificar

Antes de documentar nada, examinar el proyecto para responder:

**Radio de impacto:**
- ¿Cuántos modelos, vistas, serializers, migraciones, señales y tareas Celery se ven afectados?
- Esto determina la complejidad REAL (no la intuida por la descripción del usuario)

**Prerequisitos:**
- ¿Qué debe existir para que esto funcione? Trazar dependencias hacia atrás (max 2 niveles)
- Marcar cada prerequisito: ✅ existe | ❌ falta (bloqueante)
- Verificar: migraciones pendientes, apps necesarias, DRF configurado, modelos relacionados
- Si hay prerequisitos bloqueantes → son tareas separadas que deben resolverse primero

**Integración:**
- ¿Cómo se conecta con lo existente? ¿Hay patrones de models/views/serializers establecidos?
- ¿Cambio de modelo requiere migración? ¿Se puede resolver sin migración?

**Estado del codebase:**
- ¿Hay migraciones pendientes, deuda técnica, o conflictos que afecten?
- Ejecutar `python manage.py showmigrations --plan | grep "\[ \]"` para detectar migraciones sin aplicar

### T2: Cuestionar — Solo si el análisis revela algo relevante

El agente NO cuestiona por cuota. Cuestiona cuando T1 revela algo que el usuario no ha considerado:

- **Alcance excesivo:** La petición cubre 2+ funcionalidades independientes → proponer desglose en tareas separadas con dependencias claras
- **Enfoque subóptimo:** Existe una solución más simple en el codebase o el framework → proponerla (ej: ¿cambio de modelo o solución sin migración? ¿Custom Manager o queryset filter?)
- **Prerequisitos bloqueantes:** Falta infraestructura o código que son tareas en sí mismos → proponer crearlos primero
- **Viabilidad técnica:** El enfoque pedido tiene problemas técnicos concretos → advertir y proponer alternativa
- **Sobre-diseño:** Se está creando complejidad innecesaria para el caso de uso real → proponer simplificación KISS

**Si no hay nada que cuestionar:** Pasar directo a T3. No fabricar objeciones.

### T3: Alinear — Validar alcance con el usuario antes de documentar

Presentar al usuario un resumen del alcance antes de crear el documento:

```
Alcance: [1-2 frases de qué se va a hacer]
Complejidad: [SIMPLE|ESTÁNDAR|COMPLEJA|CRÍTICA] — basada en ~N archivos, M apps
Prerequisitos: [lista si hay] / Ninguno detectado
Migraciones: [requeridas/no requeridas]
[Solo si hubo negociación en T2] Fuera de alcance: [qué queda fuera y por qué]
[Solo si T2 detectó algo] Observación: [hallazgo relevante]

¿Confirmas para crear el documento de tarea?
```

**Para tareas SIMPLE:** T3 se integra con la presentación final — no hay dos puntos de espera.
**Para ESTÁNDAR+:** T3 es un punto de espera explícito antes de crear el documento.

---

## 0.1. Validación Pre-vuelo (OBLIGATORIO)

**Propósito:** Validar todos los prerequisitos y suposiciones antes de proceder con la creación de tareas. Esto previene fallos debido a herramientas faltantes, permisos o configuraciones.

**REGLA CRÍTICA:** NO procedas al Paso 0.1 si CUALQUIER validación falla. Aborda los fallos primero.

---

### Paso 0.0.1: Validación de Estructura del Proyecto Django

**Información Requerida:**
- Confirmar que es un proyecto Django (no Python genérico)
- Detectar versión de Django y estructura de configuración
- Identificar backend de base de datos y apps instaladas

**Pasos de Validación:**
1. Verificar `manage.py` en la raíz del proyecto
2. Detectar versión de Django: `python manage.py version` o `pip show django | grep Version`
3. Localizar archivo(s) de configuración:
   - Archivo único: `settings.py`
   - Dividido: `settings/base.py`, `settings/development.py`, `settings/production.py`
   - O: patrón de directorio `config/settings/`
4. Verificar `INSTALLED_APPS` para apps del proyecto y paquetes de terceros
5. Detectar backend de base de datos de la configuración `DATABASES`
6. Verificar DRF: `rest_framework` en `INSTALLED_APPS`

**Resultados Esperados:**
- ✅ `manage.py` encontrado en la raíz del proyecto
- ✅ Versión de Django: X.Y.Z (4.2 LTS / 5.0+ / 5.1+)
- ✅ Estructura de Settings: Archivo único / Dividido (base/dev/prod) / Módulo config
- ✅ Backend de Base de Datos: PostgreSQL / MySQL / SQLite
- ✅ DRF Detectado: Sí (versión X.Y) / No
- ✅ Apps del Proyecto: [lista de apps personalizadas]
- ✅ Apps de Terceros: [lista de apps de terceros instaladas]

**Métodos de Detección:**

**Versión y Estructura de Django:**
```bash
# Verificar manage.py
ls manage.py

# Versión de Django
python manage.py version
# O: pip show django | grep Version

# Estructura de settings
ls settings.py
ls settings/ 2>/dev/null
ls config/settings/ 2>/dev/null

# Encontrar todos los archivos de settings
find . -name "settings*.py" -not -path "*/venv/*" -not -path "*/.venv/*"
```

**Detección de Configuración Django:**
```bash
# INSTALLED_APPS
grep -A30 "INSTALLED_APPS" settings.py 2>/dev/null || \
grep -A30 "INSTALLED_APPS" settings/base.py 2>/dev/null || \
grep -A30 "INSTALLED_APPS" config/settings/base.py 2>/dev/null

# Backend de base de datos
grep -A10 "DATABASES" settings.py 2>/dev/null || \
grep -A10 "DATABASES" settings/base.py 2>/dev/null

# Detección de DRF
grep "rest_framework" settings.py 2>/dev/null || \
grep "rest_framework" settings/base.py 2>/dev/null
```

**Compatibilidad de Versiones de Django:**

| Versión Django | Python Requerido | LTS | Características Clave |
|---------------|----------------|-----|----------------------|
| 6.0 | ≥ 3.12 | No | Background tasks nativo, CSP middleware, template partials, email API modernizada |
| 5.2 LTS | ≥ 3.10 | Sí (hasta Abr 2029) | Composite primary keys, auto-imports shell, MySQL utf8mb4 default |
| 5.1 | ≥ 3.10 | No | LoginRequiredMiddleware, GeneratedField |
| 5.0 | ≥ 3.10 | No | Field groups, plantillas simplificadas |
| 4.2 LTS | ≥ 3.8 | **EOL Abr 2026** | Psycopg 3 — migrar a 5.2+ |

**Si la Validación Falla:**
- **`manage.py` no encontrado:**
  - Puede que no sea un proyecto Django → usa `task_template_python.md` en su lugar
  - O `manage.py` puede estar en un subdirectorio → pregunta al usuario la ubicación de la raíz del proyecto

- **Django no instalado:**
  - Instalar: `uv add "django>=5.2"` o `pip install django`
  - Verificar que el entorno virtual está activado

- **Settings no encontrado:**
  - Verificar variable de entorno `DJANGO_SETTINGS_MODULE`
  - Buscar ubicación no estándar de settings
  - Preguntar al usuario: "¿Dónde están ubicados tus settings de Django?"

---

### Paso 0.0.3: Verificación de Salud de Django

**Información Requerida:**
- Estado de migraciones (pendientes vs aplicadas)
- Estado de verificaciones del sistema
- Conectividad de base de datos

**Pasos de Validación:**
1. Ejecutar verificaciones del sistema Django: `python manage.py check`
2. Verificar estado de migraciones: `python manage.py showmigrations --list`
3. Detectar migraciones pendientes: `python manage.py showmigrations --plan | grep "\[ \]"`
4. Probar conectividad de base de datos: `python manage.py dbshell` o verificar configuración `DATABASES`
5. Detectar Celery: Verificar `celery.py` o `CELERY_BROKER_URL` en settings
6. Detectar backend de caché: Verificar `CACHES` en settings
7. Detectar soporte asíncrono: Verificar `asgi.py` o vistas asíncronas

**Resultados Esperados:**
- ✅ Verificaciones del Sistema Django: Sin problemas / [lista de problemas]
- ✅ Estado de Migraciones: Todas aplicadas / [N] migraciones pendientes
- ✅ Base de Datos: Conectada y accesible
- ✅ Celery: Detectado (broker: Redis/RabbitMQ) / No detectado

> **Django 6.0+:** Background Tasks nativo disponible — permite ejecutar código fuera del ciclo request/response SIN Celery. Evaluar si el caso de uso puede resolverse con el framework nativo antes de añadir Celery como dependencia.
- ✅ Backend de Caché: Redis / Memcached / Memoria local / No configurado
- ✅ Soporte Asíncrono: ASGI configurado / Solo WSGI

**Métodos de Detección:**

```bash
# Verificaciones del sistema
python manage.py check
python manage.py check --deploy  # Verificaciones de producción

# Estado de migraciones
python manage.py showmigrations --list 2>/dev/null | head -30
python manage.py showmigrations --plan | grep "\[ \]" | wc -l  # Contar pendientes

# Detección de Celery
ls */celery.py 2>/dev/null
grep "CELERY_BROKER_URL\|BROKER_URL" settings.py 2>/dev/null || \
grep "CELERY_BROKER_URL\|BROKER_URL" settings/base.py 2>/dev/null

# Detección de caché
grep -A5 "CACHES" settings.py 2>/dev/null || \
grep -A5 "CACHES" settings/base.py 2>/dev/null

# Detección asíncrona
ls */asgi.py 2>/dev/null
grep "async def" */views.py 2>/dev/null | head -5
```

**Si la Validación Falla:**
- **Errores en verificaciones del sistema:**
  - Corregir errores críticos antes de proceder
  - Las advertencias pueden documentarse y abordarse en la tarea

- **Migraciones pendientes:**
  - Documentar migraciones pendientes en el documento de tarea
  - Considerar si la tarea depende de aplicar migraciones pendientes primero
  - **NUNCA auto-aplicar migraciones pendientes** — preguntar al usuario primero

- **Problemas de conectividad de base de datos:**
  - Verificar configuración `DATABASES` en settings
  - Verificar que el servidor de base de datos está ejecutándose
  - Verificar credenciales y parámetros de conexión

---

### Paso 0.0.4: Evaluación Brownfield (OBLIGATORIO)

<!-- AI Agent: Esta plantilla asume brownfield. Este paso cuantifica el nivel de deuda técnica. -->

**Información Requerida:**
- Nivel de cobertura de tests existente
- Línea base de calidad de código
- Indicadores conocidos de deuda técnica

**Pasos de Validación:**
1. Verificar cobertura de tests: `python manage.py test --verbosity 2` o `pytest --co -q | wc -l`
2. Contar modelos totales: `grep -r "class.*models.Model" --include="*.py" | wc -l`
3. Contar vistas totales: `grep -r "class.*View\|def.*request" --include="*.py" | wc -l`
4. Verificar archivos de test: `find . -name "test_*.py" -o -name "*_tests.py" | wc -l`
5. Contar migraciones por app: `ls */migrations/*.py | grep -v __init__ | wc -l`
6. Detectar patrones obsoletos:
   - `url()` en lugar de `path()` (Django 2.0+ obsoleto)
   - `render_to_response` en lugar de `render`
   - `django.conf.urls` en lugar de `django.urls`
   - Vistas basadas en funciones sin razón clara
7. Verificar `.env` o gestión de variables de entorno

**Resultados Esperados:**
- ✅ Cantidad de Tests: [N] archivos de test con [M] métodos de test
- ✅ Cantidad de Modelos: [N] modelos en [M] apps
- ✅ Cantidad de Vistas: [N] vistas (CBV: X, FBV: Y)
- ✅ Cantidad de Migraciones: [N] migraciones en [M] apps
- ✅ Patrones Obsoletos: [lista o "Ninguno detectado"]
- ✅ Nivel de Deuda Técnica: Bajo / Medio / Alto / Crítico

**Puntuación de Deuda Técnica:**

| Indicador | Bajo | Medio | Alto | Crítico |
|-----------|-----|--------|------|----------|
| Archivos de test vs cantidad de modelos | >80% | 50-80% | 20-50% | <20% |
| Migraciones pendientes | 0 | 1-3 | 4-10 | >10 |
| Patrones obsoletos | 0 | 1-5 | 6-15 | >15 |
| Candidatos a squash de migraciones | 0-5 | 6-15 | 16-30 | >30 |
| Cantidad de `# TODO`/`# FIXME` | 0-5 | 6-20 | 21-50 | >50 |

**Si la Validación Falla:**
- **Sin tests encontrados:**
  - Documentar como riesgo ALTO — cualquier cambio no está verificado
  - Requerir creación de tests como parte de la tarea
  - Considerar agregar requisito de test a complejidad CRÍTICA

- **Alta cantidad de patrones obsoletos:**
  - Documentar patrones pero NO corregirlos en tareas no relacionadas
  - Crear tarea de limpieza separada si es necesario
  - Enfocarse en la tarea actual

---

---

### ✅ Validación Pre-vuelo Completa

**Lista de Verificación Antes de Proceder al Paso 0.1:**
- [ ] Acceso al sistema de archivos validado (permisos de lectura/escritura)
- [ ] Proyecto Django confirmado (`manage.py` encontrado, versión de Django detectada)
- [ ] Verificación de salud de Django pasada (verificaciones del sistema, estado de migraciones, conectividad de BD)
- [ ] Evaluación brownfield completada (nivel de deuda técnica cuantificado)
- [ ] Entorno Python validado (versión, venv, gestor de paquetes)
- [ ] Estructura de settings identificada (archivo único/dividido/módulo config)
- [ ] Backend de base de datos confirmado (PostgreSQL/MySQL/SQLite)
- [ ] Presencia de DRF detectada (si aplica)

**Si TODAS las verificaciones pasan:** ✅ Proceder al Paso 0.1 (Verificar Estructura del Proyecto)

**Si CUALQUIER verificación falla:** ❌ Abordar el fallo usando la guía anterior antes de proceder

---

<!-- SHARED-BLOCK: protocolo-creacion-v1 -->
### Paso 0.1: Verificar Estructura del Proyecto

**Objetivo:** Confirmar que la estructura de documentación requerida del proyecto existe antes de crear documentos de tarea.

**Información Requerida:**
- Verificar que el directorio `ai_docs/` existe
- Listar subdirectorios dentro de `ai_docs/` (debe incluir `tasks/`)

**Resultados Esperados:**
- Confirmación de estructura de directorios mostrando subdirectorio `tasks/`

**Si no se encuentra:** DETENER y preguntar al usuario: "No veo un directorio `ai_docs/`. ¿Debería crearlo?"

**CONDICIONES DE PARADA:**
- ❌ Si `ai_docs/` NO existe → Preguntar al usuario: "No veo un directorio `ai_docs/`. ¿Debería crearlo?"
- ❌ Si `ai_docs/tasks/` NO existe → Preguntar al usuario: "¿Debería crear el directorio `ai_docs/tasks/`?"
- ✅ Solo proceder si ambos directorios existen

---

### Paso 0.2: Verificar Documento de Tarea Activo

**Antes de crear una nueva tarea, verificar si ya existe una para este trabajo:**

1. Listar archivos en `ai_docs/tasks/` y buscar un documento relacionado con la solicitud actual
2. Si el usuario pide correcciones/revisiones de trabajo anterior → encontrar y ACTUALIZAR ese documento
3. Si el usuario pide continuar implementación → encontrar y ACTUALIZAR ese documento
4. Si el usuario pide una revisión de trabajo completado → encontrar y ACTUALIZAR ese documento
5. **Solo crear un nuevo número de tarea si es trabajo genuinamente NUEVO sin documento de tarea existente**

**Si se encuentra tarea activa:** Saltar al Paso 0.5 (Manejar Retroalimentación del Usuario) y trabajar en el documento existente.

---

### Paso 0.3: Detectar Siguiente Número de Tarea

**Solo si el Paso 0.2 confirmó que no aplica ninguna tarea existente:**

**Instrucciones:**
1. Listar archivos en `ai_docs/tasks/`
2. Extraer el prefijo de 3 dígitos de CADA nombre de archivo
3. Encontrar el número más alto entre TODOS los archivos
4. Sumar 1 y formatear con 3 dígitos
5. Si no existen archivos: usar 001

**Reglas:**
- ✅ Secuencia global compartida (no reiniciar por tipo)
- ✅ Siempre 3 dígitos: 001, 042, 156
- ✅ Cada número se usa EXACTAMENTE UNA VEZ — un número, un archivo
- ❌ El número `000` está RESERVADO para calibración del proyecto — nunca usar para tareas normales

---

### Paso 0.4: Crear Documento de Tarea con Nombres Apropiados

**CRÍTICO: UNA tarea = UN archivo. UN número = UN archivo. Sin excepciones.**

**Convención de Nombres para Proyectos Django/Python:**
- **Formato:** `XXX_snake_case_name.md`
- **Convención:** Minúsculas con guiones bajos (Python PEP 8)
- **Ubicación:** `ai_docs/tasks/XXX_snake_case_name.md`
- **Verificar:** NO exista un archivo con ese prefijo de número

**Estructura del Documento de Tarea:**
1. Completar secciones según clasificación de complejidad (SIMPLE/ESTÁNDAR/COMPLEJA/CRÍTICA)
2. Incluir evaluación de impacto Django
3. Incluir estrategia de rollback para tareas COMPLEJAS y CRÍTICAS
4. Proporcionar ejemplos de código antes/después
5. Definir criterios de éxito claros

---

### Paso 0.5: Presentar Documento de Tarea al Usuario

**NOTA:** El análisis crítico de impacto, prerequisitos y alcance ya se realizó en el Triaje de Ingeniería (Paso 0.0.6). Aquí se presenta el documento ya validado.

**Verificación rápida antes de presentar:**
- ¿El documento refleja el alcance validado en T3? Si no → actualizar.
- ¿La Matriz de Impacto Django reveló algo nuevo? Si sí → comunicar como observación.

**Presentar estas 3 opciones:**

```
Documento de Tarea Creado: `ai_docs/tasks/XXX_snake_case_name.md`

**Resumen del Enfoque Planificado:**
[Breve resumen de 2-3 oraciones de lo que esta tarea logrará]

**Evaluación de Impacto Django:**
- Modelos afectados: [lista]
- Migraciones requeridas: Sí/No
- Estrategia de rollback: [breve descripción]

[Solo si se descubrió algo nuevo:]
**Observaciones y Sugerencias del Asistente:**
Tras analizar la tarea y el codebase, he identificado lo siguiente:

1. **[Categoría]:** [Observación o sugerencia concreta]
2. **[Categoría]:** [Observación o sugerencia concreta]
3. **[Categoría]:** [Observación o sugerencia concreta — si aplica]

> Categorías válidas: Dependencia detectada | Prerequisito | Alternativa de enfoque | Optimización | Riesgo identificado | Ajuste de alcance | Refactorización recomendada

**¿Cómo deseas proceder?**

**A) Vista Previa de Cambios de Código Detallados**
Muéstrame los ejemplos específicos de código antes/después y las modificaciones planificadas.

**B) Aprobar e Iniciar Implementación**
El plan de la tarea se ve bien - comenzar a implementar fase por fase.

**C) Modificar o Iterar sobre el Plan**
Ajustar el enfoque, explorar las sugerencias, o refinar el plan antes de comprometerse.
```

**PUNTO DE ESPERA OBLIGATORIO:**
- DETENERSE aquí y esperar la elección explícita del usuario (A, B o C)
- NO asumir aprobación ni optar por ninguna opción por defecto
- NO iniciar implementación sin respuesta explícita "B" o "Aprobado"

**NOTA SOBRE ITERACIÓN:** La iteración es el proceso normal. Las tareas raramente están perfectas en la primera versión. Si el usuario elige C, actualizar el documento existente, incorporar el feedback, y re-presentar con nuevas sugerencias basadas en la conversación.

---

### Paso 0.6: Manejar Retroalimentación del Usuario y Actualizaciones

**Si el usuario elige Opción C (Modificar) o solicita cambios:**

**Objetivo:** Actualizar el documento de tarea existente con la retroalimentación del usuario sin crear nuevas versiones.

**CRÍTICO:** Actualizar el documento de tarea EXISTENTE - NO crear nuevos archivos como `XXX_nombre_v2.md` o `XXX_nombre_actualizado.md`

---

### Paso 0.7: Actualizaciones de Fase de Implementación

**Cuando el usuario aprueba (Opción B) y la implementación comienza:**

#### Regla de Alcance Estricto (ACTIVA durante toda la implementación)

> OBLIGATORIO: Solo modificar código directamente relacionado con la sección "Incluye".

- Si se descubre un problema FUERA del alcance:
  1. **NO arreglarlo** — documentarlo como nota en "Descubrimientos fuera de alcance" del task document
  2. Si es BLOQUEANTE para la tarea actual: PAUSAR, informar al usuario, esperar decisión
  3. Si NO es bloqueante: ignorarlo completamente
- **Test rápido:** ¿Este cambio está en "Incluye"? → SI: proceder. NO: no tocarlo.
- **Excepción única:** errores de sintaxis/compilación en líneas que YA se están modificando
- **Prohibido:** arreglar warnings, code smells, o deuda técnica encontrada "de paso"

Documentar progreso en el documento de tarea EXISTENTE agregando/actualizando una sección `## Progreso`:

```markdown
## Progreso

### Fase 1: [Nombre] - [Estado: En Progreso / Pending Review / Completo]
- [x] Descripción del paso
- [ ] Descripción del paso

### Fase 2: [Nombre] - [Estado: Pendiente]
- [ ] Descripción del paso

**Estado general de tarea:** [Planificación | En Progreso | Pending Review | Completado | Bloqueado]
```

<!-- /SHARED-BLOCK -->

---

## Matriz de Evaluación de Impacto Django

<!-- AI Agent: Usa esta matriz para CADA tarea para evaluar cambios en cascada -->

**Antes de hacer CUALQUIER cambio, traza el impacto a través de esta cadena de dependencias:**

```
Cambio de Modelo
  ├── ¿Migración requerida?
  │     ├── Migración de esquema (makemigrations)
  │     └── Migración de datos (RunPython)
  ├── ¿Serializers afectados?
  │     ├── Campos agregados/eliminados
  │     └── Cambios de validación
  ├── ¿Vistas afectadas?
  │     ├── Cambios de queryset
  │     └── Cambios de permisos
  ├── ¿Admin afectado?
  │     ├── list_display, list_filter
  │     └── Cambios de inline admin
  ├── ¿Señales afectadas?
  │     └── post_save, pre_save, m2m_changed
  ├── ¿Tareas Celery afectadas?
  │     └── Tareas que consultan este modelo
  ├── ¿Tests afectados?
  │     ├── Tests de modelo
  │     ├── Tests de vista/API
  │     └── Actualizaciones de factory/fixture
  └── ¿Invalidación de caché necesaria?
        └── Querysets cacheados, fragmentos de plantilla
```

**Plantilla de Evaluación de Impacto:**

| Componente | ¿Afectado? | Archivos | Nivel de Riesgo |
|-----------|-----------|-------|------------|
| Modelos | Sí/No | [lista] | Bajo/Med/Alto |
| Migraciones | Sí/No | [lista] | Bajo/Med/Alto |
| Serializers | Sí/No | [lista] | Bajo/Med/Alto |
| Vistas | Sí/No | [lista] | Bajo/Med/Alto |
| Admin | Sí/No | [lista] | Bajo/Med/Alto |
| URLs | Sí/No | [lista] | Bajo/Med/Alto |
| Señales | Sí/No | [lista] | Bajo/Med/Alto |
| Tareas Celery | Sí/No | [lista] | Bajo/Med/Alto |
| Tests | Sí/No | [lista] | Bajo/Med/Alto |
| Caché | Sí/No | [lista] | Bajo/Med/Alto |

---

<!-- SHARED-BLOCK: alternativas-v1 -->
## Análisis de Alternativas de Implementación

**OBLIGATORIO para tareas ESTÁNDAR o superior. Para SIMPLE, documentar brevemente por qué solo hay un enfoque viable.**

> Después de evaluar el impacto con la matriz anterior, explorar MÚLTIPLES enfoques ANTES de comprometerse con uno. En proyectos Django brownfield, las alternativas no son un lujo — son la diferencia entre una migración limpia y un rollback de emergencia.

### Criterio de Activación

Realizar análisis completo si se cumplen 2+ criterios:
- [ ] Cambios de modelo con múltiples estrategias de migración posibles
- [ ] Múltiples patrones Django viables (FBV vs CBV, signals vs override, custom manager vs queryset)
- [ ] Componentes con alta puntuación de deuda técnica (de la evaluación brownfield)
- [ ] Cambios que afectan 3+ apps Django
- [ ] Migraciones de datos involucradas

### Alternativas (Mínimo 2, idealmente 3)

**Alternativa 1: [Nombre descriptivo]**
- **Enfoque**: [Descripción breve — qué patrón Django, qué estrategia de migración]
- **Impacto en Migraciones**: [Cuántas migraciones, tipo: esquema/datos/mixta, reversibilidad]
- **Pros**: [2-3 ventajas concretas]
- **Contras**: [2-3 desventajas concretas]
- **Complejidad**: Baja / Media / Alta
- **Riesgo de Rollback**: [Qué tan difícil es revertir si falla]

**Alternativa 2: [Nombre descriptivo]**
- [Misma estructura]

**Alternativa 3 (si aplica): [Nombre descriptivo]**
- [Misma estructura]

### Matriz de Compromisos

| Factor | Alt 1 | Alt 2 | Alt 3 | Ganador |
|--------|-------|-------|-------|---------|
| **Complejidad de Migración** | B/M/A | B/M/A | B/M/A | [ ] |
| **Riesgo de Datos** | B/M/A | B/M/A | B/M/A | [ ] |
| **Tiempo de Inactividad** | B/M/A | B/M/A | B/M/A | [ ] |
| **Mantenibilidad** | B/M/A | B/M/A | B/M/A | [ ] |
| **Deuda Técnica Generada** | B/M/A | B/M/A | B/M/A | [ ] |

### Decisión y Justificación

**Seleccionado**: Alternativa [X] — [Nombre]

**Justificación**:
1. **Razón Principal**: [Por qué es la mejor opción para ESTE proyecto brownfield]
2. **Compromiso Aceptado**: [Qué se sacrifica y por qué es aceptable]

**Alternativas Rechazadas**:
- Alternativa [Y]: Rechazada porque [razón concreta]

### DECISIÓN DEL USUARIO REQUERIDA

Presentar las alternativas con evaluación de impacto Django. **Esperar aprobación antes de proceder.**

<!-- /SHARED-BLOCK -->

---

<!-- SHARED-BLOCK: edge-cases-v1 -->
## Análisis de Modos de Falla y Casos Extremos

> Antes de diseñar la implementación, analizar sistemáticamente qué puede salir mal. En Django brownfield, los fallos suelen venir de dependencias ocultas que la Matriz de Impacto no capturó.

### Escenarios de Falla

| Componente/Flujo | Escenario de Falla | Impacto | Probabilidad | Mitigación |
|-------------------|-------------------|---------|--------------|------------|
| [Modelo/Migración] | [Qué sale mal] | A/M/B | A/M/B | [Cómo manejar] |
| [Vista/Serializer] | [Qué sale mal] | A/M/B | A/M/B | [Cómo manejar] |
| [Signal/Celery] | [Qué sale mal] | A/M/B | A/M/B | [Cómo manejar] |

### Preguntas Obligatorias de Edge Cases

- [ ] **Migración en tabla grande**: ¿Qué pasa si la tabla tiene >100K filas? ¿Se necesita migración batch?
- [ ] **Datos nulos/vacíos**: ¿Los campos existentes tienen datos nulos que romperán el nuevo código?
- [ ] **Concurrencia**: ¿Qué pasa si dos requests modifican el mismo objeto simultáneamente? ¿Hay race conditions?
- [ ] **Signals en cascada**: ¿Un post_save trigger podría causar una cadena de efectos no deseados?
- [ ] **Cache inválido**: ¿Hay querysets cacheados que mostrarán datos obsoletos tras el cambio?
- [ ] **Celery tasks**: ¿Hay tareas en cola que usan el schema antiguo? ¿Fallarán tras la migración?
- [ ] **Compatibilidad DRF**: ¿Los serializers existentes manejan correctamente los nuevos campos/relaciones?
- [ ] **Permisos**: ¿El cambio afecta permisos existentes? ¿Hay usuarios que perderán acceso?
- [ ] **Fixtures/factories**: ¿Los tests existentes crearán datos válidos con el nuevo schema?

### Fallas Críticas (Alto Impacto + Alta Probabilidad)
- [Listar las que requieren mitigación obligatoria antes de implementar]

### Riesgos Aceptados (Bajo Impacto o Baja Probabilidad)
- [Listar con justificación de por qué se acepta el riesgo]

<!-- /SHARED-BLOCK -->

---

## Protocolo de Seguridad Brownfield

<!-- AI Agent: SIEMPRE sigue este protocolo para proyectos Django brownfield -->

### Verificación Obligatoria de Cobertura de Tests

**Antes de CUALQUIER cambio de código:**

```bash
# Verificar cobertura de tests existente para archivos afectados
python manage.py test <app_name> --verbosity 2
# O con pytest:
pytest <app_name>/tests/ -v --tb=short

# Si no existen tests para el área afectada:
# 1. Documentar esto como un riesgo en el documento de tarea
# 2. Requerir escritura de tests ANTES de hacer cambios
# 3. Los tests deben pasar ANTES y DESPUÉS de los cambios
```

<!-- SHARED-BLOCK: rollback-v1 -->
### Requisito de Estrategia de Rollback

**Cada tarea COMPLEJA o CRÍTICA DEBE incluir un plan de rollback:**

```markdown
## Estrategia de Rollback

### Si la migración falla:
1. `python manage.py migrate <app_name> <número_migración_anterior>`
2. Verificar integridad de datos: [consultas específicas]
3. Eliminar archivo de migración fallido

### Si el cambio de código rompe funcionalidad:
1. `git revert <commit_hash>`
2. Re-ejecutar migraciones si se revirtió migración: `python manage.py migrate`
3. Verificar que todos los tests pasen: `python manage.py test`

### Si la migración de datos corrompe datos:
1. Restaurar desde backup: [procedimiento de backup]
2. Ejecutar migración reversa: `python manage.py migrate <app_name> <anterior>`
3. Verificar datos con: [consultas de validación específicas]
```

<!-- /SHARED-BLOCK -->

### Análisis de Cascada de Dependencias

**Para CADA cambio de modelo, documentar la cascada:**

```bash
# Encontrar todas las referencias al modelo que se está cambiando
grep -r "ModelName" --include="*.py" --exclude-dir=migrations --exclude-dir=venv

# Encontrar todas las importaciones del modelo
grep -r "from.*import.*ModelName\|import.*ModelName" --include="*.py"

# Encontrar serializers que usan este modelo
grep -r "model = ModelName\|ModelName" */serializers.py

# Encontrar vistas que consultan este modelo
grep -r "ModelName.objects\|get_object_or_404(ModelName" --include="*.py"

# Encontrar registros de admin
grep -r "ModelName\|ModelNameAdmin" */admin.py

# Encontrar señales conectadas a este modelo
grep -r "sender=ModelName\|post_save.*ModelName\|pre_save.*ModelName" --include="*.py"
```

---

## Seguridad de Migraciones (OBLIGATORIO para COMPLEJA/CRÍTICA)

```python
# SIEMPRE proporcionar operaciones reversas para migraciones de datos
class Migration(migrations.Migration):
    operations = [
        migrations.RunPython(forward_func, reverse_func),  # Ambas requeridas
    ]

# SIEMPRE usar apps.get_model() en migraciones de datos (no importaciones directas)
def forward_func(apps, schema_editor):
    MyModel = apps.get_model('myapp', 'MyModel')  # Correcto
    # from myapp.models import MyModel  # INCORRECTO - nunca importar directamente

# Para tablas grandes, agregar campos como nullable primero, luego llenar datos,
# luego agregar constraint en migración separada
```

---

## Validación Después de la Implementación

### Verificaciones Post-Implementación Obligatorias

```bash
# 1. Verificaciones del sistema Django
python manage.py check
python manage.py check --deploy  # Verificaciones de producción

# 2. Consistencia de migraciones
python manage.py makemigrations --check --dry-run  # Sin migraciones faltantes

# 3. Ejecutar TODOS los tests (no solo los afectados)
python manage.py test --verbosity 2
# O: pytest -v --tb=short

# 4. Linting
uv run ruff check .
# O: ruff check .

# 5. Verificación de tipos (si usa django-stubs)
uv run mypy .
# O: mypy .

# 6. Verificar consultas N+1 (si django-debug-toolbar disponible)
# Revisar conteo de consultas en el navegador para vistas afectadas
```

### Plantilla de Criterios de Éxito

```markdown
## Criterios de Éxito
- [ ] Todas las verificaciones del sistema Django pasan (`manage.py check`)
- [ ] Sin migraciones faltantes (`makemigrations --check --dry-run`)
- [ ] Todos los tests existentes pasan
- [ ] Nuevos tests agregados para funcionalidad cambiada
- [ ] Sin regresiones de consultas N+1
- [ ] Estrategia de rollback probada (solo COMPLEJA/CRÍTICA)
- [ ] Lista de verificación de revisión de código completada
- [ ] Linting pasa (ruff/flake8)
- [ ] Verificación de tipos pasa (mypy con django-stubs, si está configurado)
```

---

<!-- SHARED-BLOCK: puerta-pre-impl-v1 -->
## PUERTA PRE-IMPLEMENTACIÓN (OBLIGATORIO)

Antes de iniciar cualquier implementación, TODOS los checkboxes deben estar marcados:

- [ ] Triaje de Ingeniería completado — alcance validado con usuario (ESTÁNDAR+)
- [ ] Prerequisitos verificados — todos existen o tienen tarea separada
- [ ] Complejidad clasificada (SIMPLE / ESTÁNDAR / COMPLEJA / CRÍTICA)
- [ ] Pre-flight completado sin errores (Pasos 0.0.1-0.0.5)
- [ ] Evaluación brownfield completada
- [ ] Matriz de impacto Django completada
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
3. **Pre-flight** — Verificar entorno Django (Pasos 0.0.1-0.0.5)
4. **Evaluar impacto** — Matriz de Impacto Django + cascada de dependencias (ESTÁNDAR+)
5. **Documentar** — Crear documento de tarea con alcance validado
6. **Presentar** — Opciones A/B/C
7. **Implementar** — Solo tras aprobación explícita (opción B)

### Opciones de Implementación (presentar siempre)

**A)** Vista Previa de Cambios de Código — fragmentos antes/después
**B)** Proceder con Implementación — fase por fase
**C)** Modificar o Iterar sobre el Plan — ajustar antes de comprometerse

Esperar elección explícita. NUNCA asumir aprobación.

### Durante Implementación

Por cada fase completada:
- Actualizar checkbox del documento de tarea: `[x]` + timestamp + archivos modificados + resultado de verificación (lint/tipos/migraciones)
- Si se descubre que el alcance era incorrecto → DETENER, comunicar, re-planificar
- Esperar "proceder" antes de siguiente fase

Tras todas las fases: cambiar estado a `Pending Review` → ejecutar checklist de revisión → si APROBADO cambiar a `Completado`.

### Checklist de Revisión (SE Principles)

1. **Requisitos**: Todos los criterios de éxito verificables cumplidos
2. **Linting**: `ruff check .` + `mypy .` + `manage.py check` — 0 NUEVOS errores introducidos por los cambios (errores preexistentes fuera de alcance)
3. **Code smells**: En archivos modificados, verificar: sin fat views, N+1, god models, magic strings (ver cleanup-django). Reportar hallazgos; NO corregir fuera del scope sin confirmación.
4. **DRY**: En archivos modificados, verificar que no se duplica lógica existente — querysets repetidos → reportar propuesta Custom Manager, validaciones repetidas → reportar propuesta mixin/service. NO extraer automáticamente.
5. **KISS**: ¿La solución más simple posible? Sin sobre-ingeniería de signals, middleware o mixins innecesarios
6. **SoC**: Views solo orquestación. Lógica de negocio en models/services. Acceso a datos en managers/querysets
7. **Seguridad**: `manage.py check --deploy` sin warnings, sin `@csrf_exempt` injustificado, sin `.raw()` sin parametrizar
   - [ ] CSP configurado: `ContentSecurityPolicyMiddleware` en MIDDLEWARE (Django 6.0+)
8. **Integración**: Listar callers/importers de cada función modificada (todos los que existan, sin mínimo artificial). Verificar dependencias circulares entre apps
9. **Regresión**: Ejecutar tests de módulos afectados por el cambio (`python manage.py test app1 app2 --verbosity 2`). Suite completa solo si el cambio afecta dependencias compartidas (models base, middleware, settings). Verificar con `assertNumQueries` que no hay regresión de queries
10. **Arquitectura**: Migrations reversibles, `makemigrations --check --dry-run` limpio
11. **Baseline de deuda técnica** (ESTÁNDAR+): Documentar TODOs/FIXMEs existentes antes de la tarea. Verificar que la tarea no añade deuda nueva

### Aprobación Explícita

**APROBADO**: "ejecuta", "adelante", "aprobado", "proceder", "se ve bien"
**NO APROBADO**: "interesante", "ya veo", preguntas sobre el plan, silencio
**AMBIGUO**: "ok", "vale", "claro" → confirmar antes de proceder
<!-- /SHARED-BLOCK -->

---

| Stack | Skill Recomendada |
|-------|-------------------|
| Django | `cleanup-django` + `reviewer` |
