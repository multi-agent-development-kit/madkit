# Hooks deployables

Hooks instalables opcionalmente en proyectos destino para reforzar tres ejes: visibilidad de contexto, defense-in-depth contra inyecciones, y validación mecánica de artefactos del proyecto. Son **complementarios** a las skills y subagents — no los reemplazan.

Los hooks son **opt-in**: por defecto un proyecto destino no instala ninguno. `setup_project` los ofrece como bloque interactivo. Cada hook revisa `.claude/hooks/config.json` antes de activarse y termina silenciosamente si su flag es `false` o ausente.

---

## Inventario (9 hooks)

| Hook | Trigger | Acción | Opt-in flag | Severidad |
|---|---|---|---|---|
| `context-monitor.js` | PostToolUse | Inyecta WARN ≤35% restante / CRITICAL ≤25% / breadcrumb a `ai_docs/STATE.md` ≤10% | `context_monitor: true` | Advisory |
| `prompt-guard.js` | PreToolUse en Read/Write/Edit a `ai_docs/` | Detecta 14 patrones de inyección + Unicode invisible | `prompt_guard.mode: "advisory"\|"block"` | Advisory por defecto |
| `read-injection-scanner.js` | PostToolUse en Read | Escanea contenido devuelto por Read en busca de 13 patrones de inyección estándar + 4 patrones "summarization-survival"; severidad LOW (1-2 matches) o HIGH (3+) emitida vía `additionalContext`. Excluye `.claude/hooks/`, `ai_docs/refs/`, `ai_docs/tasks/`. | `read_injection_scanner: true` | Advisory |
| `scaffolding-guard.js` / `.sh` / `.ps1` | PreToolUse en Bash `git commit` | Bloquea commits con (a) archivos en `ai_docs/.claude/.cursor/` (override por directorio vía `excluded_dirs`); (b) `Co-Authored-By:` con `Claude` o `anthropic`; (c) mensaje no conforme a `<type>: <subject>` con fallback robusto a `-F file`, ANSI-C, heredoc y git log. `.js` es la variante recomendada: zero I/O para el 99% de Bash calls (early-return pre-regex), bundleable via hook-runner. | `scaffolding_guard: true` o `{ enabled: true, excluded_dirs: [] }` | Bloqueante |
| `task-doc-validator.js` | PreToolUse en Write/Edit a `ai_docs/tasks/*.md` | Valida numeración, "Criterios de Éxito" (h2/h3) con ≥3 checkboxes, `Depende de:` bien formado, ≥3 casos límite si artifact ejecutable nuevo, 4 Criterios de Calidad de Ingeniería canónicos cuando la task toca código ejecutable, y **Sprint Suffix Coherence**: filename `NNN_sNN_<descriptor>.md` debe coincidir con cabecera `> **Sprint:** NN`; mismatch o sufijo huérfano → `SPRINT_SUFFIX_MISMATCH` BLOCKER. Tasks sin sufijo y sin cabecera = atómicas (válidas). Marker de artifact acepta `(creado)`, `(nuevo)`, `(added)`, `(new)`. Excepción declarable en sección "Riesgos aceptados" / "Decisiones aceptadas" / "Riesgos y mitigaciones". | `task_doc_validator: true` | Bloqueante (estructura) + Advisory (formato menor) |
| `session-state.sh` / `.ps1` | SessionStart | Si `ai_docs/STATE.md` existe y tiene contenido, lee head 20 líneas e inyecta como `additionalContext`. Exit silente si STATE.md ausente o vacío (cero tokens desperdiciados). | `session_state: true` | Advisory |
| `sprint-sync.js` | PreToolUse en Write/Edit a `ai_docs/tasks/*.md` o `ai_docs/sprints/*.md` | Valida bidireccionalidad task↔sprint y overlap `contract.files_touched` entre tasks de la misma wave. Para Edit: re-lee el archivo completo y simula el reemplazo antes de validar. | `sprint_sync.mode: "advisory"\|"block"` | Advisory por defecto |
| `sprint-doc-validator.js` | PreToolUse en Write/Edit a `ai_docs/sprints/*.md` | Valida estructura del sprint doc: `> **Estado:**` único parseable (`SPRINT_STATE_INVALID`), tabla `## 3. Tabla de tasks` con ≥1 fila parseable (`SPRINT_TABLE_MISSING`), bloque Mermaid DAG (`SPRINT_DAG_MISSING`), Lifecycle h2/h3 con fecha apertura (advisory), task count cabecera vs filas tabla (advisory). Defense-in-depth con `sprint-sync.js` (bidireccionalidad) y `plan-checker` D7 (semántica). | `sprint_doc_validator: true` o `{ enabled: true, mode: "advisory"\|"block" }` | Advisory por defecto |
| `core-context-loader.sh` / `.ps1` | SessionStart | Carga MINIMO ESENCIAL de `ai_docs/core/*.md` con whitelist (default `master_idea.md` + `architecture.md`, head 30 c/u) + pointer index del resto de `core/*.md` para read on-demand. Cap total `max_total_lines` (default 400) + cap en bytes `max_bytes` (default 50000 B). NO carga `_meta/`. | `core_context_loader: true` o `{ enabled, head_lines, max_total_lines, max_bytes, essential_files, index_others }` | Advisory |

### Defense-in-depth con skills

- **`scaffolding-guard` + skill `commit`**: el hook bloquea mecánicamente (paths + format de mensaje), los textos del Paso 1 de `commit/SKILL.md` educan al agent. Coexisten. Si el proyecto NO instala el hook, los textos de la skill son la única defensa.
- **`task-doc-validator` + skill `plan-checker`**: el hook valida ESTRUCTURA mecánica del task doc al guardar; la skill valida SEMÁNTICA del plan tras guardar. Capas distintas, cero solapamiento.
- **`context-monitor` + `session-state`**: loop completo de continuidad — el primero ESCRIBE STATE.md cuando contexto baja al 10%; el segundo lo LEE al iniciar la siguiente sesión e inyecta el head al system prompt. Sin `session-state`, STATE.md queda dormido hasta que el usuario o `task-planner` Paso 0 lo abren.
- **`prompt-guard` (write-time, pre-write) + `read-injection-scanner` (read-time, post-ingest)**: capa completa de detección de inyección en ambas direcciones del flujo. `prompt-guard` revisa contenido que el agente está a punto de ESCRIBIR (Write/Edit en `ai_docs/`); `read-injection-scanner` revisa contenido que el agente acaba de LEER (Read en cualquier path no excluido). Mismos patrones inline en cada hook por independencia — capas distintas en momentos distintos del flujo, sin solapamiento.
- **`task-doc-validator` (estructura task + sufijo sNN) + `sprint-doc-validator` (estructura sprint) + `plan-checker` Dimension 7 (semántica D7.1-D7.8) + `sprint-sync` (bidireccionalidad mecánica + overlap files_touched)**: cuatro capas distintas validando coherencia task↔sprint en cuatro momentos distintos. `task-doc-validator` valida que el task doc es **parseable** al guardarlo (estructura + sufijo `_sNN_` vs cabecera Sprint); `sprint-doc-validator` valida que el sprint doc es **parseable** al guardarlo (Estado único, tabla §3, DAG); `plan-checker` D7.6/7.7/7.8 valida que el task es **coherente** con el sprint pre-impl (estado del sprint, topología waves, overlap files_touched cross-task); `sprint-sync` valida que los IDs cruzados existen en ambos lados al guardar (mecánica bidireccional) + overlap files_touched dentro de la misma wave. Sin solapamiento — capas distintas en momentos distintos.
- **`sprint-sync` (overlap mecánico de archivos) + `plan-checker` D7 paso 5 (divergencia semántica de scope sprint↔task)**: dos capas sin solapamiento para la misma invariante de disjunción de scope entre tasks paralelas. `sprint-sync` detecta overlap de `contract.files_touched` entre tasks de la misma wave al escribir el task doc (mecánica, en tiempo de Write/Edit); `plan-checker` D7 paso 5 detecta divergencia de scope declarado entre sprint doc e implementación real (semántica, en tiempo de plan-checker pre-impl). Retrocompatibilidad obligatoria: skip silente si `contract:` ausente o `files_touched:` no declarado.
- **`context-monitor` + `session-state` + `core-context-loader`**: trío que cierra la coherencia entre sesiones. `context-monitor` ESCRIBE `ai_docs/STATE.md` cuando contexto baja al 10% (continuidad de tarea); `session-state` LO LEE en SessionStart inyectando el head al system prompt (continuidad de tarea); `core-context-loader` carga whitelist mínima esencial de `ai_docs/core/*.md` + pointer index del resto en SessionStart (coherencia con contratos del proyecto sin inflar el system prompt). Capas ortogonales: STATE.md = qué estaba haciendo; core/ = qué contratos respeta el proyecto. Sin `core-context-loader`, la conversación principal nunca veía `ai_docs/core/` salvo que el usuario lo escribiera.
- **`task-doc-validator` (estructura) + `plan-checker` D8 Failure Mode Coverage (semántica)**: el hook valida que la sección "Casos límite mínimos" / "Failure Modes" existe con ≥3 entradas concretas (≥30 chars, sin placeholders) cuando la task crea artifact ejecutable nuevo (heurística mecánica); `plan-checker` D8 valida que las entradas son adversariales reales (concreción semántica). Sin solapamiento — el hook es bloqueante mecánico, plan-checker es bloqueante semántico.
- **`task-doc-validator` (estructura) + `plan-checker` D10 Engineering Hygiene Criteria (semántica) + `reviewer` §9 (verdict 1:1) + `task-implementation-review` §10 (cruce final) + `task-planner` Paso 7.4 (auto-inyección)**: cinco capas defensa-en-profundidad para los 4 Criterios de Calidad de Ingeniería canónicos (cleanup exhaustivo de comentarios + dead/legacy code + DRY/KISS/early returns + TDD reutilizando infra). El hook detecta presencia de los 4 substrings canónicos en el task doc cuando cita código ejecutable (mecánica); `plan-checker` D10 valida que cada criterio tiene paso del plan que lo materializa (semántica); `reviewer` §9 emite verdict 1:1 OK/FAIL post-impl con archivo:línea; `task-implementation-review` §10 cruza criterios checkeados [x] contra evidencia citable en el diff; `task-planner` Paso 7.4 inyecta el bloque automáticamente al producir el task doc. Excepción declarable como `Excepción a Criterios de Calidad de Ingeniería: ...` en "Riesgos aceptados" / "Decisiones aceptadas" / "Riesgos y mitigaciones".

---

## Instalación manual

1. **Copiar los hooks deseados al proyecto destino:**

   ```bash
   # POSIX (Linux/macOS) — copia los 9 hooks
   cp claude-templates/hooks/*.{js,sh} <proyecto>/.claude/hooks/
   cp claude-templates/hooks/config.example.json <proyecto>/.claude/hooks/config.json

   # PowerShell (Windows) — copia los 9 hooks (incl. .ps1 de scaffolding/session-state/core-context-loader)
   New-Item -ItemType Directory -Force <proyecto>\.claude\hooks
   Copy-Item claude-templates\hooks\*.js,*.sh,*.ps1 <proyecto>\.claude\hooks\
   Copy-Item claude-templates\hooks\config.example.json <proyecto>\.claude\hooks\config.json
   ```

2. **Editar `<proyecto>/.claude/hooks/config.json`** — activar las flags de los hooks deseados (ver §"Configuración" abajo).

3. **Editar `<proyecto>/.claude/settings.json`** — registrar los triggers. Usar **`$CLAUDE_PROJECT_DIR`** (variable que Claude Code expande al raíz del workspace antes de invocar el shell) con comillas tolerantes a espacios en path. Paths relativos (`.claude/hooks/X.js`) rompen con `MODULE_NOT_FOUND` cuando el `cwd` del tool difiere de la raíz (subagents, isolation, sesiones iniciadas desde subdir):

   ```json
   {
     "hooks": {
       "PreToolUse": [
         {
           "matcher": "Write|Edit",
           "hooks": [{ "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/hook-runner.js\" prompt-guard task-doc-validator sprint-sync sprint-doc-validator" }]
         },
         {
           "matcher": "Bash",
           "hooks": [{ "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/scaffolding-guard.js\"" }]
         }
       ],
       "PostToolUse": [
         {
           "matcher": "*",
           "hooks": [{ "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/context-monitor.js\"" }]
         },
         {
           "matcher": "Read",
           "hooks": [{ "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/read-injection-scanner.js\"" }]
         }
       ],
       "SessionStart": [
         {
           "hooks": [{ "type": "command", "command": "bash \"$CLAUDE_PROJECT_DIR/.claude/hooks/session-state.sh\"" }]
         },
         {
           "hooks": [{ "type": "command", "command": "bash \"$CLAUDE_PROJECT_DIR/.claude/hooks/core-context-loader.sh\"" }]
         }
       ]
     }
   }
   ```

   **`hook-runner.js`** bundlea los 4 hooks Write|Edit en un único spawn Node (~80ms vs ~240ms con invocaciones separadas). Lee `config.json` una sola vez y pasa el objeto a cada hook — elimina 4 reads redundantes por evento. Hooks desactivados se filtran antes de `require()`: no cargan código innecesariamente. **`scaffolding-guard.js`** (Node): zero I/O para el 99% de Bash calls (early-return antes de `git diff`) — ver §Performance.

   **En Windows** reemplazar `bash "$CLAUDE_PROJECT_DIR/...sh"` por `powershell.exe -NonInteractive -File "$CLAUDE_PROJECT_DIR/.claude/hooks/<file>.ps1"` para `session-state` y `core-context-loader`. Node tolera forward slashes en argumentos; mantener `node "$CLAUDE_PROJECT_DIR/.claude/hooks/X.js"` cross-platform. Usar `$CLAUDE_PROJECT_DIR` (sin prefijo `$env:`) — Claude Code expande esa variable antes de pasar el comando al shell.

   **Por qué `$CLAUDE_PROJECT_DIR`:** Claude Code inyecta esa variable al spawnear el shell de cada hook, apuntando al raíz del workspace. Con paths relativos, Node resuelve `.claude/hooks/X.js` desde el `cwd` del proceso shell — que puede no ser la raíz (ej. tras `PostToolUse:Agent` cuando el subagent corrió con cwd alterado), causando `Error: Cannot find module ... node:internal/modules/cjs/loader:1479`. Las comillas son obligatorias para tolerar workspaces en paths con espacios (`C:\Code Projects\…`).

---

## Configuración (`.claude/hooks/config.json`)

Esquema de flags por hook. Ver `config.example.json` para una plantilla completa.

```json
{
  "context_monitor": true,
  "prompt_guard": {
    "mode": "advisory"
  },
  "read_injection_scanner": false,
  "scaffolding_guard": true,
  "task_doc_validator": true,
  "session_state": true,
  "sprint_sync": { "mode": "advisory" },
  "sprint_doc_validator": { "enabled": true, "mode": "advisory" },
  "core_context_loader": false
}
```

| Flag | Tipo | Default si ausente | Efecto |
|---|---|---|---|
| `context_monitor` | bool | `false` | Activa el monitor de contexto y la escritura de `ai_docs/STATE.md` |
| `prompt_guard.mode` | `"advisory"` \| `"block"` | hook desactivado | `advisory` solo logea + nota al agent. `block` impide la operación |
| `read_injection_scanner` | bool | `false` | Activa el scan de patrones de inyección en contenido devuelto por Read; advisory only (severity LOW/HIGH) |
| `scaffolding_guard` | bool \| `{enabled, excluded_dirs}` | `false` | Activa el bloqueo de commits no conformes (paths y format de subject). Forma extendida permite excluir directorios de CHECK 1. |
| `task_doc_validator` | bool | `false` | Activa la validación estructural de task docs (numeración, Criterios de Éxito, Casos límite, Engineering Hygiene, sufijo `_sNN_` coherente con cabecera Sprint) |
| `session_state` | bool | `false` | Activa la lectura de `ai_docs/STATE.md` al iniciar sesión y la inyección del head como `additionalContext` |
| `sprint_sync.mode` | `"advisory"` \| `"block"` | hook desactivado | Valida bidireccionalidad task↔sprint y overlap `files_touched` cross-task de misma wave. `advisory` emite WARN; `block` rechaza con exit 2. |
| `sprint_doc_validator` | bool \| `{enabled, mode}` | `false` | Activa la validación estructural de sprint docs (Estado único, tabla §3, DAG Mermaid, Lifecycle advisory, task count). Forma compacta `true` = mode advisory. Forma extendida `{enabled: true, mode: "block"}` rechaza con exit 2 si BLOCKER. |
| `core_context_loader` | bool \| `{enabled, head_lines, max_total_lines, max_bytes, essential_files, index_others}` | `false` | Activa la carga MINIMO ESENCIAL de `ai_docs/core/*.md` en SessionStart como `additionalContext`. Forma compacta `true` usa defaults (whitelist `["master_idea.md","architecture.md"]`, head 30, total cap 400, byte cap 50000, index_others true). Forma extendida permite ajustar `essential_files` (lista de filenames .md), `head_lines` clamp [10,200], `max_total_lines` clamp [50,1000], `max_bytes` clamp [1000,500000], `index_others` (lista los demás `core/*.md` como pointer index). NO carga `_meta/`. |

---

## Cómo desactivar uno sin borrarlo

Editar `.claude/hooks/config.json` y poner la flag correspondiente a `false` (o eliminarla). El hook seguirá registrado en `settings.json` pero terminará silenciosamente con `exit 0` al detectar la flag desactivada.

---

## Lifecycle de `ai_docs/STATE.md`

Introducido por `context-monitor` cuando el contexto restante baja al 10%:

| Acción | Quién | Cuándo |
|---|---|---|
| Crear/actualizar | `context-monitor.js` | `remaining_percentage <= 10` |
| **Leer al inicio** | `session-state.sh` / `.ps1` | SessionStart si flag `session_state: true` |
| Leer en sesión | `task-planner` (Paso 0) y `/status` | Inicio de sesión nueva, lectura tradicional |
| Limpiar | `git-guardian` | Al cerrar el último commit del task referido en `active_task:` |
| Huérfano (>7 días + task cerrado) | `/status` lo flagea, NO se borra automáticamente | Conscious decision para evitar pérdida silenciosa |

Estructura del STATE.md generado:

```markdown
---
active_task: NNN
phase: <fase actual del task doc>
last_action: <último Bash/Edit/Write capturado>
timestamp: <ISO 8601 UTC>
session_id: <session_id>
---

# Breadcrumb automático — context-monitor hook

Contexto agotado al 90%. Sesión cerrada en plena fase. Para retomar:
1. Lee `ai_docs/tasks/{NNN}_*.md`
2. Localiza la fase indicada arriba
3. Continúa desde el último step no completado
```

---

## Troubleshooting

- **Hook tarda más de lo esperado.** Cada hook tiene un timeout duro (3-10 s para Node con `setTimeout` que mata el proceso, 200 ms efectivos para Bash/PS). Si tarda más, exit silencioso → no rompe el flujo del agent.
- **Logs de debug.** Los hooks escriben mensajes a stderr (Claude Code los muestra en modo verbose). En operación normal no escriben nada.
- **Conflicto con git hooks pre-existentes.** `scaffolding-guard` se invoca como hook de Claude Code (PreToolUse Bash), no como `.git/hooks/pre-commit`. No interfiere con los hooks git del repo. Si quieres ambos, mantenerlos separados.
- **Falsos positivos de `prompt-guard` en task docs o refs.** La rama Read excluye `ai_docs/refs/`, `ai_docs/tasks/` y `.claude/hooks/` — simétrico a `read-injection-scanner`. La rama Write/Edit sigue detectando inyecciones al escribir. Si ves warnings en `ai_docs/core/`, es intencional (STATE.md escrito automáticamente puede ser comprometido).
- **`task-doc-validator` bloquea un Edit pequeño.** Si el Edit toca la cabecera o un heading de sección obligatoria, el hook re-valida el archivo completo tras el cambio. Asegúrate de no romper la estructura. La única sección obligatoria es "Criterios de Éxito" (h2 o h3).
- **`task-doc-validator` no detecta mi artifact nuevo.** Revisa que el marker en "Impactos esperados" use una de las formas aceptadas: `(creado)`, `(nuevo)`, `(added)`, `(new)`.
- **`scaffolding-guard` bloquea commit con task docs en `ai_docs/`.** Usar `excluded_dirs: ["ai_docs"]` en config para permitir commits de task docs. Sin este override, el comportamiento por defecto se mantiene (ai_docs/ nunca commiteable).
- **`scaffolding-guard` CHECK 3 emite WARN en lugar de bloquear.** Si usas `git commit -F archivo` o heredoc, el hook no puede extraer el mensaje antes del commit — emite advisory en lugar de bloquear. Después del commit, `git log -1` muestra el mensaje real para revisión manual.
- **`session-state` no emite output.** Exit silente si STATE.md ausente o vacío. Cero tokens desperdiciados por sesión limpia.
- **`core-context-loader` inyecta demasiados bytes.** Configurar `max_bytes: 30000` en config para reducir el cap. Default 50000 B (~50KB). Independiente de `max_total_lines` — ambos aplican, el más restrictivo gana.
- **`context-monitor` no escribe STATE.md.** Verifica que el bridge file `<tmpdir>/claude-ctx-{session_id}.json` existe — lo escribe el statusline de Claude Code, no este hook.

---

## Performance esperada

| Hook | p50 | p99 | Comentario |
|---|---|---|---|
| `hook-runner.js` (bundler) | ~80 ms | ~200 ms | 1 spawn Node para N hooks; config.json leído 1 vez; hooks inactivos filtrados antes de require() |
| `context-monitor.js` | ~5 ms | ~50 ms | Lee bridge file pequeño; escribe STATE.md solo en CRITICAL |
| `prompt-guard.js` | ~10 ms | ~100 ms | Regex sobre el contenido + scan Unicode |
| `read-injection-scanner.js` | ~10 ms | ~100 ms | Regex sobre contenido limitado a 100KB; advisory only |
| `scaffolding-guard.js` (Node) | ~60 ms | ~150 ms | Zero I/O para no-commit; spawn `git diff` solo en `git commit` |
| `scaffolding-guard` (sh/ps1) | ~20 ms | ~150 ms | Spawn `git diff --cached --name-only` |
| `task-doc-validator.js` | ~15 ms | ~150 ms | Lee archivo, parsea regex de cabecera + secciones |
| `session-state` (sh/ps1) | ~10 ms | ~80 ms | Lee head 20 líneas de STATE.md y construye JSON |
| `sprint-sync.js` | ~15 ms | ~150 ms | Lee task doc + sprint doc + tabla §3 + bloques YAML contract |
| `sprint-doc-validator.js` | ~12 ms | ~120 ms | Regex sobre head 30 líneas + parser tabla §3 + búsqueda mermaid |
| `core-context-loader` (sh/ps1) | ~20 ms | ~150 ms | Lee N esenciales head 30 + index del resto de core/ |

---

## Tests

Los 9 hooks tienen tests unitarios cross-platform en `claude-templates/hooks/tests/`. Correr `npm test` desde ese directorio antes de modificar cualquier hook. CI puede invocar con un solo comando: `cd claude-templates/hooks/tests && npm test`. Cero dependencias npm externas — solo `node:test` y `node:assert` nativos (Node ≥20). Ver `tests/README.md` para detalles de cobertura, limitaciones conocidas (git requerido para scaffolding-guard, encoding UTF-8 forzado en pwsh) y cómo añadir casos nuevos.
