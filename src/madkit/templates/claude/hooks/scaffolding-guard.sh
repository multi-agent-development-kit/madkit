#!/usr/bin/env bash
# hook-version: 1.0.0
# Scaffolding Guard — PreToolUse hook (Bash matcher)
#
# Bloquea git commits que (a) incluyen archivos en ai_docs/, .claude/ o .cursor/, o
# (b) tienen mensaje sin formato <type>: <subject> con type en
# {create, optimize, update, fix, refactor} (CLAUDE.md §3.4).
#
# Defense-in-depth con skill `commit` (Paso 1 "Guardia de AI Scaffolding"):
#   - Skill: capa pedagógica, advierte al agent.
#   - Hook: capa mecánica, bloquea con exit 2 + razón.
#
# Opt-in: requiere `scaffolding_guard: true` en .claude/hooks/config.json.
# Adaptado de get-shit-done/hooks/gsd-validate-commit.sh.

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
ENABLED=$(node -e "try{const c=require('$CONFIG_PATH');process.stdout.write(c.scaffolding_guard===true?'1':'0')}catch{process.stdout.write('0')}" 2>/dev/null)
if [ "$ENABLED" != "1" ]; then
  exit 0
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
  FORBIDDEN=$(printf '%s\n' "$STAGED" | grep -E '^(ai_docs|\.claude|\.cursor)/' | head -3 | tr '\n' ',' | sed 's/,$//')
  if [ -n "$FORBIDDEN" ]; then
    REASON="AI scaffolding staged for commit: $FORBIDDEN. These directories must never be committed (CLAUDE.md prohibitions). Run: git reset HEAD ai_docs/ .claude/ .cursor/"
    printf '{"decision":"block","code":"SCAFFOLDING_STAGED","reason":"%s"}' "$REASON"
    exit 2
  fi
fi

# CHECK 2: formato del mensaje
MSG=""
if [[ "$CMD" =~ -m[[:space:]]+\"([^\"]+)\" ]]; then
  MSG="${BASH_REMATCH[1]}"
elif [[ "$CMD" =~ -m[[:space:]]+\'([^\']+)\' ]]; then
  MSG="${BASH_REMATCH[1]}"
fi

if [ -n "$MSG" ]; then
  SUBJECT=$(printf '%s' "$MSG" | head -1)
  if ! [[ "$SUBJECT" =~ ^(create|optimize|update|fix|refactor)(\(.+\))?:[[:space:]].+ ]]; then
    REASON='Commit subject must follow CLAUDE.md §3.4 format: <type>: <subject>. Valid types: create, optimize, update, fix, refactor. Subject in lowercase, imperative, no trailing period.'
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
