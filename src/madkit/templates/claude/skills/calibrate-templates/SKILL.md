---
name: calibrate-templates
description: "Adapta templates desplegadas (.claude/{commands,skills,agents}/) al stack del proyecto destino tras setup_project o cuando hay drift. Activación: usuario menciona 'calibrar templates', 'adaptar al proyecto', o post-setup_project. NO para sync (sync-upstream-trigger primero)."
context: fork
agent: task-planner
effort: xhigh
allowed-tools: Read, Grep, Glob, Edit, Write, Bash
---

# Flujo de Trabajo de Calibración de Plantillas

> **Propósito:** Analizar el contexto completo de un proyecto destino y adaptar quirúrgicamente todas las plantillas desplegadas — eliminando las irrelevantes para el stack, actualizando referencias y rutas obsoletas, pre-llenando valores conocidos e inyectando reglas específicas del proyecto para que cada plantilla, agente y skill funcione de forma óptima desde el inicio.

> **Cuándo usar:** Ejecutar una vez después de copiar plantillas a un nuevo proyecto. Re-ejecutar cuando el proyecto cambie significativamente (nuevos componentes del stack, refactorizaciones mayores, cambios de equipo).

> **Prerrequisito recomendado:** Ejecutar `setup_project` primero para preparar la infraestructura de `ai_docs/`. Si existen documentos en `ai_docs/core/` (master_idea, architecture, data_models), la calibración será más precisa al inyectar contexto del proyecto en Fase 3.3.

> **Sin core docs:** La calibración funciona pero se limita a stack detection y eliminación de plantillas irrelevantes. La inyección de contexto (Fase 3.3) será superficial — solo datos del manifest y git, sin contexto de dominio.

> **Re-calibración:** Si `ai_docs/_meta/calibration_log.md` ya existe, NO crear un archivo nuevo. Añadir una nueva entrada al Historial de Calibraciones con la fecha actual y documentar los cambios incrementales respecto a la calibración anterior.

> **Flujo recomendado:** `setup_project` → `core_templates (00-08)` → `calibrate-templates`

---

## Fase 0: Inicializar Calibration Log

<!-- AI Agent: El calibration log vive en ai_docs/_meta/ (metadata operativa, no tarea). Este paso se ejecuta ANTES de cualquier análisis o modificación. -->

### 0.0 Detectar modo de calibración
<!-- AI Agent: Antes de cualquier otra cosa, decidir si esta calibración es FULL-PASS (re-recolectar todo) o INCREMENTAL (solo adaptar lo modificado por el último sync). El modo cambia qué fases se ejecutan completas. -->

**Argumentos de la skill:**
- `--full` → forzar full-pass (siempre)
- `--changed-only` → forzar incremental (requiere `.claude/.sync_report.txt`)
- sin argumentos → auto-detección (recomendado)

**Auto-detección:**

```
1. ¿Existe .claude/.sync_report.txt?
   NO → modo = FULL-PASS (es una calibración inicial o manual, no post-sync)
   SÍ → continuar

2. ¿Existe ai_docs/_meta/calibration_log.md?
   NO → modo = FULL-PASS (nunca se ha calibrado, sync no es suficiente contexto)
   SÍ → continuar

3. Leer última entrada del Historial de Calibraciones:
   - fecha_ultima_calibracion
   - git_head_ultima_calibracion

4. ¿Han pasado >30 días desde fecha_ultima_calibracion?
   SÍ → modo = FULL-PASS (contexto del stack puede estar obsoleto)
   NO → continuar

5. Contar commits desde git_head_ultima_calibracion:
   git rev-list --count <git_head>..HEAD
   ¿>50 commits?
   SÍ → modo = FULL-PASS (mucho cambio en el proyecto, re-recolectar)
   NO → modo = INCREMENTAL
```

**Reportar al usuario:**

```
Modo de calibración: [INCREMENTAL | FULL-PASS]
Razón: [auto-detección | --full forzado | --changed-only forzado | sin sync_report previo | ...]
```

**Si modo INCREMENTAL:** Proceder automáticamente. Reportar al usuario el modo y la razón antes de iniciar — la calibración incremental es más rápida y asume que el stack y las áreas de riesgo no han cambiado significativamente desde la última calibración.

**Si `--changed-only` se invocó pero no existe `.sync_report.txt`:** ERROR claro: "Sin `.sync_report.txt`. Ejecutar la skill `sync-upstream-trigger` primero o usar `calibrate-templates --full`."

### 0.1 Crear o Localizar Calibration Log

1. Verificar si existe `ai_docs/_meta/calibration_log.md`
2. Si existe: se actualizará con los resultados de esta calibración (re-calibración)
3. Si NO existe: crear el archivo con la estructura base de la sección 3.5

### 0.2 Registrar Estado ANTES de Calibración

<!-- AI Agent: Leer .claude/.ai_docs_path al inicio para resolver AI_DOCS_ROOT.
     Usar AI_DOCS_ROOT como prefijo de TODAS las rutas de ai_docs/ en Fases 0/2/3/3.5/3.6.
     En proyectos canónicos el archivo no existe y AI_DOCS_ROOT = ./ai_docs (cero regresión). -->

```bash
# Detectar ruta base de ai_docs/ (split-workspace support)
if [ -f ".claude/.ai_docs_path" ]; then
  # Leer primera línea no comentada, limpiar BOM y CRLF
  AI_DOCS_ROOT=$(grep -v '^#' .claude/.ai_docs_path | head -1 | tr -d '\r' | sed 's/[[:space:]]*$//')
  if [ -z "$AI_DOCS_ROOT" ] || [ ! -d "$AI_DOCS_ROOT" ]; then
    echo "WARN: .claude/.ai_docs_path no válido o directorio inexistente — usando ./ai_docs como fallback"
    AI_DOCS_ROOT="./ai_docs"
  fi
else
  AI_DOCS_ROOT="./ai_docs"
fi
echo "AI_DOCS_ROOT=$AI_DOCS_ROOT"
# Usar $AI_DOCS_ROOT como prefijo en todos los accesos a ai_docs/ en esta calibración.
```

Documentar en calibration log el inventario actual antes de realizar cambios:

```bash
# Inventario actual de plantillas desplegadas
ls .claude/commands/*.md 2>/dev/null
find .claude/skills/ -name "SKILL.md" 2>/dev/null
ls .claude/agents/*.md 2>/dev/null

# Core docs disponibles (usando AI_DOCS_ROOT detectado arriba)
ls "$AI_DOCS_ROOT/core/"*.md 2>/dev/null

# Estado del repositorio
git rev-parse --short HEAD 2>/dev/null
date -u +"%Y-%m-%dT%H:%M:%SZ"
```

Registrar en calibration log:
- Plantillas desplegadas (conteo y lista)
- Core docs disponibles (lista o "ninguno")
- Fecha y Git HEAD actual

### 0.3 Verificar Disponibilidad de Core Docs

1. Listar archivos en `ai_docs/core/` (no recursive — NO entrar en `_meta/`)
2. Si existen documentos P0 canónicos (`master_idea.md`, `architecture.md`, `data_models.md`): extraer contexto para inyección enriquecida en Fase 3.3:
   - De `master_idea.md`: descripción del proyecto, usuarios objetivo, funcionalidades principales
   - De `data_models.md`: entidades, relaciones, campos clave
   - De `architecture.md`: patrones de diseño, capas, servicios, stack
   - De `ai_docs/_meta/setup_report.md`: perfil del stack (si se ejecutó `setup_project` antes)
3. Si NO existen: registrar en calibration log "Calibración sin core docs — inyección de contexto limitada a stack detection"
4. Recomendar ejecutar el pipeline de `core_templates/` (per-proyecto) si faltan documentos P0

---

## Fase 1: Recolección de Contexto del Proyecto

### 1.0 Skip de Fase 1 si modo incremental
<!-- AI Agent: En modo INCREMENTAL, el contexto del stack ya está en el calibration log desde la última calibración. No re-recolectar — leerlo de allí. Solo se ejecuta el inventario actual (1.2) para detectar archivos nuevos del sync. -->

**Si modo INCREMENTAL (decidido en Fase 0.0):**

1. Leer Perfil del Stack desde la última entrada del Historial de Calibraciones en el calibration log
2. Leer áreas de riesgo desde la misma fuente
3. **Saltar §1.1, §1.3, §1.4, §1.5** (recolección desde cero)
4. **Ejecutar §1.2** (inventario actual de plantillas desplegadas) — necesario para detectar archivos nuevos del sync
5. Continuar con Fase 1B (las salvaguardas siempre se aplican)

**Si modo FULL-PASS:** ejecutar Fase 1 completa como siempre (§1.1 a §1.5).

### 1.1 Análisis de Documentación del Proyecto
<!-- AI Agent: Leer toda la documentación disponible del proyecto para entender convenciones y restricciones -->

**Fuentes Requeridas:**

```bash
# 1. Archivo de instrucciones del proyecto (máxima prioridad)
cat CLAUDE.md 2>/dev/null || echo "No se encontró CLAUDE.md"
cat .cursorrules 2>/dev/null || echo "No se encontró .cursorrules"

# 2. Historial de tareas (entender trabajo pasado y patrones recurrentes)
ls ai_docs/tasks/ 2>/dev/null || echo "No se encontró ai_docs/tasks/"
ls ai_docs/core/ 2>/dev/null || echo "No se encontró ai_docs/core/"

# 3. Configuración del proyecto
cat pyproject.toml 2>/dev/null | head -50
cat package.json 2>/dev/null | head -50
cat Cargo.toml 2>/dev/null | head -50

# 4. Reglas de IDE (si están presentes)
ls .cursor/rules/ 2>/dev/null | head -20
```

**Extraer de CLAUDE.md:**
- [ ] Descripción y propósito del proyecto
- [ ] Reglas doradas / prohibiciones
- [ ] Convenciones del stack (nombres, estructura, imports)
- [ ] Formato de mensajes de commit
- [ ] Cualquier regla explícita "NUNCA hagas X" o "SIEMPRE haz Y"

**Extraer de ai_docs/tasks/:**
- [ ] Conteo total de tareas y actividad reciente
- [ ] Temas recurrentes (misma área modificada repetidamente = zona frágil)
- [ ] Problemas no resueltos o deuda técnica conocida
- [ ] Patrones de implementación que funcionaron bien

### 1.2 Inventario de Plantillas Desplegadas
<!-- AI Agent: Catalogar todas las plantillas actualmente desplegadas en este proyecto -->

```bash
# Comandos desplegados (flat .md files)
ls .claude/commands/*.md 2>/dev/null

# Skills desplegados (folder/SKILL.md format)
find .claude/skills/ -name "SKILL.md" 2>/dev/null

# Agentes desplegados
ls .claude/agents/*.md 2>/dev/null
```

**Construir inventario:**
- [ ] Listar cada archivo en `.claude/commands/` (comandos de planificación)
- [ ] Listar cada skill en `.claude/skills/*/SKILL.md` (workflows operacionales)
- [ ] Listar cada archivo en `.claude/agents/` (agentes especializados)
- [ ] Leer el encabezado/propósito de cada archivo para entender qué hace
- [ ] Anotar referencias cruzadas entre plantillas (ej. cleanup delega a task template)
- [ ] Verificar prerequisitos entre skills (ej. skills ADK requieren agente `adk`)
- [ ] Verificar campo `skills:` en frontmatter de agentes (git-guardian, adk) — las skills listadas deben estar desplegadas

### 1.3 Detección del Stack
<!-- AI Agent: Identificar el stack tecnológico exacto con versiones -->

```bash
# Python/Django
python --version 2>/dev/null
python -c "import django; print(f'Django {django.VERSION}')" 2>/dev/null
pip show djangorestframework 2>/dev/null | grep Version
pip show celery 2>/dev/null | grep Version

# Node.js/TypeScript
node --version 2>/dev/null
cat package.json 2>/dev/null | python -c "import sys,json; d=json.load(sys.stdin); print(json.dumps({k:v for k,v in d.get('dependencies',{}).items()},indent=2))" 2>/dev/null
cat tsconfig.json 2>/dev/null | head -20

# Base de datos
grep -i "database\|DATABASES\|DATABASE_URL" .env settings.py settings/base.py config/settings/base.py 2>/dev/null | head -5

# Gestor de paquetes
ls uv.lock poetry.lock Pipfile.lock pnpm-lock.yaml yarn.lock package-lock.json bun.lockb 2>/dev/null
```

**Perfil del Stack a Completar:**
- **Lenguaje:** [Python X.Y / TypeScript X.Y / etc.]
- **Framework:** [Django X.Y / Next.js X.Y / FastAPI X.Y / etc.]
- **Base de Datos:** [PostgreSQL X.Y / MySQL / SQLite / etc.]
- **Gestor de Paquetes:** [uv / pip / poetry / npm / pnpm / yarn / bun]
- **Framework de API:** [DRF X.Y / tRPC / GraphQL / REST / etc.]
- **Cola de Tareas:** [Celery + Redis / BullMQ / Ninguno]
- **Caché:** [Redis / Memcached / Ninguno]
- **Testing:** [pytest / jest / vitest / Django TestCase]
- **Linting:** [ruff / eslint / biome / etc.]
- **Verificación de Tipos:** [mypy / pyright / TypeScript strict / etc.]

### 1.4 Análisis de Contexto Git
<!-- AI Agent: Entender el estado actual de desarrollo desde el historial de git -->

```bash
# Rama actual y su relación con main
git branch --show-current
git log --oneline main..HEAD 2>/dev/null | head -10

# Commits recientes (qué ha estado cambiando)
git log --oneline -20

# Ramas activas (qué está en progreso)
git branch -a --sort=-committerdate | head -15

# Archivos más frecuentemente modificados (zonas frágiles)
git log --oneline --since="30 days ago" --name-only --pretty=format: | sort | uniq -c | sort -rn | head -20

# Trabajo no commiteado
git status --short

# Último tag / release
git describe --tags --abbrev=0 2>/dev/null || echo "No se encontraron tags"
```

**Extraer:**
- [ ] Propósito de la rama actual
- [ ] Áreas de enfoque de desarrollo reciente (de mensajes de commit)
- [ ] Ramas activas y su propósito
- [ ] Archivos calientes (frecuentemente modificados = alto riesgo de conflictos)
- [ ] Trabajo no commiteado que podría afectar la planificación de tareas

### 1.5 Contexto Remoto (Opcional)
<!-- AI Agent: Solo si gh CLI está disponible y autenticado -->

```bash
# Verificar si gh está disponible
gh auth status 2>/dev/null

# PRs abiertas
gh pr list --limit 10 2>/dev/null

# Issues abiertos
gh issue list --limit 10 2>/dev/null

# Estado reciente de CI/CD
gh run list --limit 5 2>/dev/null
```

---

## Fase 1B: Salvaguardas de Calibración

### Secciones Protegidas (NUNCA MODIFICAR)

<!-- AI Agent: Estas secciones son estructurales y universales. NUNCA deben ser modificadas, eliminadas ni simplificadas durante la calibración. -->

**YAML Frontmatter de Skills y Agentes — INMUTABLE ESTRUCTURALMENTE:**

El frontmatter YAML de skills (`SKILL.md`) y agentes es el mecanismo de auto-activación de Claude Code. Sin él, las plantillas no se disparan automáticamente.

- **`name:`** — Identificador interno. NUNCA modificar (controla el routing de Claude Code)
- **`description:`** — Trigger de activación. NUNCA eliminar. Se puede ENRIQUECER con contexto del proyecto pero manteniendo los triggers originales intactos
- **`skills:`** — Lista de skills precargadas por agentes (git-guardian, adk). NUNCA eliminar skills de esta lista; se pueden AÑADIR skills adicionales del proyecto
- **`model:` (SOLO en subagents `.claude/agents/*.md`)** — Asignación de modelo por perfil de trabajo (opus/sonnet/haiku). NUNCA eliminar ni modificar — decisión arquitectónica. Matriz actual (8 subagents):
  - `reviewer=opus` (revisión correlacionada + gate adversarial plan-checker y bugfix)
  - `task-planner=sonnet`, `adk=sonnet`, `doc-syncer=sonnet`, `researcher=sonnet`, `implementer=sonnet` (planificación, orquestación, docs, investigación, ejecución de planes)
  - `orientador=haiku`, `git-guardian=haiku` (orientación, ops git mecánicas)
  Si el usuario quiere cambiar un modelo por coste, debe hacerse en el repo de plantillas y propagarse vía sync, no por calibración.

**Verificación de coherencia model table ↔ agents (ejecutar siempre, incluso en modo INCREMENTAL):**
Para cada fila de la tabla "Modelo por perfil de trabajo" en `CLAUDE.md`, leer el campo `model:` del agent desplegado correspondiente en `.claude/agents/`. Si difieren → actualizar la celda de `CLAUDE.md` para que refleje el valor del agent (el agent es la fuente de verdad para el modelo real; la tabla en CLAUDE.md es documentación derivada). Registrar en `calibration_log.md`:
`[MODEL SYNC] <agent>: CLAUDE.md tenía <valor-viejo>, corregido a <valor-agent>`.
Si CLAUDE.md no tiene tabla de modelos → emitir WARN en calibration_log y continuar (advisory, no bloqueante).

- **`effort:`** — si presente en subagent o skill, CONSERVAR. Es ajuste por perfil de trabajo, no por proyecto.
- **`context: fork` + `agent:`** en skills — CONSERVAR. Skills con `context: fork` corren en sesión aislada del subagent declarado en `agent:`. Si encuentras una skill con `context: fork` y el subagent referenciado en `agent:` NO está desplegado en `.claude/agents/`, eliminar `context: fork` + `agent:` (la skill funcionará heredando modelo del invocador) y reportar en el calibration log. **Las skills NO declaran `model:`** directamente: si encuentras `model:` en el frontmatter de una skill, ELIMÍNALO — usar `context: fork` + `agent:` en su lugar.
- **`paths:`** — globs que limitan auto-activación por archivos. CONSERVAR si presente.
- **`memory:`** en subagents (valores: `user`, `project`, `local`) — CONSERVAR, es decisión arquitectónica (p.ej. `doc-syncer` usa `project`).
- **`disable-model-invocation:`**, **`user-invocable:`**, **`allowed-tools:`**, **`argument-hint:`** — Si están presentes, CONSERVAR. Se pueden añadir si se necesitan

**Ejemplo de enriquecimiento PERMITIDO de description:**
```yaml
# ANTES (plantilla original)
description: "Commit Git directo con guardia anti-scaffolding..."

# DESPUÉS (calibrado — se AÑADE contexto, no se reemplaza)
description: "Commit Git directo con guardia anti-scaffolding... En este proyecto, usar convención conventional-commits y branch naming feat/fix/chore."
```

**Ejemplo de enriquecimiento PROHIBIDO:**
```yaml
# PROHIBIDO — se eliminó el trigger original
description: "Hacer commits en el proyecto Django."
```

---

**Las siguientes secciones en task templates son INMUTABLES durante calibración:**

1. **Clasificación de Complejidad** — Los 4 niveles (SIMPLE / ESTÁNDAR / COMPLEJA / CRÍTICA) y sus criterios
2. **PUERTA PRE-IMPLEMENTACIÓN** — Todos los checkboxes del gate
3. **Estrategia de Rollback** — Estructura y escenarios
4. **Protocolo de Creación de Documentos** — Flujo de pasos 0.x (varía por template: 0.1-0.7 genérico, 0.0.1-0.6 ADK)
5. **Análisis de Alternativas** — Estructura de alternativas y matriz de compromisos
6. **Análisis de Casos Extremos** — Preguntas obligatorias de edge cases
7. **Análisis Crítico Obligatorio** — Checklist de 5 puntos en paso de presentación
8. **Directiva de Iteración Proactiva** — Comportamiento SIEMPRE/NUNCA del asistente

**Regla:** Si durante la calibración se detecta que una de estas secciones "no aplica" al proyecto, la sección se CONSERVA intacta — el agente la saltará naturalmente al no cumplirse los criterios de activación.

### Límites de Pre-llenado

**PERMITIDO durante calibración:**
- Reemplazar placeholders genéricos con valores reales del proyecto (rutas, versiones, comandos)
- Agregar ejemplos específicos del proyecto a secciones de ejemplos
- Actualizar referencias de versión del framework
- Agregar prohibiciones del proyecto desde CLAUDE.md a secciones de validación

**PROHIBIDO durante calibración:**
- Marcar checkboxes como completados (los checkboxes son para uso en tiempo de ejecución)
- Eliminar niveles de complejidad (ej. quitar CRÍTICA porque "este proyecto no la necesita")
- Modificar la lógica de los gates (cambiar "TODOS" por "ALGUNOS", quitar condiciones)
- Pre-llenar decisiones de arquitectura o alternativas de solución
- Simplificar o reducir preguntas de edge cases

### Detección de Monorepo / Multi-Stack

<!-- AI Agent: Un proyecto puede usar múltiples stacks. Detectar TODOS antes de eliminar plantillas. -->

**Antes de eliminar plantillas por irrelevancia de stack:**

1. Verificar si el proyecto es un monorepo o tiene múltiples stacks:
   ```bash
   # Detectar múltiples lenguajes/frameworks
   ls pyproject.toml package.json composer.json Cargo.toml go.mod 2>/dev/null
   ls manage.py artisan next.config.* nuxt.config.* 2>/dev/null
   # Verificar subdirectorios con stacks diferentes
   find . -maxdepth 2 -name "package.json" -o -name "pyproject.toml" -o -name "composer.json" 2>/dev/null | head -10
   ```

2. Si se detectan 2+ stacks: conservar plantillas de TODOS los stacks presentes
3. Si hay duda sobre si un stack está en uso: conservar (safe default — la eliminación es irreversible)

**Ejemplo:** Un proyecto con `manage.py` (Django) Y `package.json` con Next.js debe conservar TANTO `references/task_template_django.md` COMO `references/task_template_typescript.md` (y `task_template.md` como genérico).

### Validación de Dependencias Antes de Eliminación

**Antes de eliminar CUALQUIER plantilla:**

1. Verificar que ninguna plantilla conservada referencia la candidata a eliminación:
   ```bash
   # Buscar referencias exactas al nombre del archivo
   grep -rn "nombre_exacto_plantilla" .claude/commands/ .claude/skills/ .claude/agents/ 2>/dev/null
   ```

2. Si una plantilla conservada referencia la candidata:
   - Opción A: Conservar la candidata (no eliminar)
   - Opción B: Actualizar la referencia en la plantilla conservada antes de eliminar

3. Verificar también en skills:
   ```bash
   grep -rn "nombre_exacto_plantilla" .claude/commands/ .claude/skills/ .claude/agents/ 2>/dev/null
   ```

### Validación Mejorada de Cross-References

**Después de eliminar plantillas, verificar integridad:**

```bash
# Buscar referencias a plantillas que ya no existen
# Para cada plantilla eliminada, buscar su nombre exacto en archivos restantes
for deleted in [lista_de_eliminados]; do
  grep -rn "$deleted" .claude/commands/ .claude/skills/ .claude/agents/ 2>/dev/null
done
```

**Si se encuentran referencias huérfanas:** Corregir ANTES de completar la calibración.

---

## Fase 2: Análisis y Evaluación de Riesgos

### 2.1 Indicadores de Deuda Técnica
<!-- AI Agent: Cuantificar la salud del proyecto -->

```bash
# Conteo de TODO/FIXME
grep -rn "TODO\|FIXME\|HACK\|XXX\|WORKAROUND" --include="*.py" --include="*.ts" --include="*.tsx" --include="*.js" --exclude-dir=node_modules --exclude-dir=venv --exclude-dir=.venv 2>/dev/null | wc -l

# Estimación de cobertura de tests
find . -name "test_*.py" -o -name "*.test.ts" -o -name "*.spec.ts" -o -name "*.test.tsx" | wc -l 2>/dev/null

# Conteo de migraciones (Django)
find . -path "*/migrations/0*.py" -not -path "*/venv/*" 2>/dev/null | wc -l

# Archivos grandes (complejidad potencial)
find . -name "*.py" -o -name "*.ts" -o -name "*.tsx" | xargs wc -l 2>/dev/null | sort -rn | head -10

# Conteo de dependencias
pip list 2>/dev/null | wc -l
cat package.json 2>/dev/null | python -c "import sys,json; d=json.load(sys.stdin); print(f'deps: {len(d.get(\"dependencies\",{}))}, devDeps: {len(d.get(\"devDependencies\",{}))}')" 2>/dev/null
```

### 2.2 Detección de Patrones del Proyecto
<!-- AI Agent: Identificar patrones que las plantillas deben seguir -->

```bash
# Estilo de imports (absolutos vs relativos)
grep -rn "^from \." --include="*.py" | head -5  # Imports relativos
grep -rn "^from [a-z]" --include="*.py" | head -5  # Imports absolutos

# Patrón de organización de código
ls -d */models.py */views.py */serializers.py 2>/dev/null  # Estructura de app Django
ls -d src/components/ src/pages/ src/app/ 2>/dev/null  # Estructura Next.js
ls -d src/lib/ src/utils/ src/hooks/ 2>/dev/null  # Patrones TypeScript

# Patrón de manejo de errores
grep -rn "try:\|except\|raise\|catch\|throw" --include="*.py" --include="*.ts" | head -10

# Patrón de logging
grep -rn "logger\.\|logging\.\|console\.\(log\|error\|warn\)" --include="*.py" --include="*.ts" | head -5
```

---

## Fase 3: Adaptar Plantillas Desplegadas

<!-- AI Agent: Esta es la fase central. Vas a modificar quirúrgicamente los archivos de plantilla reales desplegados en este proyecto. -->

### 3.0 Determinar archivos a adaptar
<!-- AI Agent: En modo INCREMENTAL, restringir Fase 3 a los archivos listados en .sync_report.txt. En modo FULL-PASS, todas las plantillas conservadas son candidatas. -->

**Si modo INCREMENTAL:**

1. Leer `.claude/.sync_report.txt`
2. Listar archivos marcados como `[NUEVO]` y `[MODIFICADO]`
3. Restringir §3.2 (referencias) y §3.3 (inyección de contexto) a esos archivos
4. **Saltar §3.1** (eliminación) — el sync no elimina archivos, solo añade/modifica
5. **Saltar §3.4** (calibración ADK específica) si ningún archivo de la lista está en `.claude/skills/adk-*/` o `.claude/commands/references/task_template_adk.md`/`.claude/agents/adk-agent.md`
6. **Saltar §3.5** parcialmente — el calibration log SÍ se actualiza pero con entrada de tipo `(INCREMENTAL)` — ver plantilla en §3.5

**Si modo FULL-PASS:**
- Sin restricciones, todas las plantillas conservadas tras §3.1 son candidatas para §3.2, §3.3, §3.4

### 3.1 Eliminar Plantillas Irrelevantes
<!-- AI Agent: Basándose en el stack detectado, identificar y eliminar plantillas que no apliquen a este proyecto. SIEMPRE confirmar con el usuario antes de eliminar. -->

**Matriz de relevancia stack-plantilla:**

**Comandos (commands/) y References (commands/references/):**

| Archivo | Django | Python | TypeScript/Next.js | Web/JS | ADK | WordPress |
|---------|--------|--------|--------------------|--------|-----|-----------|
| `references/task_template_django.md` | ✅ | — | — | — | — | — |
| `references/task_template_python.md` | ✅ | ✅ | — | — | — | — |
| `references/task_template_typescript.md` | — | — | ✅ | — | — | — |
| `task_template.md` (genérico, command) | ✅ | ✅ | ✅ | ✅ | — | ✅ |
| `references/task_template_php.md` | — | — | — | ✅ | — | ✅ |
| `references/task_template_adk.md` | — | — | — | — | ✅ | — |
| `references/task_template_wordpress.md` | — | — | — | — | — | ✅ |
| `setup_project.md` (command) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `sync-upstream-trigger.md` (command) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**Skills (skills/\*/SKILL.md):**

| Skill | Django | Python | TypeScript/Next.js | Web/JS | ADK | WordPress |
|-------|--------|--------|--------------------|--------|-----|-----------|
| `cleanup/` | — | — | ✅ | ✅ | — | — |
| `cleanup-python/` | ✅ | ✅ | — | — | — | — |
| `cleanup-django/` | ✅ | — | — | — | — | — |
| `cleanup-php/` | — | — | — | ✅ | — | ✅ |
| `django-migration-workflow/` | ✅ | — | — | — | — | — |
| `drizzle-migration-rollback/` | — | — | ✅ | — | — | — |
| `improve-ui/` | — | — | ✅ | ✅ | — | ✅ |
| `gcp-debugging/` | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| `adk-workflow-design/` | — | — | — | — | ✅ | — |
| `adk-bottleneck-analysis/` | — | — | — | — | ✅ | — |
| `adk-prompt-cleanup/` | — | — | — | — | ✅ | — |
| `adk-agent-orchestrator/` | — | — | — | — | ✅ | — |
| `adk-production-setup/` | — | — | — | — | ✅ | — |
| `adk-evaluation-testing/` | — | — | — | — | ✅ | — |
| `adk-skills-toolset/` | — | — | — | — | ✅ | — |
| `unit-testing/` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `roadmap-generator/` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `scroll-stop-builder/` | — | — | ✅ | ✅ | — | ✅ |
| `scroll-stop-web-animations/` | — | — | ✅ | ✅ | — | ✅ |
| `adk_orchestrator_template.md` (command) | — | — | — | — | ✅ | — |
| `calibrate-templates/` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `testing-setup/` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `create-skill/` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**Agentes (agents/) — 8 subagents tras tasks 072+085:**

| Agente (archivo → name) | Django | Python | TypeScript/Next.js | Web/JS | ADK | WordPress |
|--------------------------|--------|--------|--------------------|--------|-----|-----------|
| `task-agent` → `task-planner` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `reviewer-agent` → `reviewer` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `git-guardian-agent` → `git-guardian` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `implementer-agent` → `implementer` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `doc-syncer-agent` → `doc-syncer` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `researcher-agent` → `researcher` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `orientador-agent` → `orientador` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `adk-agent` → `adk` | — | — | — | — | ✅ | — |

**Plantillas universales (conservar siempre):**
- Comandos: `create_task`, `setup_project`, `task_template`, `sync-upstream-trigger.md`
- Skills: `bugfix/`, `commit/`, `pr/`, `diff/`, `task-implementation-review/`, `generate-diagram/`, `worktree-management/`, `unit-testing/`, `onboarding/`, `roadmap-generator/`, `calibrate-templates/`, `testing-setup/`, `create-skill/`
- Agentes: `task-agent`, `reviewer-agent`, `git-guardian-agent`, `implementer-agent`, `doc-syncer-agent`, `researcher-agent`, `orientador-agent`

**Acciones:**
1. Cruzar el stack detectado contra las tres matrices de relevancia (comandos, skills, agentes)
2. Listar plantillas a eliminar (las marcadas con `—` para el stack detectado)
3. Eliminar directamente de `.claude/commands/`, `.claude/skills/` (carpeta completa del skill) y `.claude/agents/`
4. Registrar lista de eliminaciones en calibration log

### 3.2 Actualizar Referencias y Rutas
<!-- AI Agent: Escanear plantillas restantes buscando referencias obsoletas y corregirlas -->

**Buscar y corregir:**
1. **Referencias cruzadas entre plantillas** — si una plantilla eliminada es referenciada por otra que se conserva, eliminar o actualizar esa referencia
2. **Rutas de documentación** — reemplazar rutas genéricas (`ai_docs/tasks/`, `src/`, etc.) con las rutas reales del proyecto si difieren
3. **Referencias a herramientas/comandos** — eliminar menciones de herramientas o comandos no disponibles en este proyecto (ej. comandos de Drizzle en un proyecto Django)
4. **Ejemplos específicos del stack** — si una plantilla contiene ejemplos de múltiples stacks, conservar solo los relevantes

```bash
# Encontrar referencias cruzadas a plantillas eliminadas
grep -rn "task_template\|cleanup\|migration\|drizzle\|django\|adk\|wordpress" .claude/commands/ .claude/skills/ .claude/agents/ 2>/dev/null
```

### 3.3 Inyectar Contexto del Proyecto en Plantillas
<!-- AI Agent: Modificar plantillas restantes para pre-llenar valores específicos del proyecto -->

**Para `CLAUDE.md` del proyecto (si fue generado desde `CLAUDE.md.template` por `setup_project`):**
- Rellenar placeholders `[entre corchetes]` con valores del stack detectado:
  - `[nombre del proyecto]` → nombre real (extraer de manifest o preguntar)
  - `[Python X.Y / TypeScript X.Y / ...]` → stack + versión exacta
  - `[Django X.Y / Next.js X.Y / ...]` → framework + versión
  - `[PostgreSQL X.Y / ...]` → BBDD
  - `[uv / pip / npm / ...]` → gestor de paquetes detectado
- Sección **"Prohibiciones del proyecto"**: leer reglas "NUNCA"/"SIEMPRE" de documentos core o de un CLAUDE.md pre-existente y añadirlas
- Sección **"Convenciones del proyecto"**: inferir imports, naming, formato de commits del historial git
- Sección **"Comandos frecuentes"**: pre-llenar con comandos reales (`pytest`, `npm test`, etc.) extraídos de `package.json` scripts, `pyproject.toml` tool section, Makefile
- **NUNCA modificar** las 5 secciones transversales de CLAUDE.md (heredadas del template base) — son guidance transversal que no depende del proyecto:
  1. "Estilo de respuesta"
  2. "Principios de Ingeniería" (P1-P4, fuente única literal en inglés)
  3. "Estructura de carpetas (canónica en todos los proyectos)"
  4. "Modelo por perfil de trabajo"
  5. "Cuándo delegar a subagentes"

**Para cada plantilla de tarea (commands/):**
- Pre-llenar la sección de detección de stack con el stack real detectado, versiones y gestor de paquetes
- Reemplazar verificaciones pre-vuelo genéricas con las específicas del proyecto (ej. ruta real del archivo de settings, comando real de tests)
- Establecer complejidad por defecto según el tamaño del proyecto y nivel de deuda técnica
- Agregar prohibiciones del proyecto desde CLAUDE.md a la sección de validación de la plantilla

**Para cada skill (skills/\*/SKILL.md):**
- Reemplazar ejemplos genéricos con los específicos del proyecto (rutas reales, nombres de módulos reales)
- Pre-llenar valores conocidos (backend de base de datos, conteo de migraciones, comandos del gestor de dependencias)
- Agregar archivos calientes y áreas de riesgo a plantillas relevantes (cleanup, workflows de migración)
- Verificar prerequisitos entre skills (ej. skills ADK requieren agente `adk`)
- **Preservar frontmatter YAML** — `name:` y `description:` son triggers de auto-activación (ver Fase 1B)

**Para cada agente (agents/):**
- **Preservar frontmatter YAML intacto** — especialmente `name:`, `description:` y `skills:` (ver Fase 1B)
- Si el agente tiene campo `skills:` (git-guardian, adk): verificar que las skills listadas están desplegadas en `.claude/skills/`. Si alguna fue eliminada por irrelevancia de stack, quitarla de la lista
- Enriquecer `description:` con contexto del proyecto (AÑADIR, no reemplazar triggers)
- Agregar convenciones específicas del proyecto a la sección de reglas del agente
- Incluir áreas frágiles conocidas y notas de deuda técnica relevantes al dominio de ese agente
- Actualizar referencias de versión del framework para coincidir con el proyecto real

### 3.4 Calibración Específica ADK (SOLO si stack incluye ADK)

<!-- AI Agent: Esta sección solo aplica cuando el proyecto usa Google Agent Development Kit. Es la calibración más propensa a errores debido a la complejidad del ecosistema ADK (1 agente + 7 skills + 2 comandos). -->

**Verificaciones Pre-Calibración ADK:**

```bash
# Verificar SDK ADK instalado
pip show google-genai 2>/dev/null | grep -E "Name|Version"
python -c "from google.adk.agents import LlmAgent; print('ADK OK')" 2>/dev/null

# Detectar estructura de proyecto ADK
find . -name "agent.py" -not -path "*/venv/*" -not -path "*/.venv/*" 2>/dev/null
find . -name "__init__.py" -exec grep -l "root_agent" {} \; 2>/dev/null

# Verificar documentación ADK local
ls ai_docs/refs/adk-python/ 2>/dev/null || ls ai_docs/refs/adk-docs/ 2>/dev/null
```

**Importar/Actualizar Repos de Referencia ADK (OBLIGATORIO):**

Los repos oficiales de ADK son fuente de verdad para documentación, ejemplos y patrones. Deben estar disponibles localmente ANTES de calibrar plantillas ADK.

```bash
# 1. SDK oficial (documentación, código fuente, changelog, samples)
if [ -d "ai_docs/refs/adk-python/.git" ]; then
  git -C ai_docs/refs/adk-python pull --ff-only 2>/dev/null || echo "WARN: No se pudo actualizar adk-python"
else
  git clone --depth 1 https://github.com/google/adk-python.git ai_docs/refs/adk-python
fi

# 2. Ejemplos oficiales de Google (arquitecturas de referencia, evalsets, patterns)
if [ -d "ai_docs/refs/adk-samples/.git" ]; then
  git -C ai_docs/refs/adk-samples pull --ff-only 2>/dev/null || echo "WARN: No se pudo actualizar adk-samples"
else
  git clone --depth 1 https://github.com/google/adk-samples.git ai_docs/refs/adk-samples
fi

# 3. Verificar que ambos repos están disponibles
ls ai_docs/refs/adk-python/CHANGELOG.md 2>/dev/null && echo "adk-python: OK" || echo "ERROR: adk-python no disponible"
ls ai_docs/refs/adk-samples/ 2>/dev/null && echo "adk-samples: OK" || echo "ERROR: adk-samples no disponible"

# 4. Registrar versiones importadas
echo "SDK commit: $(git -C ai_docs/refs/adk-python rev-parse --short HEAD 2>/dev/null)"
echo "Samples commit: $(git -C ai_docs/refs/adk-samples rev-parse --short HEAD 2>/dev/null)"

# 5. OPCIONAL — Importar skills oficiales de Google (SkillToolset, spec agentskills.io)
#    Solo si el proyecto va a usar SkillToolset. Requiere Node.js.
#    npx skills add google/adk-docs      # skills oficiales ADK
#    Ver skill `adk-skills-toolset` para decisión y compliance.
```

**Tras importar:** Registrar en el calibration log los commits de ambos repos y la fecha de importación.

**Calibrar plantillas ADK:**

1. **`adk-agent` → agente `adk`:**
   - [ ] Actualizar rutas de documentación ADK (`ai_docs/refs/adk-docs/` o `ai_docs/refs/adk-python/`) según la ubicación real en el proyecto
   - [ ] Verificar que las rutas de importación documentadas coinciden con la versión del SDK instalada
   - [ ] Pre-llenar versión del SDK en referencias
   - [ ] Verificar campo `skills:` en frontmatter — las 7 skills ADK deben estar desplegadas en `.claude/skills/`

2. **`references/task_template_adk.md` (reference, cargada por task-planner):**
   - [ ] Actualizar pre-vuelo con la versión real de Python y SDK del proyecto
   - [ ] Pre-llenar rutas de agent.py y __init__.py del proyecto real
   - [ ] Actualizar estructura de directorios con la estructura real del proyecto ADK

3. **`adk_orchestrator_template.md` (command):**
   - [ ] Verificar que el proyecto usa el patrón de documentos de diseño (`ai_docs/tasks/XXX_DESIGN_*.md`)
   - [ ] Pre-llenar modelo predeterminado del proyecto (gemini-2.5-flash / gemini-2.5-pro)
   - [ ] Actualizar estructura de proyecto ADK en sección 15 con la estructura real

4. **`adk-workflow-design/` (skill):**
   - [ ] Verificar prerequisito: agente `adk` debe estar presente
   - [ ] Pre-llenar ubicación de guardado de documentos de diseño

5. **`adk-bottleneck-analysis/` (skill):**
   - [ ] Pre-llenar rutas de archivos de agentes del proyecto para diagnóstico
   - [ ] Actualizar referencias a documentación

6. **`adk-prompt-cleanup/` (skill):**
   - [ ] Pre-llenar rutas de agentes existentes para alcance de limpieza
   - [ ] Verificar que rutas de descubrimiento coinciden con estructura real

7. **`adk-agent-orchestrator/` (skill):**
   - [ ] Verificar prerequisito: agente `adk` debe estar presente
   - [ ] Verificar que existen documentos de diseño (`DESIGN_*.md`) para sincronizar
   - [ ] Pre-llenar rutas de `agent.py`, `sub_agents/`, `tools/` del proyecto real

8. **`adk-production-setup/` (skill):**
   - [ ] Pre-llenar backend de sesión del proyecto (Supabase, PostgreSQL, SQLite)
   - [ ] Actualizar configuración de API server según entorno del proyecto
   - [ ] Pre-llenar configuración de deployment (Cloud Run, Agent Engine)

9. **`adk-evaluation-testing/` (skill):**
   - [ ] Pre-llenar rutas de evalsets del proyecto si existen
   - [ ] Actualizar métricas relevantes según el tipo de agentes del proyecto
   - [ ] Pre-llenar configuración de CI/CD si aplica

**Validación de Coherencia ADK:**
- [ ] Todas las plantillas ADK referencian la misma versión del SDK
- [ ] Rutas de documentación son consistentes entre las 7 plantillas ADK
- [ ] Modelos disponibles coinciden con la configuración del proyecto (API keys, project ID)
- [ ] Estructura de proyecto documentada en plantillas coincide con la estructura real
- [ ] No hay referencias a patrones ADK obsoletos (imports incorrectos, APIs deprecated)

### 3.5 Documentar Calibración en Calibration Log y ecosystem_state.md

<!-- AI Agent: El output de calibración se divide en DOS destinos con responsabilidades distintas:
- Calibration Log (ai_docs/_meta/calibration_log.md): LOG DE OPERACIÓN — qué se calibró, cuándo, qué cambió, historial acumulativo.
- ecosystem_state.md (ai_docs/_meta/ecosystem_state.md): ESTADO PERSISTENTE — inventario actual, hooks activos, stack calibrado, última calibración.
Esta separación permite que core-context-loader lea el estado del ecosistema sin parsear el log histórico de operaciones. -->

#### Destino A — Calibration Log: Log de Operación

**Archivo:** `ai_docs/_meta/calibration_log.md`

**Propósito:** Historial acumulativo de operaciones de calibración. No se sobreescribe — cada calibración añade una entrada al historial.

**Cuándo escribir en el calibration log:**
- Fecha y modo de calibración (FULL-PASS / INCREMENTAL).
- Lista de templates modificados con resumen del cambio.
- Decisiones de adaptación al stack (por qué se eligió X sobre Y).
- Archivos eliminados y razón (solo FULL-PASS).
- Referencias a `ecosystem_state.md` para el estado actual (no duplicar inventario en calibration log).

**Si es primera calibración:** Crear el documento con la estructura completa.
**Si es re-calibración:** Añadir nueva entrada bajo `## Historial de Calibraciones` con la fecha actual.

```markdown
# Calibration Log
<!-- Auto-generado por calibrate-templates -->
<!-- Re-ejecutar calibración cuando el proyecto cambie significativamente -->
<!-- Estado actual del ecosistema: ver ai_docs/_meta/ecosystem_state.md -->

## Estado
- **Estado:** Completado
- **Última calibración:** [FECHA ISO]
- **Git HEAD:** [SHA corto]
- **Indicador de obsolescencia:** Re-ejecutar si >20 commits desde la última calibración

---

## Historial de Calibraciones

### Calibración [FECHA ISO] ([MODO])

> Donde [MODO] = `FULL-PASS` o `INCREMENTAL`. Si INCREMENTAL, ver §3.0 para criterios.

#### Estado ANTES
- **Plantillas desplegadas:** [N] comandos | [M] skills | [K] agentes
- **Core docs disponibles:** [lista o "ninguno"]
- **Git HEAD:** [SHA corto]
- **Modo:** [FULL-PASS | INCREMENTAL]
- **Razón del modo:** [auto-detección | --full forzado | --changed-only forzado | >30 días | >50 commits | sin sync_report previo | ...]

#### Acciones Realizadas
- **Eliminados:** [lista de archivos/carpetas eliminados con razón — solo en FULL-PASS]
- **Modificados:** [lista de archivos modificados con resumen de 1 línea de qué cambió]
- **Contexto inyectado:** [resumen de valores pre-llenados en plantillas]
- **Reutilizado de calibración previa (solo INCREMENTAL):** Stack, áreas de riesgo, conteos preservados — ver entrada anterior
- **ecosystem_state.md:** [actualizado FULL-PASS / actualizado parcial INCREMENTAL / creado nuevo]

#### Estado DESPUÉS

> El inventario completo de templates desplegados y el stack calibrado se encuentran en `ai_docs/_meta/ecosystem_state.md`.
> Esta sección registra las decisiones y áreas de riesgo del proyecto — información de contexto de ingeniería, no de inventario.

**Reglas del Proyecto (extraídas de CLAUDE.md):**
- Prohibiciones: [lista]
- Convenciones: [lista]

**Áreas de Riesgo:**
- Archivos calientes: `[archivo]` — [N] cambios en los últimos 30 días
- Áreas frágiles: [área] — [por qué]

#### Validación
- [ ] Solo plantillas relevantes al stack
- [ ] Sin referencias cruzadas huérfanas
- [ ] Prerequisitos entre skills verificados
- [ ] Frontmatter YAML preservado (name, description, skills)
- [ ] Campo `skills:` en agentes apunta a skills desplegadas
- [ ] Valores pre-llenados correctos
- [ ] Sin información sensible incluida
- [ ] ecosystem_state.md actualizado (ver §3.6)

**Metadatos:**
- **Plantillas modificadas:** [conteo]
- **Plantillas eliminadas:** [conteo]
```

#### Destino B — ecosystem_state.md: Estado Persistente

**Archivo:** `ai_docs/_meta/ecosystem_state.md` (en proyecto destino)

**Propósito:** Estado actual del ecosistema de templates. Leído por `core-context-loader` en cada SessionStart. Reemplaza la sección correspondiente en cada calibración FULL-PASS; actualización parcial en INCREMENTAL.

**Cuándo escribir en ecosystem_state.md:**
- Inventario actual de templates desplegados (N commands, M skills, K agentes — con lista).
- Hooks activos (flags `true` en `.claude/hooks/config.json`).
- Stack calibrado (framework, versión, gestor de paquetes, decisiones de modelo).
- Fecha y modo de última calibración (reemplaza el valor anterior — no acumula historial).

Ver §3.6 para las reglas de sincronización (cuándo crear, cuándo actualizar, qué preservar).

---

### 3.6 Sincronización con ecosystem_state.md

<!-- AI Agent: Reglas que gobiernan cómo calibrate-templates mantiene ai_docs/_meta/ecosystem_state.md en el proyecto destino. Este archivo es el estado persistente del ecosistema — no el log de operación (que vive en calibration_log.md). -->

#### Reglas de sincronización

**Regla 1 — Si `ecosystem_state.md` no existe:**

Crearlo usando la plantilla minimal de 4 secciones (igual que `setup_project` Fase 5.3), rellenando inmediatamente todas las secciones con los datos de esta calibración. No dejar placeholders si los datos están disponibles.

```bash
# Verificar existencia antes de escribir
if [ ! -f "ai_docs/_meta/ecosystem_state.md" ]; then
  echo "ecosystem_state.md no encontrado — creando y rellenando desde calibración actual."
fi
```

**Regla 2 — Si `ecosystem_state.md` existe (update incremental):**

Actualizar SOLO las secciones gestionadas por `calibrate-templates`. No borrar secciones que el usuario haya añadido manualmente.

**Regla 3 — Tras FULL-PASS:**

Reescribir las 4 secciones gestionadas con los datos actuales:
- `## Inventario` → lista completa de templates desplegados tras la calibración.
- `## Hooks Activos` → flags `true` leídas de `.claude/hooks/config.json` (o "Ninguno configurado" si el archivo no existe).
- `## Stack Calibrado` → perfil completo del stack detectado en Fase 1.3 (lenguaje, framework, BBDD, gestor de paquetes, testing, linting).
- `## Última Calibración` → `[FECHA ISO] — FULL-PASS — git HEAD: [SHA corto]`.

**Regla 4 — Tras INCREMENTAL:**

Actualizar solo:
- `## Última Calibración` → `[FECHA ISO] — INCREMENTAL — git HEAD: [SHA corto]`.
- Las secciones afectadas por el diff (ej. si se desplegaron nuevas skills, actualizar `## Inventario`).
- **No reescribir** `## Stack Calibrado` ni `## Hooks Activos` si no cambiaron.

**Regla 5 — Secciones custom:**

Secciones en `ecosystem_state.md` no gestionadas por `calibrate-templates` (añadidas manualmente por el equipo del proyecto) se preservan sin modificar. Identificar secciones custom como cualquier `##` que no sea `Inventario`, `Hooks Activos`, `Stack Calibrado` o `Última Calibración`.

**Regla 6 — Cota de tamaño:**

`ecosystem_state.md` vive en `ai_docs/_meta/`, fuera del scope del hook `core-context-loader` (que sólo lee `core/`). El archivo es leído por `calibrate-templates` y `/sync-upstream-trigger` Paso 4.5 según necesite. Mantenerlo bajo 200 líneas como límite blando para legibilidad; emitir nota al usuario si la calibración lo hace exceder:

```
WARN: ecosystem_state.md está cerca del límite de 200 líneas ([N] líneas actuales).
Considera reducir el detalle en las secciones de inventario para mantener el archivo
manejable cuando se lea on-demand.
```

**Regla 7 — Migración desde proyectos antiguos (primera calibración FULL-PASS):**

Si el calibration log tiene secciones de inventario de templates (generadas en versiones anteriores cuando no existía `ecosystem_state.md`), añadir marker en esas secciones para indicar que el estado fue movido:

```markdown
<!-- migrado — ver ai_docs/_meta/ecosystem_state.md para estado actual -->
```

No eliminar el contenido histórico del calibration log — es log de operación y debe preservarse.

#### Formato canónico de ecosystem_state.md tras calibración FULL-PASS

```markdown
# Estado del Ecosistema de Templates
<!-- Actualizado por calibrate-templates — [FECHA ISO] — FULL-PASS -->
<!-- Vive en ai_docs/_meta/ (managed-by-tooling, NO project memory) -->

## Inventario
**Commands (.claude/commands/):** [N] archivos
- [lista de archivos .md]

**Skills (.claude/skills/):** [M] skills
- [lista de carpetas de skills]

**Agentes (.claude/agents/):** [K] archivos
- [lista de archivos .md]

## Hooks Activos
<!-- Leído de .claude/hooks/config.json — los 9 hooks deployables -->
- context_monitor: [true/false]
- prompt_guard: [advisory/block/false]
- read_injection_scanner: [true/false]
- scaffolding_guard: [true/false]
- task_doc_validator: [true/false]
- session_state: [true/false]
- sprint_sync: [advisory/block/false]
- sprint_doc_validator: [true/false/advisory/block]
- core_context_loader: [true/false]

## Stack Calibrado
- **Lenguaje:** [versión exacta]
- **Framework:** [versión exacta]
- **Base de Datos:** [tipo + versión]
- **Gestor de Paquetes:** [nombre]
- **Testing:** [framework + comando]
- **Linting:** [herramienta]

## Última Calibración
- **Fecha:** [FECHA ISO]
- **Modo:** FULL-PASS | INCREMENTAL
- **Git HEAD:** [SHA corto]
- **Plantillas modificadas:** [N]
- **Plantillas eliminadas:** [N]
```

---

## Fase 4: Validación

### Alcance según modo
**Si modo INCREMENTAL:** validar solo:
- Frontmatter de los archivos modificados en este sync
- Cross-references que involucran archivos modificados (búsqueda inversa: ¿alguien que se conserva referencia a un archivo de la lista? ¿la referencia sigue siendo válida?)
- Campo `skills:` en frontmatter de agentes (siempre, es barato — confirma que las skills listadas siguen desplegadas tras el sync)
- Saltar validación full sobre toda la matriz de templates

**Si modo FULL-PASS:** validar todo el checklist completo.

### Verificar Calidad de la Calibración

- [ ] Solo quedan plantillas relevantes al stack en `.claude/commands/`, `.claude/skills/` y `.claude/agents/` *(solo FULL-PASS — sync no elimina)*
- [ ] No existen referencias cruzadas a plantillas eliminadas en los archivos restantes
- [ ] Prerequisitos entre skills verificados (ej. skills ADK requieren agente `adk`)
- [ ] Campo `skills:` en frontmatter de agentes (git-guardian, adk) apunta a skills desplegadas
- [ ] Frontmatter YAML de skills y agentes preservado (name, description, skills)
- [ ] Valores específicos del proyecto están pre-llenados (sin placeholders genéricos en secciones modificadas)
- [ ] Reglas del proyecto de CLAUDE.md están inyectadas en plantillas relevantes
- [ ] Áreas de riesgo reflejan historial real de git (no adivinadas) *(solo FULL-PASS — INCREMENTAL reutiliza)*
- [ ] Calibración documentada en `ai_docs/_meta/calibration_log.md` con campo `Modo:`
- [ ] Sin información sensible incluida (sin contraseñas, API keys, secretos)

### Presentar al Usuario

```
Calibración de Plantillas Completa

**Stack:** [Framework X.Y] + [Base de Datos] + [Gestor de Paquetes]
**Plantillas conservadas:** [N] comandos | [M] skills | [K] agentes
**Plantillas eliminadas:** [X] (no relevantes para este stack)
**Plantillas modificadas:** [Y] (rutas, referencias y contexto actualizados)
**Áreas de Riesgo:** [top 2-3 archivos calientes inyectados en plantillas relevantes]

Cambios realizados:
- Eliminados: [lista de archivos eliminados]
- Modificados: [lista de archivos modificados con resumen de 1 línea de qué cambió]
- Documento de calibración: `ai_docs/_meta/calibration_log.md`

**Siguiente paso:** La calibración ha concluido. El siguiente paso es la validación post-calibración con la skill `onboarding` (invocada automáticamente por el script si corre desde el pipeline).
```
