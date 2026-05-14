# Catálogos de edge cases por tipo de artifact

> **Audiencia:** `task-planner` (Paso 7.3) y plan-checker D8 (Failure Mode Coverage). Las 3 preguntas mínimas obligatorias de "Casos límite mínimos" (input vacío/null/no existente, fallo de dependencia externa, estado tras error parcial) viven en `task_template.md` y cubren cualquier artifact. Este catálogo **amplía** con preguntas específicas para tareas ESTÁNDAR+ que crean o modifican un tipo concreto de artifact. Las preguntas son guías, no obligaciones — el planner adapta al contexto real.
>
> **Citado desde:** `task_template.md` §"Casos límite mínimos". Convenciones de paralelización del proyecto (ver `CLAUDE.md`).

---

## 1. Hook (Claude Code, opt-in en `.claude/hooks/`)

- **Q1:** ¿Qué pasa si stdin tarda más del timeout configurado (3-5s)? **Respuesta esperada:** _exit silencioso o degradación_.
- **Q2:** ¿Qué pasa con paths con espacios, caracteres Unicode, encoding UTF-16/BOM en cwd o file_path? **Respuesta esperada:** _normalización + tests cross-platform_.
- **Q3:** ¿Qué pasa si dos hooks escriben al mismo archivo concurrentemente (race condition)? **Respuesta esperada:** _atomicidad declarada o aceptada_.
- **Q4:** ¿Qué patrones de path se EXCLUYEN del scan? (`.git/`, `node_modules/`, `.claude/hooks/` mismo) **Respuesta esperada:** _allowlist de exclusiones documentada_.
- **Q5:** ¿Qué pasa si el config JSON está malformado? **Respuesta esperada:** _exit 0 silencioso (try/catch en lectura)_.
- **Q6:** ¿Hay tope de bytes leídos del archivo (DoS-resistance + tokens)? **Respuesta esperada:** _MAX_READ_BYTES declarado_.

---

## 2. Skill (`.claude/skills/<name>/SKILL.md`)

- **Q1:** ¿Qué pasa si `$ARGUMENTS` viene vacío o nulo? **Respuesta esperada:** _prompt al usuario o defaults documentados_.
- **Q2:** ¿La `description:` es mutuamente excluyente con otras skills (cero auto-activación cruzada)? **Respuesta esperada:** _grep verifica zero overlap con descriptions de skills hermanas_.
- **Q3:** Si usa `context: fork` + `agent:` → ¿el agent referenciado existe? **Respuesta esperada:** _verificado con `ls claude-templates/agents/`_.
- **Q4:** Si tiene `paths:` glob → ¿matches realistas? ¿qué pasa si stack del proyecto no aplica? **Respuesta esperada:** _SKIP silencioso o documentación inline_.
- **Q5:** Si tiene `disable-model-invocation: true` + `user-invocable: false` → ¿conflicto? **Respuesta esperada:** _decisión consciente documentada_.

---

## 3. Agent (`.claude/agents/*.md` o `claude-templates/agents/*.md`)

- **Q1:** ¿Hay riesgo de loop infinito (agent A invoca agent B, B invoca A)? **Respuesta esperada:** _maxTurns declarado o auto-invocación prohibida_.
- **Q2:** Si `effort:` y `model:` son incompatibles (haiku con xhigh) → ¿degradación silenciosa? **Respuesta esperada:** _verificado contra matriz `CLAUDE.md` §1.1_.
- **Q3:** ¿`tools:` y `disallowedTools:` consistentes (sin contradicción)? **Respuesta esperada:** _tabla de allowlist + denylist documentada_.
- **Q4:** Si declara `skills:` en frontmatter → ¿todas las skills referenciadas existen? **Respuesta esperada:** _verificado con `ls`_.
- **Q5:** ¿Qué pasa si el subagent se invoca sin contexto suficiente (prompt vacío)? **Respuesta esperada:** _prompt al usuario o degradación_.

---

## 4. Command (`.claude/commands/<name>.md`)

- **Q1:** ¿Argumentos `$ARGUMENTS` no parseables (caracteres especiales, encoding)? **Respuesta esperada:** _validación + mensaje de error tipado_.
- **Q2:** ¿Conflicto de namespace con built-in commands de Claude Code (`/help`, `/clear`)? **Respuesta esperada:** _verificado, NO redefinir built-ins_.
- **Q3:** ¿Path traversal en argumentos (`../` o paths absolutos)? **Respuesta esperada:** _resolución relativa segura_.

---

## 5. Endpoint / Server Action (proyectos destino)

- **Q1:** ¿Rate limiting? **Respuesta esperada:** _límite por IP/usuario, comportamiento al exceder_.
- **Q2:** ¿Body size limit, content-type validation? **Respuesta esperada:** _tope explícito + 413 en exceso_.
- **Q3:** ¿Autenticación expirada / sesión revocada? **Respuesta esperada:** _401 con redirect a login_.
- **Q4:** ¿CORS preflight para origins externos? **Respuesta esperada:** _allowlist de origins_.
- **Q5:** ¿Idempotencia (POST llamado 2 veces produce mismo resultado)? **Respuesta esperada:** _idempotency-key o naturaleza idempotente declarada_.
- **Q6:** ¿CSRF en mutaciones (server actions Next.js, Django views)? **Respuesta esperada:** _token CSRF verificado_.

---

## 6. Migration (DB schema change)

- **Q1:** ¿Rollback path documentado y testado? **Respuesta esperada:** _down migration + comando concreto + verificación post-rollback_.
- **Q2:** ¿Datos huérfanos tras la migración? **Respuesta esperada:** _query de detección + plan de cleanup_.
- **Q3:** ¿Índices duplicados o constraints en tablas grandes (>100K filas)? **Respuesta esperada:** _CONCURRENTLY si Postgres, batch si MySQL, downtime estimado_.
- **Q4:** ¿Compatibilidad con código existente durante el rolling deploy? **Respuesta esperada:** _backwards-compat declarada o ventana de mantenimiento_.

---

## 7. Schema (DB / GraphQL / API contract)

- **Q1:** ¿Backwards-compatibility con clientes existentes? **Respuesta esperada:** _semver del schema + plan de deprecation_.
- **Q2:** ¿Nullable defaults para campos nuevos? **Respuesta esperada:** _NULL o default explícito_.
- **Q3:** ¿Breaking changes documentados como tales? **Respuesta esperada:** _CHANGELOG con sección BREAKING_.
- **Q4:** ¿Índice missing tras añadir foreign key (Postgres)? **Respuesta esperada:** _índice manual declarado_.

---

## Extensión del catálogo

Si un tipo de artifact emerge en el futuro (ej: model-config, hook-orchestrator, MCP server), añadir una sección numerada nueva — el catálogo es modular. Mantener el formato Q1, Q2, ... con respuesta esperada concreta (no genérica).
