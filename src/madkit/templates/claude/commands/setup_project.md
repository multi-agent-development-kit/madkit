# Setup de Proyecto

> **Propósito:** Bootstrap completo de la infraestructura de documentación `ai_docs/` + análisis profundo — Fase 1 mecánica (crea estructura `ai_docs/{core,tasks,refs}/`, copia `CLAUDE.md.template`, despliega scaffolding, instala hooks opt-in si procede) + Fases 0/2/3/4/5 analíticas (reconocimiento del stack, inventario y calidad de docs core, drift, reporte con plan de acción). **Requiere razonamiento LLM en las fases analíticas.**

> **Cuándo usar:** En cualquier proyecto nuevo o existente que aún no tiene `ai_docs/` configurado. Re-ejecutar si se sospecha que la documentación está desactualizada respecto al código.

> **Flujo recomendado:**
> - **Proyecto nuevo:** `setup_project` → template `01_generar_idea_maestra.md` (pipeline 01-08) → skill `calibrate-templates`
> - **Proyecto existente:** `setup_project` → template `00_incorporacion_proyecto.md` (reconocimiento + scope) → templates selectivos según scope → skill `calibrate-templates`

---

## Fase 0: Reconocimiento del Proyecto

<!-- AI Agent: ANTES de tocar archivos, entender el contexto del proyecto. Leer fuentes de verdad existentes y hacer preguntas al usuario para rellenar vacíos. Esta fase es de LECTURA y DIÁLOGO — no modificar nada todavía. -->

### 0.1 Lectura de Fuentes de Verdad

```bash
# 1. Instrucciones del proyecto (fuente primaria de convenciones y restricciones)
cat CLAUDE.md 2>/dev/null || echo "NO ENCONTRADO: CLAUDE.md"
cat .cursorrules 2>/dev/null || echo "NO ENCONTRADO: .cursorrules"

# 1b. Detectar ai_docs/ huérfanos en padres e hijos (split-workspace y monorepo post-hoc)
# Busca ai_docs/ canónico y variantes de naming case-insensitive
find ../ -maxdepth 2 -type d -iname "ai_docs" 2>/dev/null     # ai_docs en directorio padre
find . -maxdepth 3 -type d -iname "ai_docs" 2>/dev/null       # ai_docs en hijos visibles
# Variantes de naming no canónicas
find . -maxdepth 3 -type d \( -iname "ai-docs" -o -iname "ai_doc" -o -iname "AIDocs" \) 2>/dev/null
# Si se encuentra ≥1 candidato fuera del cwd O alguna variante de naming:
# → Presentar lista al usuario y preguntar antes de crear estructura nueva:
#   (a) Usar el existente declarándolo en .claude/.ai_docs_path
#   (b) Migrar contenido al cwd canónico
#   (c) Crear nuevo (requiere confirmación explícita — deja el otro huérfano)
# Si variante de naming encontrada: preguntar si renombrar a canónico ai_docs/
# NO renombrar automáticamente — puede romper referencias en CLAUDE.md o scripts del proyecto.

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

<!-- AI Agent: Detectar split-workspace ANTES de crear directorios.
     En proyectos canónicos (cwd == git toplevel) el bloque de detección no actúa. -->

```bash
# Detección de split-workspace antes de crear ai_docs/
GIT_TOPLEVEL=$(git rev-parse --show-toplevel 2>/dev/null)
CURRENT_DIR=$(pwd)

if [ -n "$GIT_TOPLEVEL" ] && [ "$GIT_TOPLEVEL" != "$CURRENT_DIR" ]; then
  # cwd está dentro de un git repo pero NO en su toplevel — split-workspace potencial.
  # Presentar opciones al usuario:
  #   (1) Usar git toplevel (recomendado): ai_docs/ vive junto al código
  #   (2) Usar cwd actual: .claude/ y ai_docs/ coexisten en el mismo directorio
  #   (3) Especificar otro subdirectorio git
  # Según la elección: hacer cd <ruta_elegida> y escribir .claude/.ai_docs_path si no es cwd.
  echo "SPLIT-WORKSPACE detectado: git toplevel=$GIT_TOPLEVEL, cwd=$CURRENT_DIR"
  echo "→ Preguntar al usuario dónde debe vivir ai_docs/ antes de continuar."
elif [ -z "$GIT_TOPLEVEL" ]; then
  # No estamos en ningún repo git — buscar subdirectorios git visibles.
  SUB_REPOS=$(find . -maxdepth 2 -type d -name ".git" 2>/dev/null | sed 's|/.git||')
  if [ -n "$SUB_REPOS" ]; then
    echo "No-git cwd con subdirectorios git detectados: $SUB_REPOS"
    echo "→ Preguntar al usuario cuál es el 'project root' para Claude Code."
  else
    echo "No-git cwd sin subdirectorios git visibles."
    echo "→ Preguntar al usuario dónde quiere que viva ai_docs/."
  fi
  # En cualquiera de los dos casos anteriores: crear .claude/.ai_docs_path
  # con la ruta absoluta elegida antes de los mkdir -p.
fi
# Si GIT_TOPLEVEL == CURRENT_DIR → caso canónico. NO crear .ai_docs_path. Continuar.
```

**Acción según resultado:**

| Caso | Acción |
|---|---|
| `GIT_TOPLEVEL == CURRENT_DIR` | Caso canónico — NO crear `.ai_docs_path`. Continuar con `mkdir -p` en cwd. |
| `GIT_TOPLEVEL != CURRENT_DIR` (detectado) | Presentar 3 opciones al usuario. Crear `.claude/.ai_docs_path` con la ruta elegida. |
| No-git cwd + subdirs git visibles | Presentar opciones de subdir. Crear `.claude/.ai_docs_path` con la ruta elegida. |
| No-git cwd + sin subdirs git | Preguntar al usuario explícitamente "¿dónde quieres que viva `ai_docs/`?". Crear `.ai_docs_path` con la ruta indicada. |

**Crear `.claude/.ai_docs_path` (solo en casos no-canónicos):**

```bash
# Escribir .claude/.ai_docs_path con la ruta absoluta elegida (texto plano UTF-8)
# Ejemplo si el usuario elige /home/user/mi-proyecto como root de ai_docs/:
echo "/home/user/mi-proyecto/ai_docs" > .claude/.ai_docs_path
# El archivo NO se crea en proyectos canónicos (cwd == git toplevel).
```

```bash
# Crear estructura canónica (mkdir -p es idempotente)
# Si se eligió ruta no-canónica, hacer cd a esa ruta antes de los mkdir -p
mkdir -p ai_docs/core         # project memory: 4 docs canónicos (ver CLAUDE.md §"Inventario canónico de ai_docs/core/")
mkdir -p ai_docs/_meta        # operativos managed-by-tooling: ecosystem_state, setup_report, framework_versions
mkdir -p ai_docs/core_templates   # pipeline opcional per-proyecto (NO se distribuye desde el meta-repo)
mkdir -p ai_docs/tasks
mkdir -p ai_docs/sprints      # roadmaps de épicas opcionales
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

**Carpetas estándar esperadas:** `core/`, `_meta/`, `core_templates/`, `tasks/`, `sprints/`, `refs/`, `dev_templates/`

Si se detectan carpetas no estándar (ej. `ai_docs/old/`, `ai_docs/backup/`, `ai_docs/archive/`):
- Listar contenido brevemente
- Preguntar al usuario si deben migrarse, conservarse o eliminarse

### 1.5 Verificar / Generar CLAUDE.md Base

<!-- AI Agent: Garantizar que el proyecto tiene un CLAUDE.md con guidance transversal (estilo de respuesta, asignación de modelo, delegación a subagentes). Si falta, ofrecer generarlo desde el template del framework. -->

```bash
# Detectar CLAUDE.md existente
ls CLAUDE.md 2>/dev/null

# Detectar template base del framework (desplegado junto con las plantillas)
ls .claude/CLAUDE.md.template 2>/dev/null
```

**Reglas:**

| Condición | Acción |
|---|---|
| `CLAUDE.md` existe + tiene secciones "Estilo de respuesta", "Modelo por perfil de trabajo", "Cuándo delegar a subagentes" | Registrar: "CLAUDE.md presente y completo" — no hacer nada |
| `CLAUDE.md` existe pero faltan secciones del template | **Preguntar al usuario** antes de mergear. Proponer añadir las secciones faltantes sin tocar el resto |
| `CLAUDE.md` NO existe + template disponible | Copiar `CLAUDE.md.template` → `CLAUDE.md`. Los placeholders `[entre corchetes]` se rellenan en Fase 3.3 de la skill `calibrate-templates`. Registrar: "CLAUDE.md generado desde template — placeholders pendientes de calibración" |
| `CLAUDE.md` NO existe + template NO disponible | Registrar: "CLAUDE.md faltante y template no disponible — recomendar redesplegar plantillas" |

**Regla crítica:** NUNCA sobrescribir un `CLAUDE.md` existente sin confirmación del usuario — puede contener reglas del proyecto que el template genérico no cubre.

### 1.6 Hooks deployables (opt-in)

<!-- AI Agent: Ofrecer instalación de hooks opcionales del framework. Cero por defecto — el usuario elige. Ver .claude/hooks/README.md para inventario completo. -->

```bash
# Detectar disponibilidad de los hooks ya instalados
ls .claude/hooks/ 2>/dev/null
```

**Si los hooks están disponibles, preguntar al usuario:**

```
¿Instalar hooks deployables? (ver `.claude/hooks/README.md`)
  [a] Sí, todos (context-monitor + prompt-guard + read-injection-scanner + scaffolding-guard + task-doc-validator + session-state + sprint-doc-validator + sprint-sync + core-context-loader) — loop completo + defense-in-depth WRITE+READ + bidireccionalidad sprint + contexto de core/ en SessionStart
  [b] Solo planning (task-doc-validator + scaffolding-guard + sprint-sync) — refuerza calidad de task docs, commits y coherencia con sprints
  [c] Solo seguridad (prompt-guard + read-injection-scanner + scaffolding-guard) — capa completa WRITE-time y READ-time
  [d] Solo visibilidad y continuidad (context-monitor + session-state) — escribe + lee STATE.md
  [e] No, configurar manualmente luego
  [f] Solo session-state — útil si ya tienes context-monitor activo y quieres cerrar el loop
  [g] Solo read-injection-scanner — advisory READ-time para sesiones largas con context compression
  [h] Solo sprint-sync — advisory bidireccionalidad task↔sprint, útil si el proyecto usa la skill roadmap-generator
  [i] Solo core-context-loader — inyecta ai_docs/core/ en cada SessionStart; cierra el gap de coherencia con contratos del proyecto
Por defecto: [e]
```

**Acciones según elección:**

| Opción | Hooks copiados | Flags activadas en `.claude/hooks/config.json` |
|---|---|---|
| a | los 9 | `context_monitor: true`, `prompt_guard.mode: "advisory"`, `read_injection_scanner: true`, `scaffolding_guard: true`, `task_doc_validator: true`, `session_state: true`, `sprint_doc_validator.mode: "advisory"`, `sprint_sync.mode: "advisory"`, `core_context_loader: true` |
| b | task-doc-validator + scaffolding-guard + sprint-sync | `task_doc_validator: true`, `scaffolding_guard: true`, `sprint_sync.mode: "advisory"` |
| c | prompt-guard + read-injection-scanner + scaffolding-guard | `prompt_guard.mode: "advisory"`, `read_injection_scanner: true`, `scaffolding_guard: true` |
| d | context-monitor + session-state | `context_monitor: true`, `session_state: true` |
| e | ninguno | (no se crea config.json) |
| f | session-state | `session_state: true` |
| g | read-injection-scanner | `read_injection_scanner: true` |
| h | sprint-sync | `sprint_sync.mode: "advisory"` |
| i | core-context-loader | `core_context_loader: true` |

**Si el usuario elige a/b/c/d/f/g/h/i:**

```bash
# Crear directorio destino (si no existe)
mkdir -p .claude/hooks

# Los hooks viajan con el comando sync-upstream-trigger (script sync_templates.{ps1,sh}).
# Verificar presencia. Si faltan, abortar Fase 1.6 con instrucción accionable.
HOOKS_REQUIRED="hook-runner.js context-monitor.js prompt-guard.js read-injection-scanner.js scaffolding-guard.sh scaffolding-guard.ps1 scaffolding-guard.js task-doc-validator.js session-state.sh session-state.ps1 sprint-doc-validator.js sprint-sync.js core-context-loader.sh core-context-loader.ps1"
HOOKS_MISSING=""
for h in $HOOKS_REQUIRED; do
  [ -f ".claude/hooks/$h" ] || HOOKS_MISSING="$HOOKS_MISSING $h"
done

if [ -n "$HOOKS_MISSING" ]; then
  echo "Hooks faltantes en .claude/hooks/:$HOOKS_MISSING"
  echo "Ejecutar el comando sync-upstream-trigger antes de continuar Fase 1.6 — los hooks se copian desde upstream, no se generan en setup."
  exit 1
fi

# Generar config.json desde el example si no existe aún
[ -f .claude/hooks/config.json ] || cp .claude/hooks/config.example.json .claude/hooks/config.json
# Editar config.json para activar solo las flags correspondientes a la opción
```

**Detección preventiva de runtimes:** los hooks JS requieren Node ≥20 disponible para Claude Code al spawnear el shell. Antes de wirear:

```bash
NODE_OK=$(command -v node >/dev/null 2>&1 && node --version 2>/dev/null || echo "MISSING")
[ "$NODE_OK" = "MISSING" ] && echo "WARN: node no resuelto en este shell — los hooks JS fallarán silenciosos. Instalar Node ≥20 antes de usar la wiring."
# Mismo check opcional para 'bash' (POSIX) y 'pwsh' (Windows) según sistema operativo del destino.
```

Advertir al usuario sin abortar — los hooks tienen exit silencioso de fábrica, pero los errores `MODULE_NOT_FOUND` cuando node está ausente NO son silenciosos en Claude Code; mejor que el usuario lo sepa antes.

**Generar `.claude/settings.json` automáticamente** con paths absolutos `$CLAUDE_PROJECT_DIR/.claude/hooks/<file>` (cwd-independent). Idempotente: si `settings.json` ya existe, merge en lugar de overwrite — preservar claves `permissions`, `env`, etc.

> **Tabla canónica replicada.** El mapping hook→matcher de abajo se duplica en `scripts/sync_templates.{sh,ps1}` Paso 1.8 (auto-wiring de hooks nuevos al sincronizar upstream). Test cross-file `claude-templates/hooks/tests/settings-wiring.test.js` A1 valida que ambas tablas no diverjan. Si añades un hook nuevo aquí, actualiza la tabla en ambos scripts (y el test).

```bash
SETTINGS=".claude/settings.json"

# Construir el bloque hooks JSON según opción elegida (a/b/c/d/f/g/h/i).
# Los 4 hooks JS de Write|Edit (prompt-guard, task-doc-validator, sprint-sync,
# sprint-doc-validator) se BUNDLEAN en un único spawn de Node vía hook-runner.js
# (in-process). Reduce p95 de 717ms→150ms en Windows (evita 4× escaneos AV
# concurrentes). Los hooks PostToolUse y SessionStart no se bundlean: cada uno
# está solo en su matcher.
# Ejemplo opción [a] = los 9 hooks:
NEW_HOOKS=$(cat <<'EOF'
{
  "PreToolUse": [
    {"matcher": "Write|Edit", "hooks": [{"type": "command", "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/hook-runner.js\" prompt-guard task-doc-validator sprint-sync sprint-doc-validator"}]},
    {"matcher": "Bash|PowerShell", "hooks": [{"type": "command", "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/scaffolding-guard.js\""}]}
  ],
  "PostToolUse": [
    {"matcher": "*", "hooks": [{"type": "command", "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/context-monitor.js\""}]},
    {"matcher": "Read", "hooks": [{"type": "command", "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/read-injection-scanner.js\""}]}
  ],
  "SessionStart": [
    {"hooks": [{"type": "command", "command": "bash \"$CLAUDE_PROJECT_DIR/.claude/hooks/session-state.sh\""}]},
    {"hooks": [{"type": "command", "command": "bash \"$CLAUDE_PROJECT_DIR/.claude/hooks/core-context-loader.sh\""}]}
  ]
}
EOF
)

# Para Windows nativo: reemplazar 'bash "$CLAUDE_PROJECT_DIR/...sh"' por
#   pwsh -File "$env:CLAUDE_PROJECT_DIR\.claude\hooks\<file>.ps1"
# en session-state y core-context-loader.
# scaffolding-guard usa node (scaffolding-guard.js) — cross-platform, no requiere sustitución.

# Merge idempotente
if [ -f "$SETTINGS" ]; then
  # Merge con node (ya disponible en el destino). Preserva claves no-hooks.
  node -e "
    const fs=require('fs');
    const cur=JSON.parse(fs.readFileSync('$SETTINGS','utf8'));
    const add=$NEW_HOOKS;
    cur.hooks = Object.assign({}, cur.hooks||{}, add);
    fs.writeFileSync('$SETTINGS', JSON.stringify(cur, null, 2));
  " || { echo "ERROR: no se pudo mergear settings.json"; exit 1; }
else
  mkdir -p .claude
  printf '{\n  "hooks": %s\n}\n' "$NEW_HOOKS" > "$SETTINGS"
fi

# Validar JSON resultante (rollback con .bak si parser falla)
node -e "JSON.parse(require('fs').readFileSync('$SETTINGS','utf8'))" || { echo "ERROR: settings.json invalido tras merge"; exit 1; }
```

Para opciones b/c/d/f/g/h/i incluir solo los triggers de los hooks correspondientes a la opción (ver tabla §Acciones según elección). Mismo esquema `$CLAUDE_PROJECT_DIR`.

**Documentar en el reporte final:**
- Hooks instalados (lista de archivos copiados)
- Opción elegida (a/b/c/d/e/f/g/h/i)
- Wiring `settings.json` generada (o `--no-wiring` si el usuario opted out)
- Resultado de detección de runtimes (`node` / `bash` / `pwsh` disponibles o WARN)
- Flag para troubleshooting: si un hook tarda más de su timeout duro, exit silencioso (no rompe flujo del agent). Errores `MODULE_NOT_FOUND` post-wiring → verificar que `node` resuelve en el shell que usa Claude Code y que `$CLAUDE_PROJECT_DIR` se expande (no es una limitación de los hooks, es del entorno del shell)

**Regla:** los hooks NO cuentan como templates. El conteo total de templates del framework no cambia tras instalarlos.

---

### 1.7 Contexto de arranque en CLAUDE.md

<!-- AI Agent: Basándose en el perfil detectado en Fase 0, añadir al CLAUDE.md copiado
     (antes de "## Prohibiciones del proyecto") un bloque "## Contexto de arranque".
     Idempotente: si el bloque ya existe (grep "## Contexto de arranque"), omitir. -->

**Detección (usar datos de Fase 0):**
- `nuevo`: commits = 0 O `ai_docs/core/master_idea.md` no existe
- `sprint-activo`: `ai_docs/sprints/*.md` con status != COMPLETADO
- `brownfield`: cualquier otro caso (fallback conservador)

**Bloque a inyectar según tipo:**

- **NUEVO** → `**Primera acción:** completar \`ai_docs/core/master_idea.md\` → skill \`calibrate-templates\` → \`task-planner\` con la primera feature.`
- **BROWNFIELD** → `**Primera acción:** \`researcher\` sobre el módulo con más actividad reciente (\`git log --since="30 days ago"\`) → \`doc-syncer\` → \`task-planner\`.`
- **SPRINT ACTIVO** → `**Primera acción:** leer \`ai_docs/sprints/NN_*.md\` → verificar wave pendiente → \`plan-checker × N\` paralelo → \`implementer × N\`.`

**Registro:** añadir al log de Fase 5: `"Contexto de arranque inyectado: [tipo]"`.

---

## Fase 2: Inventario y Evaluación de Documentación Core

<!-- AI Agent: Análisis exhaustivo de CADA documento en ai_docs/core/. LEER el contenido real de cada archivo — no limitarse a verificar existencia. Evaluar calidad con criterios objetivos. -->

### 2.1 Inventario Canónico de Documentos Core

**Project memory (`ai_docs/core/`) — 4 docs canónicos. Ver `CLAUDE.md` §"Inventario canónico de ai_docs/core/" para la SSOT.**

| Prioridad | Documento | Propósito en la Ingeniería del Software | Generador inicial |
|-----------|-----------|------------------------------------------|-------------------|
| **P0 — mandatorio** | `master_idea.md` | Visión, problema, usuarios, modelo de negocio, MVP, scope negativo, restricciones, user stories. Documento fundacional. | Pipeline del proyecto (si existe `core_templates/`) o redacción manual |
| **P0 — mandatorio** | `architecture.md` | Diagrama, capas, contratos entre módulos, stack, rutas, patrones backend, seguridad, deployment. | Pipeline del proyecto o manual |
| **P0 — mandatorio** | `data_models.md` | Schemas, entidades, relaciones, campos canónicos, decisiones de schema. | Pipeline del proyecto o manual |
| **P1 — lazy** | `decisions.md` | ADRs y decisiones aceptadas con justificación. | `doc-syncer` lo crea al detectar primera decisión nueva en el diff |

**Operativos managed-by-tooling (`ai_docs/_meta/`):**

| Documento | Propietario | Lifecycle |
|-----------|-------------|-----------|
| `_meta/ecosystem_state.md` | `calibrate-templates` Fase 3.6 | Sync-driven (creado por Fase 5.3 si no existe) |
| `_meta/setup_report.md` | `/setup_project` Fase 5.1 | One-shot al bootstrap |
| `_meta/framework_versions.md` | Manual / pipeline del proyecto | Cambia con upgrades del stack |

**Documentos NO canónicos (opcionales por proyecto):** `app_pages_and_functionality`, `wireframe`, `ui_theme`, `app_name`, `roadmap`. Si el proyecto los genera, viven como sub-secciones de `architecture.md` o como archivos opcionales **fuera** del scope de `doc-syncer` y del hook `core-context-loader`.

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
architecture.md                | ✅/⚠️/❌ | N    | N            | Actual/Desact | Ninguna/Actualizar/Generar
data_models.md                 | ✅/⚠️/❌ | N    | N            | Actual/Desact | Ninguna/Actualizar/Generar
decisions.md                   | ✅/⚠️/❌ | N    | N            | Actual/Desact | Lazy-create (doc-syncer)
```

### 2.3 Verificación de Coherencia entre Documentos

<!-- AI Agent: Los 4 docs canónicos no son independientes. Verificar que la información es consistente entre ellos. -->

**Verificaciones de coherencia (solo si existen ambos documentos):**

1. **`master_idea.md` ↔ `data_models.md`:** ¿Las entidades del schema cubren todas las funcionalidades del MVP? ¿El modelo de negocio está reflejado en campos de billing/suscripción?
2. **`master_idea.md` ↔ `architecture.md`:** ¿La arquitectura respeta las restricciones de presupuesto/equipo/infra? ¿El stack soporta los user stories del MVP?
3. **`data_models.md` ↔ `architecture.md`:** ¿La arquitectura soporta el modelo de datos (ORM, tipo de BBDD)? ¿Las capas técnicas mencionadas en arquitectura coinciden con los entry points para los modelos?
4. **`decisions.md` (si existe) ↔ resto:** ¿Las decisiones aceptadas reflejan los trade-offs reales aplicados en arquitectura/data_models?

**Registrar inconsistencias encontradas para el reporte.**

**Nota sobre legacy:** si el proyecto tiene archivos con nombres del esquema antiguo (`system_architecture.md`, `initial_data_schema.md`, `app_pages_and_functionality.md`, `wireframe.md`, `ui_theme.md`, `app_name.md`), listar al usuario y preguntar si quiere migrar al inventario canónico — **nunca renombrar silentemente.**

### 2.4 Verificar Disponibilidad de Pipeline Templates (per-proyecto)

```bash
# Comprobar si existen core_templates en este proyecto
# Nota: ai_docs/core_templates/ es PER-PROYECTO. NO se distribuye desde el meta-repo
# vía sync-upstream-trigger — cada repo trae su propio pipeline si lo necesita.
ls ai_docs/core_templates/ 2>/dev/null
```

**Si el proyecto tiene `ai_docs/core_templates/` poblado:** los templates son fuente del proyecto, no del framework. Sus salidas DEBEN alinearse con el inventario canónico (`master_idea.md`, `architecture.md`, `data_models.md`, `decisions.md`); si emiten nombres distintos (legacy `system_architecture.md`, etc.), recomendar al usuario que rename los outputs o declare la divergencia en `CLAUDE.md` §"Convenciones del proyecto".

**Si NO existen `core_templates/`:** generación manual del usuario o pipeline traído por el equipo. Recomendar al menos `master_idea.md` antes de avanzar — sin él, los subagents trabajan a ciegas sobre la visión del producto.

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

**Si `data_models.md` existe:** Comparar entidades documentadas vs entidades en código.
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
# Documentos de diseño (generados por el command /adk_orchestrator_template)
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
- Si faltan documentos de diseño → "Invocar `/adk_orchestrator_template` para cada agente principal"
- Si falta documentación de referencia → "Copiar documentación del SDK a `ai_docs/refs/adk-python/`"
- Si hay agentes sin cobertura de diseño → Listar específicamente cuáles

---

## Fase 5: Resumen y Plan de Acción

<!-- AI Agent: Consolidar TODOS los hallazgos en un reporte técnico estructurado. El reporte debe ser accionable — cada item debe indicar QUÉ hacer y CON QUÉ herramienta. -->

### 5.1 Generar Reporte Técnico

**Salida:** `ai_docs/_meta/setup_report.md` (managed-by-tooling — NO project memory; doc-syncer NO lo toca)

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
| master_idea.md | P0 | ✅/⚠️/❌ | N | N | Actual/Desact | Ninguna/Actualizar/Generar (pipeline del proyecto o manual) |
| architecture.md | P0 | ✅/⚠️/❌ | N | N | Actual/Desact | Ninguna/Actualizar/Generar |
| data_models.md | P0 | ✅/⚠️/❌ | N | N | Actual/Desact | Ninguna/Actualizar/Generar |
| decisions.md | P1 lazy | ✅/⚠️/❌ | N | N | Actual/Desact | Lazy-create por doc-syncer |

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
3. **[P1]** Activar la skill `calibrate-templates` para adaptar plantillas al stack [stack detectado] (auto-activa post-setup o invocar por nombre)
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

Reporte técnico guardado en: ai_docs/_meta/setup_report.md

Acciones inmediatas:
1. [primera acción prioritaria con comando/ruta específica]
2. [segunda acción]

Próximo paso recomendado:
- Si proyecto NUEVO: Ejecutar template `01_generar_idea_maestra.md` para crear la documentación fundacional.
- Si proyecto EXISTENTE: Ejecutar template `00_incorporacion_proyecto.md` para reconocimiento y scope.
- Después de generar documentación core: La skill `calibrate-templates` auto-activa al detectar drift; o invocarla por nombre para adaptar las plantillas al stack.
```

### 5.3 Crear ecosystem_state.md inicial (en proyecto destino)

<!-- AI Agent: Crear el archivo de estado persistente del ecosistema de templates en ai_docs/_meta/.
     Este archivo es propiedad de la skill calibrate-templates (Fase 3.6) y vive en _meta/ — NO en core/ —
     porque es operativo managed-by-tooling, no project memory. doc-syncer NUNCA lo toca. -->

```bash
# Verificar que ai_docs/_meta/ existe (Fase 1.2 lo garantiza)
if [ ! -d "ai_docs/_meta" ]; then
  echo "ERROR: ai_docs/_meta/ no existe. Ejecutar Fase 1 primero antes de Fase 5.3."
  exit 1
fi

# Crear solo si no existe (preservar contenido custom si ya fue creado manualmente)
if [ -f "ai_docs/_meta/ecosystem_state.md" ]; then
  echo "SKIP: ai_docs/_meta/ecosystem_state.md ya existe — preservando contenido custom."
else
  echo "Creando ai_docs/_meta/ecosystem_state.md con plantilla minimal..."
fi
```

**Si no existe, crear con la plantilla minimal de 4 secciones:**

```markdown
# Estado del Ecosistema de Templates
<!-- Auto-generado por setup_project Fase 5.3 -->
<!-- Actualizado por la skill calibrate-templates en cada calibración -->
<!-- Operativo managed-by-tooling — doc-syncer NO escribe aquí -->

## Inventario
<!-- Rellenar por calibrate-templates en primera calibración (FULL-PASS). -->
<!-- Formato esperado: N commands | M skills | K agentes (lista detallada) -->

## Hooks Activos
<!-- Rellenar por calibrate-templates en primera calibración. -->
<!-- Formato esperado: lista de flags true en .claude/hooks/config.json -->

## Stack Calibrado
<!-- Rellenar por calibrate-templates en primera calibración. -->
<!-- Formato esperado: Lenguaje X.Y / Framework X.Y / BBDD / Gestor de paquetes -->

## Última Calibración
<!-- Fecha y modo (FULL-PASS / INCREMENTAL) rellenados por calibrate-templates. -->
<!-- Formato: YYYY-MM-DD — FULL-PASS | INCREMENTAL — git HEAD: [SHA corto] -->
```

**Registrar en el reporte final:**
- Si se creó: "ecosystem_state.md creado en ai_docs/_meta/ — pendiente de rellenar por la skill calibrate-templates"
- Si se saltó (ya existía): "ecosystem_state.md existente preservado — la skill calibrate-templates actualizará las secciones gestionadas"

**Nota:** Este archivo **no** entra en la secuencia numerada de tasks (`ai_docs/tasks/`). Vive en `ai_docs/_meta/` (managed-by-tooling), no en `ai_docs/core/` (project memory). No commitear — `ai_docs/` está en `.gitignore`.
