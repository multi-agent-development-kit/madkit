# Setup de Proyecto

> **Propósito:** Análisis profundo de la infraestructura de documentación `ai_docs/` — reconocimiento del stack, inventario y evaluación de calidad de docs core, detección de drift entre documentación y código, y reporte técnico con plan de acción priorizado. **Requiere razonamiento LLM en cada fase.**

> **División mecánico vs analítico (desde madkit v0.1.0):** el bootstrap **mecánico** (crear `ai_docs/{core,tasks,refs}/`, copiar `CLAUDE.md.template`, scaffolding del IDE, hooks opt-in) lo hace el CLI `madkit iniciar` sin LLM. Este slash empieza desde la Fase 0 (Reconocimiento) **asumiendo que esa estructura ya existe**. Si no se ha ejecutado `madkit iniciar` y el proyecto no tiene `ai_docs/`, el slash sigue funcionando en modo standalone (Fase 1 mecánica + Fases 0/2/3/4/5 analíticas) — pero la ruta recomendada es `madkit iniciar` primero.

> **Cuándo usar:** Tras `madkit iniciar` (recomendado), o como reemplazo si prefieres flujo manual. Re-ejecutar si se sospecha que la documentación está desactualizada respecto al código.

> **Flujo recomendado:**
> - **Proyecto nuevo:** `madkit iniciar .` → `setup_project` → template `01_generar_idea_maestra.md` (pipeline 01-08) → `calibrate_templates`
> - **Proyecto existente:** `madkit iniciar .` → `setup_project` → template `00_incorporacion_proyecto.md` (reconocimiento + scope) → templates selectivos según scope → `calibrate_templates`

---

## Fase 0: Reconocimiento del Proyecto

<!-- AI Agent: ANTES de tocar archivos, entender el contexto del proyecto. Leer fuentes de verdad existentes y hacer preguntas al usuario para rellenar vacíos. Esta fase es de LECTURA y DIÁLOGO — no modificar nada todavía. -->

### 0.1 Lectura de Fuentes de Verdad

```bash
# 1. Instrucciones del proyecto (fuente primaria de convenciones y restricciones)
cat CLAUDE.md 2>/dev/null || echo "NO ENCONTRADO: CLAUDE.md"
cat .cursorrules 2>/dev/null || echo "NO ENCONTRADO: .cursorrules"

# 2. Estructura del proyecto (entender la topología del repositorio)
ls -la 2>/dev/null
ls src/ app/ lib/ 2>/dev/null

# 3. Manifiestos de dependencias (detectar stack y versiones)
cat pyproject.toml 2>/dev/null | head -60
cat package.json 2>/dev/null | head -60
cat composer.json 2>/dev/null | head -30
cat Cargo.toml 2>/dev/null | head -30
cat go.mod 2>/dev/null | head -15
cat Gemfile 2>/dev/null | head -20
cat pubspec.yaml 2>/dev/null | head -20
ls *.csproj *.sln 2>/dev/null
ls build.gradle build.gradle.kts pom.xml 2>/dev/null

# 4. Lockfiles (confirmar gestor de paquetes activo)
ls uv.lock poetry.lock Pipfile.lock pnpm-lock.yaml yarn.lock package-lock.json bun.lockb composer.lock Cargo.lock Gemfile.lock 2>/dev/null

# 5. Contenedores y CI/CD
ls Dockerfile docker-compose.yml docker-compose.yaml 2>/dev/null
ls -d .github/workflows/ .gitlab-ci.yml Jenkinsfile .circleci/ bitbucket-pipelines.yml 2>/dev/null

# 6. Estado actual de ai_docs/ (si existe)
find ai_docs/ -type f -name "*.md" 2>/dev/null | head -30
find ai_docs/ -type d 2>/dev/null
```

**Construir Perfil Técnico del Proyecto:**
- **Nombre del proyecto:** [extraer de manifesto o CLAUDE.md]
- **Lenguaje principal:** [Python X.Y / TypeScript X.Y / PHP X.Y / Go / Rust]
- **Framework:** [Django X.Y / Next.js X.Y / Laravel X.Y / FastAPI / etc.]
- **Base de datos:** [PostgreSQL / MySQL / SQLite / MongoDB / etc.]
- **Gestor de paquetes:** [uv / pip / poetry / npm / pnpm / yarn / bun / composer]
- **Tipo de proyecto:** [Aplicación web / API / CLI / Librería / Agente ADK / Monorepo]
- **Madurez:** [Nuevo (sin commits) / Temprano (<50 commits) / Maduro (50+ commits)]

### 0.2 Análisis de Historial y Madurez

```bash
# Antigüedad y actividad del repositorio
git log --oneline --reverse | head -3  # Primeros commits
git log --oneline -10                  # Commits recientes
git rev-list --count HEAD 2>/dev/null  # Total de commits

# Áreas de enfoque reciente (últimos 30 días)
git log --oneline --since="30 days ago" --name-only --pretty=format: 2>/dev/null | sort | uniq -c | sort -rn | head -10

# Contribuidores activos
git shortlog -sn --since="60 days ago" 2>/dev/null | head -5

# Ramas activas (trabajo en progreso)
git branch -a --sort=-committerdate 2>/dev/null | head -10
```

### 0.3 Entrevista de Contexto al Usuario

<!-- AI Agent: Formular estas preguntas al usuario SOLO si no se pudieron responder con la lectura de fuentes. Agrupar todas las preguntas pendientes en un solo bloque. La pregunta 6 es OBLIGATORIA siempre. -->

**Preguntas según vacíos detectados:**

1. **Si no existe CLAUDE.md ni documentación clara:**
   > "¿Cuál es el propósito principal de este proyecto y qué problema resuelve?"

2. **Si no se detecta stack con certeza (ej. monorepo, proyecto mixto):**
   > "Veo [indicadores]. ¿Cuál es el stack principal? ¿Hay componentes secundarios que deba considerar?"

3. **Si existe `ai_docs/` con contenido legacy:**
   > "Encontré documentación existente en `ai_docs/`. ¿Está actualizada o necesita revisión? ¿Hay algún documento que consideres obsoleto?"

4. **Si el proyecto tiene complejidad de dominio no evidente:**
   > "¿Hay conceptos de dominio específicos (bounded contexts, aggregates, workflows de negocio) que deba entender para evaluar la documentación?"

5. **Si hay múltiples entornos o deploys:**
   > "¿Cuántos entornos tiene el proyecto (dev/staging/prod)? ¿Hay infraestructura como código (Terraform, Docker Compose, etc.)?"

6. **Para determinar el pipeline correcto (preguntar siempre):**
   > "¿Vas a crear un proyecto nuevo desde cero, o te incorporas a un proyecto existente con un scope de trabajo específico?"

**Registrar respuestas como contexto para las siguientes fases. La respuesta a la pregunta 6 determina qué template core recomendar en FASE 5.**

---

## Fase 1: Migración Legacy y Estructura

<!-- AI Agent: Migrar carpetas de versiones anteriores del framework. TODAS las operaciones son idempotentes — si ya están migradas, no hacer nada. Registrar CADA acción en una lista para el reporte final. -->

### 1.1 Migración de Carpetas Legacy

```bash
# Detectar carpetas legacy vs actuales
ls -d ai_docs/prep/ 2>/dev/null && echo "LEGACY: prep/"
ls -d ai_docs/prep_templates/ 2>/dev/null && echo "LEGACY: prep_templates/"
ls -d ai_docs/core/ 2>/dev/null && echo "ACTUAL: core/"
ls -d ai_docs/core_templates/ 2>/dev/null && echo "ACTUAL: core_templates/"
ls -d ai_docs/tasks/ 2>/dev/null && echo "ACTUAL: tasks/"
ls -d ai_docs/refs/ 2>/dev/null && echo "ACTUAL: refs/"
ls -d ai_docs/dev_templates/ 2>/dev/null && echo "ACTUAL: dev_templates/"
```

**Reglas de migración:**

| Condición | Acción |
|-----------|--------|
| `prep/` existe, `core/` NO existe | `mv ai_docs/prep/ ai_docs/core/` — Registrar: "Migrado prep/ → core/" |
| `prep/` existe, `core/` TAMBIÉN existe | **DETENER** — Preguntar al usuario: "Existen ambas carpetas. ¿Mergear contenido de prep/ en core/? ¿O descartar prep/?" |
| `prep_templates/` existe, `core_templates/` NO existe | `mv ai_docs/prep_templates/ ai_docs/core_templates/` — Registrar: "Migrado prep_templates/ → core_templates/" |
| `prep_templates/` existe, `core_templates/` TAMBIÉN existe | **DETENER** — Preguntar al usuario |
| Ninguna carpeta legacy detectada | Registrar: "Sin migraciones legacy necesarias" |

### 1.2 Garantizar Estructura de Directorios

```bash
# Crear estructura canónica (mkdir -p es idempotente)
mkdir -p ai_docs/core
mkdir -p ai_docs/core_templates
mkdir -p ai_docs/tasks
mkdir -p ai_docs/refs
```

**Para cada directorio:** Registrar si fue creado (nuevo) o ya existía (verificado).

### 1.3 Verificar Protección de .gitignore

```bash
# Verificación estricta: ai_docs/ debe estar en .gitignore
grep -n "ai_docs" .gitignore 2>/dev/null
```

**Validar:**
- [ ] Existe `.gitignore` en la raíz del proyecto
- [ ] Contiene una entrada que cubra `ai_docs/` (puede ser `ai_docs/`, `ai_docs`, o un patrón glob que lo incluya)

**Si falta:** Agregar `ai_docs/` al final de `.gitignore`. Si no existe `.gitignore`, **preguntar al usuario** antes de crearlo.

### 1.4 Detectar Otras Carpetas Legacy o Huérfanas

```bash
# Buscar carpetas no estándar dentro de ai_docs/
find ai_docs/ -maxdepth 1 -type d 2>/dev/null | sort
```

**Carpetas estándar esperadas:** `core/`, `core_templates/`, `tasks/`, `refs/`, `dev_templates/`

Si se detectan carpetas no estándar (ej. `ai_docs/old/`, `ai_docs/backup/`, `ai_docs/archive/`):
- Listar contenido brevemente
- Preguntar al usuario si deben migrarse, conservarse o eliminarse

### 1.5 Verificar / Generar CLAUDE.md Base

<!-- AI Agent: Garantizar que el proyecto tiene un CLAUDE.md con guidance transversal (estilo de respuesta, asignación de modelo, delegación a subagentes). Si falta, ofrecer generarlo desde el template del framework. -->

```bash
# Detectar CLAUDE.md existente
ls CLAUDE.md 2>/dev/null

# Detectar template base del framework (desplegado junto con las plantillas)
ls .claude/CLAUDE.md.template 2>/dev/null || ls claude-templates/CLAUDE.md.template 2>/dev/null
```

**Reglas:**

| Condición | Acción |
|---|---|
| `CLAUDE.md` existe + tiene secciones "Estilo de respuesta", "Modelo por perfil de trabajo", "Cuándo delegar a subagentes" | Registrar: "CLAUDE.md presente y completo" — no hacer nada |
| `CLAUDE.md` existe pero faltan secciones del template | **Preguntar al usuario** antes de mergear. Proponer añadir las secciones faltantes sin tocar el resto |
| `CLAUDE.md` NO existe + template disponible | Copiar `CLAUDE.md.template` → `CLAUDE.md`. Los placeholders `[entre corchetes]` se rellenan en Fase 3.3 de `/calibrate_templates`. Registrar: "CLAUDE.md generado desde template — placeholders pendientes de calibración" |
| `CLAUDE.md` NO existe + template NO disponible | Registrar: "CLAUDE.md faltante y template no disponible — recomendar redesplegar plantillas" |

**Regla crítica:** NUNCA sobrescribir un `CLAUDE.md` existente sin confirmación del usuario — puede contener reglas del proyecto que el template genérico no cubre.

### 1.6 Hooks deployables (opt-in)

<!-- AI Agent: Ofrecer instalación de hooks opcionales del framework. Cero por defecto — el usuario elige. Ver claude-templates/hooks/README.md para inventario completo. -->

```bash
# Detectar disponibilidad de los hooks en el repo upstream
ls claude-templates/hooks/ 2>/dev/null
```

**Si los hooks están disponibles, preguntar al usuario:**

```
¿Instalar hooks deployables? (ver `claude-templates/hooks/README.md`)
  [a] Sí, todos (context-monitor + prompt-guard + scaffolding-guard + task-doc-validator + session-state) — loop completo de continuidad
  [b] Solo planning (task-doc-validator + scaffolding-guard) — refuerza calidad de task docs y commits
  [c] Solo seguridad (prompt-guard + scaffolding-guard)
  [d] Solo visibilidad y continuidad (context-monitor + session-state) — escribe + lee STATE.md
  [e] No, configurar manualmente luego
  [f] Solo session-state (T081) — útil si ya tienes context-monitor activo y quieres cerrar el loop
Por defecto: [e]
```

**Acciones según elección:**

| Opción | Hooks copiados | Flags activadas en `.claude/hooks/config.json` |
|---|---|---|
| a | los 5 | `context_monitor: true`, `prompt_guard.mode: "advisory"`, `scaffolding_guard: true`, `task_doc_validator: true`, `session_state: true` |
| b | task-doc-validator + scaffolding-guard | `task_doc_validator: true`, `scaffolding_guard: true` |
| c | prompt-guard + scaffolding-guard | `prompt_guard.mode: "advisory"`, `scaffolding_guard: true` |
| d | context-monitor + session-state | `context_monitor: true`, `session_state: true` |
| e | ninguno | (no se crea config.json) |
| f | session-state | `session_state: true` |

**Si el usuario elige a/b/c/d/f:**

```bash
# Crear directorio destino
mkdir -p .claude/hooks

# Copiar hooks elegidos (ejemplo opción a — todos)
cp claude-templates/hooks/context-monitor.js .claude/hooks/
cp claude-templates/hooks/prompt-guard.js .claude/hooks/
cp claude-templates/hooks/scaffolding-guard.sh .claude/hooks/
cp claude-templates/hooks/scaffolding-guard.ps1 .claude/hooks/
cp claude-templates/hooks/task-doc-validator.js .claude/hooks/
cp claude-templates/hooks/session-state.sh .claude/hooks/
cp claude-templates/hooks/session-state.ps1 .claude/hooks/

# Generar config.json desde el example
cp claude-templates/hooks/config.example.json .claude/hooks/config.json
# Editar config.json para activar solo las flags correspondientes a la opción
```

**Editar `.claude/settings.json`** del proyecto destino para registrar los triggers de los hooks copiados. Ver `claude-templates/hooks/README.md` §"Instalación manual" para el formato JSON exacto. Si `.claude/settings.json` no existe, crearlo con el bloque `hooks` mínimo.

**Documentar en el reporte final:**
- Hooks instalados (lista de archivos copiados)
- Opción elegida (a/b/c/d/e)
- Flag para troubleshooting: si un hook tarda más de su timeout duro, exit silencioso (no rompe flujo del agent)

**Regla:** los hooks NO cuentan como templates. El conteo total de templates del framework no cambia tras instalarlos.

---

## Fase 2: Inventario y Evaluación de Documentación Core

<!-- AI Agent: Análisis exhaustivo de CADA documento en ai_docs/core/. LEER el contenido real de cada archivo — no limitarse a verificar existencia. Evaluar calidad con criterios objetivos. -->

### 2.1 Catálogo de Documentos Esperados

**Documentos core clasificados por criticidad:**

| Prioridad | Documento | Propósito en la Ingeniería del Software | Dependencias |
|-----------|-----------|------------------------------------------|--------------|
| **P0 — Esencial** | `master_idea.md` | Visión de producto, contexto del proyecto (greenfield/existente), problema, usuarios, modelo de negocio, funcionalidades MVP, scope negativo, restricciones (equipo, presupuesto, timeline), user stories. Documento fundacional. | Ninguna. Generado por `01_generar_idea_maestra.md` (greenfield) o `00_incorporacion_proyecto.md` (existente) |
| **P0 — Esencial** | `initial_data_schema.md` | Modelo de datos estratégico: entidades, relaciones, mapeo feature-to-data, decisiones de schema. | `master_idea.md`, `app_pages_and_functionality.md`. Generado por `06_generar_modelos_datos.md` |
| **P1 — Recomendado** | `app_pages_and_functionality.md` | Blueprint de páginas, funcionalidad por página, navegación, stack detectado, checkpoint MVP. | `master_idea.md`. Generado por `04_generar_paginas_funcionalidad.md` |
| **P1 — Recomendado** | `system_architecture.md` | Arquitectura técnica: diagrama Mermaid, estructura de rutas, patrones backend, seguridad, deployment, riesgos. | `master_idea.md`, `app_pages_and_functionality.md`. Generado por `07_generar_diseno_sistema.md` |
| **P1 — Recomendado** | `wireframe.md` | Mockups ASCII, estados de componentes (loading/empty/error), responsive, mapa de flujo de navegación. | `app_pages_and_functionality.md`. Generado por `05_generar_wireframe.md` |
| **P1 — Recomendado** | `roadmap.md` | Roadmap de implementación feature-first con fases secuenciales, análisis de dependencias y autocrítica. | Todos los anteriores. Generado por `08_generar_roadmap.md` (o variantes ADK/RAG) |
| **P2 — Opcional** | `ui_theme.md` | Paleta de color estratégica: psicología del color, 4 esquemas evaluados, tokens HSL para light/dark mode. | `master_idea.md`, `app_name.md`. Generado por `03_generar_tema_ui.md` |
| **P2 — Opcional** | `app_name.md` | Naming y branding: análisis competitivo, estrategia de dominio, recomendaciones con razonamiento. | `master_idea.md`. Generado por `02_generar_nombre_app.md` |
| **P2 — Contextual** | `scope_and_dependencies.md` | Solo para proyectos existentes: reconocimiento del codebase, análisis git, dependencias del scope, riesgos, plan de rollback. | Generado por `00_incorporacion_proyecto.md` |

### 2.2 Evaluación de Calidad por Documento

<!-- AI Agent: Para CADA documento que exista en ai_docs/core/, leer su contenido completo y evaluar con estos criterios objetivos. -->

**Para cada documento existente, ejecutar:**

```bash
# Leer contenido completo del documento
cat ai_docs/core/[nombre_documento].md 2>/dev/null

# Métricas básicas de contenido
wc -l ai_docs/core/[nombre_documento].md 2>/dev/null    # líneas totales
wc -w ai_docs/core/[nombre_documento].md 2>/dev/null    # palabras totales
grep -c "^#" ai_docs/core/[nombre_documento].md 2>/dev/null   # secciones (headings)
grep -c "TODO\|TBD\|PENDIENTE\|PLACEHOLDER\|\[.*\]" ai_docs/core/[nombre_documento].md 2>/dev/null  # placeholders pendientes
```

**Criterios de evaluación:**

| Criterio | ✅ Completo | ⚠️ Incompleto | ❌ Placeholder |
|----------|-------------|---------------|----------------|
| **Extensión** | >50 líneas con contenido sustantivo | 10-50 líneas, secciones vacías | <10 líneas o solo headers |
| **Especificidad** | Nombres reales de entidades, rutas, componentes | Mezcla de genéricos y específicos | Solo texto genérico/copiado |
| **Coherencia interna** | Secciones referenciadas entre sí | Secciones independientes sin conexión | Estructura sin contenido real |
| **Placeholders** | 0 marcadores pendientes | 1-3 marcadores en secciones menores | >3 marcadores o en secciones críticas |
| **Vigencia** | Refleja el estado actual del código | Parcialmente desactualizado | No coincide con el código actual |
| **Secciones clave (master_idea)** | Tiene: Contexto del Proyecto, Restricciones, Fuera de Scope, User Stories | Faltan 1-2 secciones | Solo tiene estructura básica (pre-actualización) |

**Construir tabla de estado:**

```
Documento                      | Estado | Líneas | Placeholders | Vigencia      | Acción
-------------------------------|--------|--------|--------------|---------------|--------
master_idea.md                 | ✅/⚠️/❌ | N    | N            | Actual/Desact | Ninguna/Actualizar/Generar
initial_data_schema.md         | ✅/⚠️/❌ | N    | N            | Actual/Desact | Ninguna/Actualizar/Generar
...                            |        |        |              |               |
```

### 2.3 Verificación de Coherencia entre Documentos

<!-- AI Agent: Los documentos no son independientes — forman una cadena de dependencias. Verificar que la información es consistente entre ellos. -->

**Verificaciones de coherencia (solo si existen ambos documentos):**

1. **`master_idea.md` ↔ `app_pages_and_functionality.md`:** ¿Los tipos de usuario y funcionalidades MVP son consistentes entre ambos documentos?
2. **`master_idea.md` ↔ `initial_data_schema.md`:** ¿Las entidades del schema cubren todas las funcionalidades del MVP? ¿El modelo de negocio está reflejado en campos de billing/suscripción?
3. **`app_pages_and_functionality.md` ↔ `system_architecture.md`:** ¿El stack detectado es consistente? ¿Cada página tiene rutas definidas en la arquitectura? ¿La arquitectura respeta las restricciones de presupuesto e infraestructura del master_idea?
4. **`initial_data_schema.md` ↔ `system_architecture.md`:** ¿La arquitectura soporta el modelo de datos (ORM, tipo de BBDD)?
5. **`master_idea.md` "Restricciones" ↔ todos los documentos:** ¿Las restricciones de presupuesto/equipo/infra se respetan en las decisiones de arquitectura, schema y roadmap?

**Registrar inconsistencias encontradas para el reporte.**

### 2.4 Verificar Disponibilidad de Plantillas Generativas

```bash
# Comprobar si existen core_templates para generar documentos faltantes
ls ai_docs/core_templates/ 2>/dev/null
```

**Core templates disponibles (pipeline completo):**
- `00_incorporacion_proyecto.md` — Para proyectos existentes: reconocimiento, scope, dependencias, riesgos → genera `master_idea.md` + `scope_and_dependencies.md`
- `01_generar_idea_maestra.md` — Para proyectos nuevos: visión, problema, usuarios, MVP, restricciones → genera `master_idea.md`
- `02_generar_nombre_app.md` — Naming estratégico con investigación de mercado → genera `app_name.md`
- `03_generar_tema_ui.md` — Paleta de color con psicología industrial → genera `ui_theme.md`
- `04_generar_paginas_funcionalidad.md` — Blueprint de páginas y funcionalidad → genera `app_pages_and_functionality.md`
- `05_generar_wireframe.md` — Mockups ASCII y estados de componentes → genera `wireframe.md`
- `06_generar_modelos_datos.md` — Estrategia de base de datos → genera `initial_data_schema.md`
- `07_generar_diseno_sistema.md` — Arquitectura, rutas, seguridad, deployment → genera `system_architecture.md`
- `08_generar_roadmap.md` — Roadmap feature-first → genera `roadmap.md` (variantes: `08a` ADK, `08b` RAG)

**Si hay documentos P0 faltantes Y existen core_templates:**
- **Proyecto nuevo:** Recomendar empezar por `01_generar_idea_maestra.md` y seguir el pipeline en orden
- **Proyecto existente:** Recomendar empezar por `00_incorporacion_proyecto.md` que genera master_idea compatible y recomienda qué templates adicionales ejecutar según el scope
- Indicar la ruta exacta: `ai_docs/core_templates/[nombre_template].md`

### 2.5 Verificación Cruzada con el Código

<!-- AI Agent: Comparar la documentación con el estado real del código para detectar drift. -->

```bash
# Detectar modelos/entidades reales del proyecto
grep -rn "class.*Model\|class.*Schema\|model\|schema\|entity" --include="*.py" --include="*.ts" --include="*.tsx" --include="*.php" --include="*.rb" --include="*.go" --include="*.rs" --include="*.java" --include="*.kt" --include="*.cs" -l 2>/dev/null | head -10
find . -path "*/models.py" -o -path "*/models/*.py" -o -path "*/schema.ts" -o -path "*/schema.prisma" -o -path "*/drizzle/schema*" -o -path "*/Models/*.php" -o -path "*/entities/*.go" -o -path "*/models/*.rb" 2>/dev/null | grep -v "node_modules\|venv\|\.venv\|vendor" | head -10

# Detectar rutas/endpoints reales
find . -path "*/urls.py" -o -path "*/routes.ts" -o -path "*/routes.tsx" -o -path "*/app/api/*" -o -path "*/pages/api/*" -o -path "*/routes/*.php" -o -path "*/controllers/*.go" -o -path "*/Controllers/*.php" -o -path "*/routes.rb" 2>/dev/null | grep -v "node_modules\|venv\|\.venv\|vendor" | head -10

# Detectar migraciones (estado del schema real)
find . -path "*/migrations/0*.py" -not -path "*/venv/*" 2>/dev/null | wc -l
ls drizzle/migrations/ 2>/dev/null | wc -l
```

**Si `initial_data_schema.md` existe:** Comparar entidades documentadas vs entidades en código.
**Si hay drift significativo:** Marcar documento como "Desactualizado — requiere reconciliación" en el reporte.

---

## Fase 3: Evaluación de Documentación de Referencia

<!-- AI Agent: Evaluar ai_docs/refs/ — documentación externa de referencia que complementa al proyecto. -->

### 3.1 Inventario de Referencias

```bash
# Estructura de refs/
find ai_docs/refs/ -maxdepth 2 -type d 2>/dev/null
find ai_docs/refs/ -type f -name "*.md" 2>/dev/null | wc -l
find ai_docs/refs/ -type f 2>/dev/null | wc -l
```

**Evaluar:**
- [ ] ¿Existen carpetas de referencia relevantes al stack detectado?
- [ ] ¿La documentación de referencia coincide con las versiones del stack en uso?
- [ ] ¿Hay referencias a SDKs o APIs que el proyecto consume?

### 3.2 Recomendaciones de Referencia por Stack

| Stack Detectado | Referencia Recomendada | Ruta Esperada |
|-----------------|------------------------|---------------|
| Google ADK | Documentación del SDK ADK | `ai_docs/refs/adk-python/` o `ai_docs/refs/adk-docs/` |
| Google ADK | Proyecto ADK de ejemplo | `ai_docs/refs/adk-agent-saas/` |
| LLM-agnostic | Framework de templates universal | `ai_docs/refs/agentic-engineering-framework/` |
| Django | Documentación de modelos o DRF | `ai_docs/refs/django-docs/` |
| Next.js | Documentación de App Router o API | `ai_docs/refs/nextjs-docs/` |
| API externa | Referencia del proveedor | `ai_docs/refs/[proveedor]-api/` |

---

## Fase 4: Setup ADK (Condicional)

<!-- AI Agent: Esta fase SOLO se ejecuta si se detecta un proyecto ADK en Fase 0. Si no es ADK, saltar a FASE 5. La detección debe ser positiva en AL MENOS 2 indicadores para activar esta fase. -->

### 4.1 Confirmar Stack ADK

```bash
# Indicador 1: Archivos de agente
find . -name "agent.py" -not -path "*/venv/*" -not -path "*/.venv/*" -not -path "*/node_modules/*" 2>/dev/null

# Indicador 2: Dependencia en manifesto
grep -E "google-adk|google-genai|google\.adk" pyproject.toml requirements*.txt setup.py setup.cfg 2>/dev/null | head -5

# Indicador 3: SDK instalado
pip show google-adk 2>/dev/null | grep -E "Name|Version"
python -c "from google.adk.agents import LlmAgent; print('ADK SDK OK')" 2>/dev/null

# Indicador 4: Entrypoint de agente
find . -name "__init__.py" -exec grep -l "root_agent" {} \; 2>/dev/null | head -5
```

**Regla de activación:** Mínimo 2 de 4 indicadores positivos para proceder. Si solo 1 es positivo, preguntar al usuario: "Detecté [indicador]. ¿Este proyecto usa Google ADK?"

### 4.2 Inventario de Agentes ADK

```bash
# Listar todos los archivos de agente
find . -name "agent.py" -not -path "*/venv/*" -not -path "*/.venv/*" 2>/dev/null

# Estructura de sub-agentes
find . -path "*/sub_agents/*" -name "*.py" -not -path "*/venv/*" 2>/dev/null | head -15

# Herramientas (tools)
find . -path "*/tools/*" -name "*.py" -not -path "*/venv/*" 2>/dev/null | head -15

# Detectar modelo configurado
grep -rn "model=" --include="*.py" 2>/dev/null | grep -i "gemini\|claude\|gpt" | head -5
```

### 4.3 Verificar Documentos de Diseño ADK

```bash
# Documentos de diseño (generados por /adk_orchestrator_template)
ls ai_docs/tasks/*DESIGN*.md ai_docs/tasks/*design*.md 2>/dev/null
```

**Evaluar cobertura:**
- [ ] ¿Existe al menos un documento `DESIGN_*.md` por cada agente principal?
- [ ] ¿Los documentos de diseño reflejan la arquitectura actual (sub-agentes, tools, modelo)?

### 4.4 Verificar Documentación de Referencia ADK

```bash
# Docs de referencia del SDK
ls -d ai_docs/refs/adk-python/ ai_docs/refs/adk-docs/ 2>/dev/null
find ai_docs/refs/ -path "*adk*" -type f 2>/dev/null | wc -l
```

**Recomendaciones ADK:**
- Si faltan documentos de diseño → "Ejecutar `/adk_orchestrator_template` para cada agente principal"
- Si falta documentación de referencia → "Copiar documentación del SDK a `ai_docs/refs/adk-python/`"
- Si hay agentes sin cobertura de diseño → Listar específicamente cuáles

---

## Fase 5: Resumen y Plan de Acción

<!-- AI Agent: Consolidar TODOS los hallazgos en un reporte técnico estructurado. El reporte debe ser accionable — cada item debe indicar QUÉ hacer y CON QUÉ herramienta. -->

### 5.1 Generar Reporte Técnico

**Salida:** `ai_docs/core/setup_report.md`

```markdown
# Reporte de Setup del Proyecto
<!-- Auto-generado por setup_project el [FECHA ISO] -->
<!-- Re-ejecutar setup_project si la documentación core cambia significativamente -->

## Perfil del Proyecto

- **Nombre:** [nombre]
- **Stack:** [lenguaje + framework + versiones]
- **Base de datos:** [tipo + versión si disponible]
- **Gestor de paquetes:** [nombre]
- **Tipo:** [aplicación web / API / agente ADK / etc.]
- **Madurez:** [N commits, primer commit: FECHA, último commit: FECHA]
- **Contribuidores activos:** [N en últimos 60 días]

## Acciones de Migración Realizadas

| # | Acción | Resultado |
|---|--------|-----------|
| 1 | [descripción concreta] | ✅ Completado / ⚠️ Requiere atención / ⏭️ No necesario |
| ... | ... | ... |

## Inventario de Documentación Core

| Documento | Prioridad | Estado | Líneas | Placeholders | Vigencia | Acción Requerida |
|-----------|-----------|--------|--------|--------------|----------|------------------|
| master_idea.md | P0 | ✅/⚠️/❌ | N | N | Actual/Desact | Ninguna/Actualizar/Generar con `01_generar_idea_maestra.md` (nuevo) o `00_incorporacion_proyecto.md` (existente) |
| initial_data_schema.md | P0 | ✅/⚠️/❌ | N | N | Actual/Desact | Ninguna/Actualizar/Generar con `06_generar_modelos_datos.md` |
| app_pages_and_functionality.md | P1 | ✅/⚠️/❌ | N | N | Actual/Desact | Ninguna/Generar con `04_generar_paginas_funcionalidad.md` |
| system_architecture.md | P1 | ✅/⚠️/❌ | N | N | Actual/Desact | Ninguna/Generar con `07_generar_diseno_sistema.md` |
| ... | ... | ... | ... | ... | ... | ... |

### Inconsistencias Detectadas entre Documentos
- [lista de inconsistencias o "Ninguna detectada"]

### Drift Documentación ↔ Código
- [entidades/rutas en código pero no documentadas, o vice versa]

## Documentación de Referencia (refs/)

| Carpeta | Contenido | Archivos | Relevancia |
|---------|-----------|----------|------------|
| [carpeta] | [descripción breve] | N | ✅ Relevante / ⚠️ Desactualizada / ❓ Revisar |

## Estado ADK (si aplica)

- **Agentes detectados:** [lista con rutas]
- **Documentos de diseño:** [N existentes de M agentes]
- **SDK version:** [versión]
- **Cobertura de diseño:** [porcentaje aproximado]
- **Referencia ADK local:** [disponible/falta]

## Estructura Final de ai_docs/

```
ai_docs/
├── core/               [N archivos]
├── core_templates/     [N archivos]
├── tasks/              [N tareas]
├── refs/               [N archivos en M carpetas]
└── dev_templates/      [N archivos] (si existe)
```

## Plan de Acción Priorizado

### Inmediato (bloquean el trabajo efectivo)

**Si es proyecto NUEVO (greenfield):**
1. **[P0]** Generar `master_idea.md` usando `ai_docs/core_templates/01_generar_idea_maestra.md`
2. **[P0]** Seguir el pipeline en orden: 02 (nombre, opcional) → 03 (tema, opcional) → 04 (páginas) → 05 (wireframe) → 06 (datos) → 07 (arquitectura) → 08 (roadmap)

**Si es proyecto EXISTENTE (incorporación):**
1. **[P0]** Ejecutar `ai_docs/core_templates/00_incorporacion_proyecto.md` para generar `master_idea.md` + `scope_and_dependencies.md`
2. **[P0]** Seguir las recomendaciones de "Siguientes Pasos" del `scope_and_dependencies.md` generado (indica qué templates adicionales necesitas según tu scope)

### Siguiente sesión (mejoran la calidad del trabajo)
3. **[P1]** Ejecutar `/calibrate_templates` para adaptar plantillas al stack [stack detectado]
4. **[P1]** [completar documentos recomendados faltantes según inventario]
5. ...

### Cuando sea posible (optimizaciones)
6. **[P2]** [documentos opcionales o actualizaciones menores]
7. ...

## Metadatos del Setup

- **Generado:** [fecha ISO]
- **Git HEAD:** [SHA corto]
- **Rama:** [nombre de rama]
- **Indicador de obsolescencia:** Re-ejecutar si >30 commits desde la generación
```

### 5.2 Presentar Resumen al Usuario

```
Setup de Proyecto Completo

**Proyecto:** [nombre] — [stack + framework]
**Estructura ai_docs/:** [N directorios verificados, M creados, K migrados]
**Documentación core:** [X completos / Y incompletos / Z faltantes] de [T] documentos evaluados
**Migraciones legacy:** [descripción o "Ninguna necesaria"]
**Coherencia docs ↔ código:** [N inconsistencias detectadas o "Sin drift significativo"]
**ADK:** [resumen o "No aplica"]

Reporte técnico guardado en: ai_docs/core/setup_report.md

Acciones inmediatas:
1. [primera acción prioritaria con comando/ruta específica]
2. [segunda acción]

Próximo paso recomendado:
- Si proyecto NUEVO: Ejecutar template `01_generar_idea_maestra.md` para crear la documentación fundacional.
- Si proyecto EXISTENTE: Ejecutar template `00_incorporacion_proyecto.md` para reconocimiento y scope.
- Después de generar documentación core: Ejecutar /calibrate_templates para adaptar las plantillas al stack.
```
