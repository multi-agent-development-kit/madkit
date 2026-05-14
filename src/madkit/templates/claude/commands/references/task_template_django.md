# Plantilla de Tarea de IA para Django

> **Instrucciones:** Esta plantilla te ayuda a crear documentos de tareas del tamaño apropiado para el desarrollo de Django con IA en **proyectos brownfield con deuda técnica**. **Lee PRIMERO la clasificación de complejidad a continuación** para evitar crear documentos innecesariamente verbosos.
>
> **Cabecera de Metadatos opcional:** los task docs pueden incluir cabecera blockquote con `> **Depende de:**`, `> **Asunciones:**` y sub-sección "Wiring esperado" para el flujo `task-planner` Paso 0.6 (waves).

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

**T1 — Radio de impacto (delta Django):**

- Unidad de análisis: **modelos, vistas, serializers, migraciones, señales (signals), tareas Celery**.
- Prerequisitos típicos: migraciones pendientes resueltas, apps necesarias instaladas, DRF configurado si aplica, modelos relacionados existentes.
- Integración: patrones models/views/serializers establecidos · ¿cambio requiere migración o se puede resolver sin ella? · Custom Manager vs queryset filter.
- Estado del codebase: ejecutar `python manage.py showmigrations --plan | grep "\[ \]"` para detectar migraciones sin aplicar.

**T3 — añadir línea Django-específica:**

```
Migraciones: [requeridas/no requeridas]
```

**Tabla de complejidad (común a todos los stacks):**

| Radio | Complejidad |
|---|---|
| ≤2 archivos en 1 módulo | SIMPLE |
| 3-6 archivos en 1-2 módulos | ESTÁNDAR |
| 6+ archivos o 3+ módulos (apps) | COMPLEJA |
| Sistemas externos / datos producción / migraciones en tablas grandes | CRÍTICA |

**Punto de espera T3:** SIMPLE → integrado con presentación final. ESTÁNDAR+ → punto de espera explícito.

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

### Pasos 0.1–0.7 — Gestión del documento de tarea

**Delta Django:**

- **Paso 0.4 — Convención de nombres:** `XXX_snake_case_name.md` (PEP 8, minúsculas con guiones bajos). Ubicación: `ai_docs/tasks/XXX_snake_case_name.md`. Estructura del task doc incluye Evaluación de Impacto Django (matriz de la sección siguiente).
- **Paso 0.5 — Presentación al usuario:** ampliar el bloque de presentación con sub-sección "Evaluación de Impacto Django" (Modelos afectados / Migraciones requeridas / Estrategia de rollback) tras el resumen.

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

---

## Casos límite mínimos y modos de falla (obligatorio)

**OBLIGATORIO para todas las complejidades (SIMPLE, ESTÁNDAR, COMPLEJA, CRÍTICA).** La sección debe tener ≥3 entradas concretas con respuesta esperada. plan-checker D8 BLOQUEA si artifact ejecutable nuevo sin la sección o <3 entradas concretas.

### Las 3 preguntas mínimas (responder concretamente)

- **Input vacío / null / no existente:** ¿Qué pasa con campos null/blank, querysets vacíos, fixtures sin datos esperados?
  **Respuesta esperada:** _[validación en model/form, default values, fallback view]_
- **Fallo de dependencia externa:** ¿Qué pasa si una migración tarda demasiado, signal en cascada falla, o Celery task expira?
  **Respuesta esperada:** _[migración batch, transaction.atomic, retry policy]_
- **Estado tras error parcial:** ¿Qué pasa si post_save dispara cadena que falla a mitad? ¿Hay transacciones / rollback?
  **Respuesta esperada:** _[transaction.atomic con savepoints, signals desactivables, rollback explícito]_

Para preguntas adicionales por tipo de artifact, ver **`references/edge-cases-catalog.md`**.

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

### Criterios de Calidad de Ingeniería (canónicos)

> **Obligatorio si la task toca código ejecutable** (.py/archivos bajo `<app>/views.py`, `<app>/models.py`, `<app>/serializers.py`, `<app>/admin.py`, `<app>/signals.py`, `<app>/tasks.py`, `<app>/migrations/`). Para tasks puramente documentales/config sin runtime, declarar excepción literal `Excepción a Criterios de Calidad de Ingeniería: task no toca código ejecutable (solo <docs/config>).` dentro del cuerpo de la sección "Riesgos aceptados", "Decisiones aceptadas" o "Riesgos y mitigaciones".

- [ ] **Cleanup exhaustivo de comentarios:** archivos modificados sin comentarios narrativos del "qué hace el código", sin TODO/FIXME residual sin issue trackeado, sin código comentado. Verificable: `grep -nE "(TODO|FIXME|XXX)" <archivos>` retorna ≤ baseline previo + `ruff check` sin reportar `FIX001`/`TD002`. Comentarios permitidos solo cuando explican el WHY no obvio (constraint, invariant, workaround citado).

- [ ] **Sin dead/legacy code:** sin variables/funciones/imports declarados y nunca referenciados, sin código inalcanzable tras return/raise/break, sin URL routes huérfanas, sin signal receivers desconectados, sin migrations no aplicables. Verificable: `vulture <app>/`, `pyflakes <app>/` o `ruff check --select F401,F841` sin nuevos hallazgos en archivos modificados; `grep -r "<símbolo nuevo>"` confirma ≥1 caller (excepto views referenciadas por `urls.py`).

- [ ] **DRY/KISS/early returns aplicados:** sin bloques de 3+ líneas duplicados (extraer a `<app>/services.py`/`utils.py` o citar duplicación existente), sin custom managers para 1 callsite, sin nesting innecesario donde un early return guard simplifica (validación temprana en views/serializers). Verificable: revisión humana o `reviewer` agent §9, con verdict explícito por archivo modificado.

- [ ] **TDD reutilizando infra existente:** todo código nuevo/modificado tiene test(s) escritos junto al código (no después), reutilizando `TestCase`/`APITestCase`/`pytest` fixtures existentes en `<app>/tests/`, factories de `factory_boy` en `<app>/tests/factories.py`, o `conftest.py` del proyecto. Verificable: archivo `<app>/tests/test_<modulo>.py` existe con import desde la infra de tests + kill-the-mutant pasa (comentar/invertir línea clave del cambio → al menos 1 test relevante falla). En L0 (sin tests configurados), declarar como riesgo aceptado o invocar la skill `testing-setup` antes.

**Defense-in-depth automático:** este bloque es validado por hook `task-doc-validator.js` + plan-checker D10 + reviewer §9 + task-implementation-review §10. El `task-planner` Paso 7.4 lo inyecta automáticamente.

---

## PUERTA PRE-IMPLEMENTACIÓN (OBLIGATORIO)

**Delta Django (añadir checkboxes):**
- `[ ] Evaluación brownfield completada` (cuantifica deuda técnica del codebase legacy).
- `[ ] Matriz de impacto Django completada` (cascada modelo → migración → serializer → vista → admin → señales → Celery → tests → caché).

---

## Instrucciones para el Agente de IA

Ver sección canónica en `task_template.md` §"Instrucciones canónicas para el Agente de IA". Deltas específicos de Django:

- **Triaje brownfield:** verificar migraciones pendientes y signals/post_save antes de planificar cambios en models.
- **ORM N+1 check:** en Checklist Regresión, verificar con `assertNumQueries` que el cambio no introduce queries adicionales.
- **Lint Django:** `ruff check .` + `mypy .` + `manage.py check`; `manage.py check --deploy` para Seguridad.
- **Arquitectura:** migrations reversibles; `makemigrations --check --dry-run` limpio antes de commit.
- **CSP:** `ContentSecurityPolicyMiddleware` en MIDDLEWARE requerido (Django 6.0+); sin `@csrf_exempt` injustificado.

---

## Acciones Prohibidas y Documento Único

---

## Bloque `contract:` (opcional)


---

| Stack | Skill Recomendada |
|-------|-------------------|
| Django | `cleanup-django` + `reviewer` |
