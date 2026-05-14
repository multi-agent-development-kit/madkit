#!/usr/bin/env bash
# Core Context Loader — SessionStart hook
#
# Carga el subset MINIMO ESENCIAL de `ai_docs/core/*.md` en la conversación
# principal vía `additionalContext` al iniciar sesión + lista los demás
# como pointer index para read-on-demand. Cierra el gap detectado en R5
# (la main session no ve `ai_docs/core/` salvo escritura explícita) sin
# inflar el system prompt con docs no esenciales.
#
# Filosofía:
#   - Esenciales (default `master_idea.md`, `architecture.md`): cargados con head-N.
#   - Resto de `core/*.md` (data_models, decisions, etc.): listados como pointer
#     index con instrucción "read on-demand con Read tool cuando los necesites".
#   - `_meta/` y otros directorios fuera de `core/`: ignorados.
#
# Comportamiento:
#   - Lee los esenciales declarados en `essential_files` (default por config).
#   - Aplica head-N por archivo (default 30, configurable vía `head_lines`).
#   - Trunca el total a `max_total_lines` (default 400, configurable).
#   - Cap en bytes vía `max_bytes` (default 50000, evita inyecciones grandes).
#   - Si `index_others: true` (default): lista archivos `core/*.md` no esenciales
#     como pointer index al final del bloque.
#   - Emite JSON con `hookSpecificOutput.additionalContext`.
#
# Casos límite:
#   - `ai_docs/core/` ausente → exit 0 silencioso.
#   - Ningún archivo esencial presente → exit 0 (no hay contexto que inyectar).
#   - Archivo >head_lines → trunca con marker.
#   - Total >max_total_lines → último archivo trunca con marker, hook NO falla.
#   - `essential_files: []` → solo se emite el index si `index_others: true`.
#
# Opt-in: requiere `core_context_loader: true` en `.claude/hooks/config.json`.
# Acepta forma compacta `core_context_loader: true` (defaults aplicados) u
# objeto `{ enabled, head_lines, max_total_lines, max_bytes, essential_files,
# index_others }`.

INPUT=$(cat 2>/dev/null || true)

CWD=$(printf '%s' "$INPUT" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{process.stdout.write(JSON.parse(d).cwd||process.cwd())}catch{process.stdout.write(process.cwd())}})" 2>/dev/null)
if [ -z "$CWD" ]; then
  CWD=$(pwd)
fi

# Opt-in + leer parámetros
CONFIG_PATH="$CWD/.claude/hooks/config.json"
if [ ! -f "$CONFIG_PATH" ]; then
  exit 0
fi

PARAMS=$(node -e '
  const fs = require("fs");
  try {
    const c = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    const v = c.core_context_loader;
    const DEFAULT_ESSENTIAL = ["master_idea.md", "architecture.md"];
    if (v === true) {
      process.stdout.write("1\t30\t400\t50000\t1\t" + DEFAULT_ESSENTIAL.join(","));
    } else if (v && typeof v === "object" && v.enabled !== false) {
      const clamp = (n, lo, hi, def) => {
        const x = Number(n);
        if (!Number.isFinite(x)) return def;
        return Math.max(lo, Math.min(hi, Math.floor(x)));
      };
      const head = clamp(v.head_lines, 10, 200, 30);
      const total = clamp(v.max_total_lines, 50, 1000, 400);
      const maxBytes = clamp(v.max_bytes, 1000, 500000, 50000);
      const indexOthers = v.index_others === false ? "0" : "1";
      let essential = DEFAULT_ESSENTIAL;
      if (Array.isArray(v.essential_files)) {
        essential = v.essential_files.filter(s => typeof s === "string" && s.endsWith(".md"));
      }
      process.stdout.write(`1\t${head}\t${total}\t${maxBytes}\t${indexOthers}\t${essential.join(",")}`);
    } else {
      process.stdout.write("0\t0\t0\t0\t0\t");
    }
  } catch {
    process.stdout.write("0\t0\t0\t0\t0\t");
  }
' "$CONFIG_PATH" 2>/dev/null)

ENABLED=$(printf '%s' "$PARAMS" | cut -f1)
HEAD_LINES=$(printf '%s' "$PARAMS" | cut -f2)
MAX_TOTAL=$(printf '%s' "$PARAMS" | cut -f3)
MAX_BYTES=$(printf '%s' "$PARAMS" | cut -f4)
INDEX_OTHERS=$(printf '%s' "$PARAMS" | cut -f5)
ESSENTIAL_LIST=$(printf '%s' "$PARAMS" | cut -f6)
if [ -z "$MAX_BYTES" ] || [ "$MAX_BYTES" = "0" ]; then
  MAX_BYTES="50000"
fi

if [ "$ENABLED" != "1" ]; then
  exit 0
fi

# Resolución robusta de la ruta a ai_docs/ mediante .claude/.ai_docs_path.
# Fallback garantizado a cwd/ai_docs para cero regresión en proyectos canónicos.
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

CORE_DIR="$AI_DOCS_DIR/core"
if [ ! -d "$CORE_DIR" ]; then
  exit 0
fi

# Construir bloque: cargar esenciales con head-N + opcional pointer index
# para los demás `core/*.md` no esenciales.
OUTPUT=$(node -e '
  const fs = require("fs");
  const path = require("path");
  const [coreDir, headLinesStr, maxTotalStr, maxBytesStr, indexOthersStr, essentialCsv] = process.argv.slice(1);
  const headLines = parseInt(headLinesStr, 10);
  const maxTotal = parseInt(maxTotalStr, 10);
  const maxBytes = parseInt(maxBytesStr, 10) || 50000;
  const indexOthers = indexOthersStr === "1";
  const essential = essentialCsv.split(",").map(s => s.trim()).filter(Boolean);

  let allFiles;
  try {
    allFiles = fs.readdirSync(coreDir).filter(f => f.endsWith(".md")).sort();
  } catch {
    process.exit(0);
  }
  if (allFiles.length === 0) process.exit(0);

  // Esenciales presentes en el filesystem (preserva orden de essential_files).
  const presentEssential = essential.filter(f => allFiles.includes(f));
  // Pointer index = todos los .md menos los esenciales.
  const pointerFiles = allFiles.filter(f => !essential.includes(f));

  const blocks = [];
  let totalLines = 0;
  let truncated = false;

  for (const f of presentEssential) {
    if (totalLines >= maxTotal) {
      truncated = true;
      break;
    }
    let content;
    try {
      content = fs.readFileSync(path.join(coreDir, f), "utf8");
    } catch {
      continue;
    }
    const lines = content.split(/\r?\n/);
    const allowed = Math.min(headLines, maxTotal - totalLines);
    const slice = lines.slice(0, allowed);
    let block = `## ai_docs/core/${f}\n` + slice.join("\n");
    if (lines.length > allowed) {
      block += `\n\n[TRUNCATED — ${lines.length - allowed} líneas más, leer archivo completo on-demand]`;
    }
    blocks.push(block);
    totalLines += slice.length;
  }

  // Si no hay esenciales ni pointers para listar, exit 0.
  if (blocks.length === 0 && (!indexOthers || pointerFiles.length === 0)) process.exit(0);

  const headerParts = [
    "# Contexto del proyecto cargado al inicio de sesión (core-context-loader hook)",
    "",
    `Esenciales inyectados con head-${headLines}; cap total ${maxTotal} líneas, byte cap ${maxBytes} B.`,
    "Para los archivos listados como pointer index abajo, usa la herramienta Read cuando el trabajo lo requiera.",
  ];
  if (truncated) {
    headerParts.push("");
    headerParts.push("[TRUNCATED — alcanzado max_total_lines, archivos restantes truncados]");
  }
  const header = headerParts.join("\n");

  let body = blocks.length > 0 ? (header + "\n\n" + blocks.join("\n\n---\n\n")) : header;

  if (indexOthers && pointerFiles.length > 0) {
    const indexLines = pointerFiles.map(f => `- \`ai_docs/core/${f}\``);
    const indexBlock = "## Otros archivos en ai_docs/core/ (read on-demand)\n\n" + indexLines.join("\n");
    body += "\n\n---\n\n" + indexBlock;
  }

  let additionalContext = body;

  // Cap en bytes: si excede maxBytes, truncar el string y añadir marker.
  const byteLen = Buffer.byteLength(additionalContext, "utf8");
  if (byteLen > maxBytes) {
    const buf = Buffer.from(additionalContext, "utf8").slice(0, maxBytes);
    let truncStr = buf.toString("utf8");
    const lastNl = truncStr.lastIndexOf("\n");
    if (lastNl > 0) truncStr = truncStr.slice(0, lastNl);
    additionalContext = truncStr + `\n\n[TRUNCATED — byte cap (${maxBytes} B)]`;
  }

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext,
      core_files_loaded: blocks.length,
      core_lines_inyected: totalLines,
      core_files_indexed: indexOthers ? pointerFiles.length : 0,
      truncated,
    },
  }));
' "$CORE_DIR" "$HEAD_LINES" "$MAX_TOTAL" "$MAX_BYTES" "$INDEX_OTHERS" "$ESSENTIAL_LIST" 2>/dev/null)

if [ -n "$OUTPUT" ]; then
  printf '%s' "$OUTPUT"
fi

exit 0
