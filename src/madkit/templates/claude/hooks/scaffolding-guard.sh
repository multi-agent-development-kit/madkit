#!/usr/bin/env bash
# Scaffolding Guard — PreToolUse hook (Bash matcher)
#
# Bloquea git commits que:
#   (a) incluyen archivos en ai_docs/, .claude/ o .cursor/.
#   (b) tienen mensaje sin formato <type>: <subject> con type en
#       {create, optimize, update, fix, refactor} (CLAUDE.md §3.4).
#   (c) contienen "Co-Authored-By:" con "Claude" o "anthropic"
#       (CLAUDE.md §3.4 prohíbe atribuir commits a Claude).
#
# Defense-in-depth con skill `commit`:
#   - Skill: capa pedagógica, instruye al agent.
#   - Hook: capa mecánica, bloquea con exit 2 + razón.
#
# Opt-in: requiere `scaffolding_guard: true` en .claude/hooks/config.json.

# Leer cwd del input JSON (campo .cwd) — necesario para localizar config
INPUT=$(cat)

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
    const v = c.scaffolding_guard;
    // Acepta: true (forma compacta) o {enabled: true, ...} (forma extendida)
    const ok = v === true || (v && typeof v === "object" && v.enabled !== false);
    process.stdout.write(ok ? "1" : "0");
  } catch {
    process.stdout.write("0");
  }
' "$CONFIG_PATH" 2>/dev/null)
if [ "$ENABLED" != "1" ]; then
  exit 0
fi

# Leer excluded_dirs de config (scaffolding_guard.excluded_dirs: [])
# Permite override por directorio sin desactivar el hook entero.
EXCLUDED_DIRS=$(node -e '
  const fs = require("fs");
  try {
    const c = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    const cfg = c.scaffolding_guard;
    const dirs = (cfg && typeof cfg === "object" && Array.isArray(cfg.excluded_dirs))
      ? cfg.excluded_dirs : [];
    process.stdout.write(JSON.stringify(dirs));
  } catch {
    process.stdout.write("[]");
  }
' "$CONFIG_PATH" 2>/dev/null)
if [ -z "$EXCLUDED_DIRS" ]; then
  EXCLUDED_DIRS="[]"
fi

# Extraer comando del JSON
CMD=$(printf '%s' "$INPUT" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{process.stdout.write(JSON.parse(d).tool_input?.command||'')}catch{}})" 2>/dev/null)

# Solo procesar git commit
if ! [[ "$CMD" =~ ^git[[:space:]]+commit ]]; then
  exit 0
fi

# CHECK 1: archivos staged en directorios prohibidos
STAGED=$(cd "$CWD" && git diff --cached --name-only 2>/dev/null)
if [ -n "$STAGED" ]; then
  # Filtrar staged por excluded_dirs (override granular por directorio)
  FILTERED=$(printf '%s' "$STAGED" | node -e '
    const fs = require("fs");
    let input = "";
    process.stdin.on("data", d => input += d);
    process.stdin.on("end", () => {
      let excluded = [];
      try { excluded = JSON.parse(process.argv[1]); } catch { excluded = []; }
      const lines = input.split(/\r?\n/).filter(Boolean);
      const kept = lines.filter(line => {
        return !excluded.some(dir => line.startsWith(dir + "/") || line.startsWith(dir + "\\\\"));
      });
      process.stdout.write(kept.join("\n"));
    });
  ' "$EXCLUDED_DIRS" 2>/dev/null)
  FORBIDDEN=$(printf '%s\n' "$FILTERED" | grep -E '^(ai_docs|\.claude|\.cursor)/' | head -3 | tr '\n' ',' | sed 's/,$//')
  if [ -n "$FORBIDDEN" ]; then
    REASON="AI scaffolding staged for commit: $FORBIDDEN. These directories must never be committed (ver configuración de scaffolding del proyecto en CLAUDE.md o .claude/hooks/README.md). Run: git reset HEAD ai_docs/ .claude/ .cursor/"
    printf '{"decision":"block","code":"SCAFFOLDING_STAGED","reason":"%s"}' "$REASON"
    exit 2
  fi
fi

# CHECK 2: Co-Authored-By: Claude / anthropic prohibido (CLAUDE.md §3.4)
# Verifica antes que el formato — la atribución indebida es más crítica que el
# formato del subject. Escanea el comando completo (incluye -m multiline / heredoc).
if printf '%s' "$CMD" | grep -qiE 'Co-Authored-By:[^\n]*(Claude|anthropic)'; then
  REASON='Commit prohibido: "Co-Authored-By: Claude/anthropic" detectado. La configuración de scaffolding del proyecto (ver CLAUDE.md o .claude/hooks/README.md) prohíbe atribuir commits a Claude o Anthropic. Eliminar la línea Co-Authored-By y volver a commitear.'
  printf '{"decision":"block","code":"COMMIT_COAUTHOR_FORBIDDEN","reason":"%s"}' "$REASON"
  exit 2
fi

# CHECK 3: formato del mensaje
# Intentar extraer el mensaje en múltiples variantes de quoting.
MSG=""
MSG_SOURCE="extracted"
if [[ "$CMD" =~ -m[[:space:]]+\"([^\"]+)\" ]]; then
  MSG="${BASH_REMATCH[1]}"
elif [[ "$CMD" =~ -m[[:space:]]+\'([^\']+)\' ]]; then
  MSG="${BASH_REMATCH[1]}"
elif [[ "$CMD" =~ --message=([^[:space:]]+) ]]; then
  # Forma larga: --message=texto
  MSG="${BASH_REMATCH[1]}"
elif [[ "$CMD" =~ -m[[:space:]]+\$\'([^\']+)\' ]]; then
  # ANSI-C quoting: -m $'msg'
  MSG="${BASH_REMATCH[1]}"
elif printf '%s' "$CMD" | grep -qE '\-F\s+\S+'; then
  # -F file: leer el archivo si accesible
  FILE_ARG=$(printf '%s' "$CMD" | grep -oE '\-F\s+\S+' | head -1 | awk '{print $2}')
  if [ -f "$FILE_ARG" ]; then
    MSG=$(head -1 "$FILE_ARG" 2>/dev/null)
  fi
  if [ -z "$MSG" ]; then
    # Archivo -F no accesible: fallback a git log (advisory si formato inválido)
    MSG=$(cd "$CWD" && git log -1 --format=%s 2>/dev/null)
    if [ -n "$MSG" ]; then
      MSG_SOURCE="git_log_fallback"
    fi
  fi
fi

# Fallback final: heredoc / editor interactivo (sin -m ni -F detectables)
if [ -z "$MSG" ]; then
  # Intentar leer el último commit si el proceso ya hizo el commit
  LAST_COMMIT_MSG=$(cd "$CWD" && git log -1 --format=%s 2>/dev/null)
  if [ -n "$LAST_COMMIT_MSG" ]; then
    MSG="$LAST_COMMIT_MSG"
    MSG_SOURCE="git_log_fallback"
  else
    # Modo interactivo u otro formato no reconocido: no bloquear, emitir WARN
    printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","additionalContext":"SCAFFOLDING GUARD WARN: commit format not validatable (interactive editor or unrecognized -m format). Review manually that subject follows: <type>: <subject> with types create|optimize|update|fix|refactor."}}'
    exit 0
  fi
fi

if [ -n "$MSG" ]; then
  SUBJECT=$(printf '%s' "$MSG" | head -1)
  if ! [[ "$SUBJECT" =~ ^(create|optimize|update|fix|refactor)(\(.+\))?:[[:space:]].+ ]]; then
    if [ "$MSG_SOURCE" = "git_log_fallback" ]; then
      # Fallback desde git log: emitir advisory (el commit ya ocurrió)
      printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","additionalContext":"SCAFFOLDING GUARD WARN: last commit subject may not follow format <type>: <subject>. Review with git log -1."}}'
      exit 0
    fi
    REASON='Commit subject must follow the project commit format (ver configuración de scaffolding en CLAUDE.md o .claude/hooks/README.md): <type>: <subject>. Valid types: create, optimize, update, fix, refactor. Subject in lowercase, imperative, no trailing period.'
    printf '{"decision":"block","code":"COMMIT_FORMAT_INVALID","reason":"%s"}' "$REASON"
    exit 2
  fi
  if [ ${#SUBJECT} -gt 72 ]; then
    REASON='Commit subject must be 72 characters or fewer.'
    printf '{"decision":"block","code":"COMMIT_SUBJECT_TOO_LONG","reason":"%s"}' "$REASON"
    exit 2
  fi
fi

exit 0
