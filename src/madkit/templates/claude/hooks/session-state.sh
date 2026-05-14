#!/usr/bin/env bash
# Session State — SessionStart hook
#
# Cierra el loop con context-monitor que ESCRIBE ai_docs/STATE.md cuando contexto ≤10%.
# Este hook LEE el head al iniciar la siguiente sesión e inyecta el contexto al system prompt
# como `additionalContext`. Sin esto, STATE.md queda dormido hasta que el usuario o el
# task-planner Paso 0 lo abren manualmente.
#
# Opt-in: requiere `session_state: true` en .claude/hooks/config.json.
# Adaptado de get-shit-done/hooks/gsd-session-state.sh (paths y flags localizados al repo).

# Leer cwd del input JSON
INPUT=$(cat 2>/dev/null || true)

CWD=$(printf '%s' "$INPUT" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{process.stdout.write(JSON.parse(d).cwd||process.cwd())}catch{process.stdout.write(process.cwd())}})" 2>/dev/null)
if [ -z "$CWD" ]; then
  CWD=$(pwd)
fi

# Opt-in
CONFIG_PATH="$CWD/.claude/hooks/config.json"
if [ ! -f "$CONFIG_PATH" ]; then
  exit 0
fi
ENABLED=$(node -e '
  const fs = require("fs");
  try {
    const c = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    process.stdout.write(c.session_state === true ? "1" : "0");
  } catch {
    process.stdout.write("0");
  }
' "$CONFIG_PATH" 2>/dev/null)
if [ "$ENABLED" != "1" ]; then
  exit 0
fi

# Resolución robusta de la ruta a ai_docs/ mediante .claude/.ai_docs_path.
# Fallback garantizado a cwd/ai_docs para cero regresión en proyectos canónicos.
# Usa node para parsear el archivo (cross-platform, maneja BOM + CRLF + comentarios).
AI_DOCS_DIR=$(node -e '
  const fs = require("fs");
  const path = require("path");
  const cwd = process.argv[1];
  const overridePath = path.join(cwd, ".claude", ".ai_docs_path");
  try {
    const raw = fs.readFileSync(overridePath, "utf8").replace(/^﻿/, "");
    const resolved = raw.split(/\r?\n/)
      .map(function(l) { return l.trim(); })
      .filter(function(l) { return l && !l.startsWith("#"); })[0];
    if (resolved && path.isAbsolute(resolved) && fs.existsSync(resolved)) {
      process.stdout.write(resolved);
      process.exit(0);
    }
  } catch (_) { /* fallback */ }
  process.stdout.write(path.join(cwd, "ai_docs"));
' "$CWD" 2>/dev/null)
if [ -z "$AI_DOCS_DIR" ]; then
  AI_DOCS_DIR="$CWD/ai_docs"
fi

# Leer ai_docs/STATE.md head (20 líneas) si existe
STATE_PATH="$AI_DOCS_DIR/STATE.md"
STATE_PRESENT="false"
STATE_HEAD=""
ACTIVE_TASK=""

if [ -f "$STATE_PATH" ] && [ -s "$STATE_PATH" ]; then
  STATE_PRESENT="true"
  STATE_HEAD=$(head -20 "$STATE_PATH" 2>/dev/null)
  ACTIVE_TASK=$(printf '%s' "$STATE_HEAD" | grep -E '^active_task:' | head -1 | sed 's/^active_task:[[:space:]]*//' | tr -d '\r')
fi

# Si STATE.md no existe, exit silente — cero tokens desperdiciados.
if [ "$STATE_PRESENT" != "true" ]; then
  exit 0
fi

# Construir JSON de salida — additionalContext para SessionStart hook protocol
# Tests pueden parsear los typed fields sin grep sobre prose libre.
node -e '
  const [statePresent, stateHead, activeTask] = process.argv.slice(1);
  const lines = ["## Estado del proyecto (session-state hook)", ""];
  lines.push("`ai_docs/STATE.md` detectado — sesión retomada. Tarea, fase y última acción:");
  lines.push("");
  if (stateHead) lines.push(stateHead);
  lines.push("");
  lines.push("Para continuar: lee el task doc referenciado en `active_task:` y ejecuta `/status` para ver waves pendientes.");
  const additionalContext = lines.join("\n");
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext,
      state_present: true,
      active_task: activeTask || null,
    },
  }));
' "$STATE_PRESENT" "$STATE_HEAD" "$ACTIVE_TASK"

exit 0
