#!/usr/bin/env node
// Sprint Doc Validator — v1.0.0
// PreToolUse hook (Write/Edit a ai_docs/sprints/*.md)
//
// Validador estructural mecánico de sprint docs en el momento de guardar.
// Atrapa malformatos antes de que se propaguen a downstream (plan-checker D7,
// roadmap-generator extend, /sprint command). Defense-in-depth con sprint-sync.js
// (mecánica bidireccionalidad task↔sprint) y roadmap-generator (semántica de
// emisión).
//
// Verificaciones (orden BLOCKER → WARN):
//   1. Cabecera `> **Estado:**` única y parseable a uno de:
//      ABIERTA | EN_PROGRESO | COMPLETADA. Duplicación o ausencia → BLOCKER
//      (SPRINT_STATE_INVALID).
//   2. Sección `## 3. Tabla de tasks` con tabla Markdown bien formada y ≥1
//      fila de task (regex `| NNN | ...`). Ausencia → BLOCKER
//      (SPRINT_TABLE_MISSING).
//   3. Bloque DAG Mermaid presente: ```mermaid ... ``` con `graph` o
//      `flowchart`. Ausencia → BLOCKER (SPRINT_DAG_MISSING).
//   4. Sección `## 7. Lifecycle` (advisory): WARN si ausente o sin fecha
//      apertura parseable YYYY-MM-DD.
//   5. Cabecera `> **Tasks:** N total` vs filas de la tabla §3 (advisory):
//      WARN si discrepa.
//
// Modos:
//   - "advisory" (default cuando flag activo): emite WARN via additionalContext,
//     no bloquea — coherente con sprint-sync.
//   - "block": rechaza la operación con `{decision: "block", code, reason}` +
//     exit 2. Solo válido cuando el sprint doc es estructuralmente inválido
//     (BLOCKER); WARNs nunca bloquean independientemente del modo.
//   - Flag ausente: hook desactivado, exit 0 silencioso.
//
// Schema canónico de PreToolUse — consistente con task-doc-validator.js y
// sprint-sync.js. Block mode usa `{decision, code, reason}` no
// `additionalContext`.
//
// Excluye: ai_docs/sprints/README.md (si existe) y ai_docs/sprints/_archive/.
//
// Manejo de Edit puntual: re-leer archivo, simular reemplazo, validar resultado
// (mismo patrón que task-doc-validator.js).
//
// Opt-in: requiere `sprint_doc_validator: true` (compact) o
// `sprint_doc_validator: { enabled: true, mode: "advisory"|"block" }` en
// `.claude/hooks/config.json`.

const fs = require('fs');
const path = require('path');

const VALID_STATES = ['ABIERTA', 'EN_PROGRESO', 'COMPLETADA'];

// Regex single-line con flag /m sobre las primeras 30 líneas del sprint doc.
// Captura solo la primera palabra mayúscula tras "Estado:". Permite contenido
// descriptivo adicional (ej: "> **Estado:** ABIERTA — 2026-05-10").
const STATE_HEADER_REGEX = /^>\s*\*\*Estado:\*\*\s*([A-Z_]+)\b/gm;
const TASKS_HEADER_REGEX = /^>\s*\*\*Tasks:\*\*\s*(\d+)\s*(?:total|tasks)?/m;
// Tabla §3: ## 3. Tabla de tasks (o variantes case-insensitive)
const TABLE_HEADING_REGEX = /^##\s+3\.\s+Tabla\s+de\s+tasks/im;
// Bloque mermaid: ```mermaid ... ```
const MERMAID_BLOCK_REGEX = /```mermaid\s+([\s\S]*?)```/i;
const MERMAID_GRAPH_DIRECTIVE = /\b(graph|flowchart)\s+(LR|TD|TB|RL|BT)/i;
// Lifecycle h2 o h3 con la palabra Lifecycle
const LIFECYCLE_HEADING_REGEX = /^#{2,3}\s+.*lifecycle/im;
const APERTURA_DATE_REGEX = /apertura[^\n]*?(\d{4}-\d{2}-\d{2})/i;

function countStateHeaders(head) {
  let count = 0;
  let value = null;
  STATE_HEADER_REGEX.lastIndex = 0;
  let m;
  while ((m = STATE_HEADER_REGEX.exec(head)) !== null) {
    count++;
    value = m[1];
  }
  return { count, value };
}

function countTableRows(content) {
  const m = content.match(/^##\s+3\.\s+Tabla\s+de\s+tasks[^\n]*\n([\s\S]*?)(?=\n##\s|$(?![\s\S]))/im);
  if (!m) return 0;
  const section = m[1];
  const rows = section.split('\n').filter(line => /^\|\s*\d{3}\s*\|/.test(line));
  return rows.length;
}

async function runHook(input, preloadedConfig) {
  try {
    const data = typeof input === 'string' ? JSON.parse(input) : (input || {});
    const toolName = data.tool_name;
    const cwd = data.cwd || process.cwd();

    if (!['Write', 'Edit'].includes(toolName)) return { exitCode: 0 };

    const cfg = preloadedConfig !== undefined ? preloadedConfig
      : (() => { try { return JSON.parse(fs.readFileSync(path.join(cwd, '.claude', 'hooks', 'config.json'), 'utf8')); } catch { return null; } })();
    const sprintCfg = cfg && cfg.sprint_doc_validator;
    if (!sprintCfg) return { exitCode: 0 };
    const enabled = sprintCfg === true ||
      (typeof sprintCfg === 'object' && sprintCfg.enabled !== false);
    if (!enabled) return { exitCode: 0 };
    const mode = (typeof sprintCfg === 'object' && sprintCfg.mode === 'block')
      ? 'block' : 'advisory';

    const filePath = (data.tool_input && data.tool_input.file_path) || '';
    if (!filePath) return { exitCode: 0 };

    const p = filePath.replace(/\\/g, '/');
    if (!/\bai_docs\/sprints\/[^/]+\.md$/.test(p)) return { exitCode: 0 };
    if (/\/sprints\/README\.md$/i.test(p)) return { exitCode: 0 };
    if (/\/sprints\/_archive\//.test(p)) return { exitCode: 0 };

    let contentToValidate = '';
    if (toolName === 'Write') {
      contentToValidate = (data.tool_input && data.tool_input.content) || '';
      if (contentToValidate.trim() === '') return { exitCode: 0 };
    } else if (toolName === 'Edit') {
      const oldString = (data.tool_input && data.tool_input.old_string) || '';
      const newString = (data.tool_input && data.tool_input.new_string) || '';
      if (!fs.existsSync(filePath)) return { exitCode: 0 };
      let current;
      try {
        current = fs.readFileSync(filePath, 'utf8');
      } catch {
        return { exitCode: 0 };
      }
      const replaceAll = !!(data.tool_input && data.tool_input.replace_all);
      if (replaceAll) {
        contentToValidate = current.split(oldString).join(newString);
      } else {
        const idx = current.indexOf(oldString);
        if (idx === -1) return { exitCode: 0 };
        contentToValidate = current.slice(0, idx) + newString + current.slice(idx + oldString.length);
      }
    }

    const errors = [];
    const warnings = [];

    const lines = contentToValidate.split(/\r?\n/);
    const head = lines.slice(0, 30).join('\n');

    // 1. SPRINT_STATE_INVALID
    const { count: stateCount, value: stateValue } = countStateHeaders(head);
    if (stateCount === 0) {
      errors.push(
        '[SPRINT_STATE_INVALID] Sprint doc missing required header "> **Estado:** <ABIERTA|EN_PROGRESO|COMPLETADA>" in first 30 lines.'
      );
    } else if (stateCount > 1) {
      errors.push(
        `[SPRINT_STATE_INVALID] Sprint doc has ${stateCount} "> **Estado:**" headers in first 30 lines; expected exactly 1. Remove the stale entries.`
      );
    } else if (!VALID_STATES.includes(stateValue)) {
      warnings.push(
        `Sprint doc "Estado" header has invalid value "${stateValue}". Expected one of: ${VALID_STATES.join(', ')}.`
      );
    }

    // 2. SPRINT_TABLE_MISSING
    if (!TABLE_HEADING_REGEX.test(contentToValidate)) {
      errors.push(
        '[SPRINT_TABLE_MISSING] Sprint doc missing required section "## 3. Tabla de tasks" with at least 1 task row (format: `| NNN | <title> | ...`).'
      );
    } else {
      const tableRows = countTableRows(contentToValidate);
      if (tableRows === 0) {
        errors.push(
          '[SPRINT_TABLE_MISSING] Section "## 3. Tabla de tasks" present but contains zero parseable task rows (need at least 1 row matching `| NNN | ...`).'
        );
      } else {
        const tasksHeaderMatch = head.match(TASKS_HEADER_REGEX);
        if (tasksHeaderMatch) {
          const declared = parseInt(tasksHeaderMatch[1], 10);
          if (declared !== tableRows) {
            warnings.push(
              `Header "> **Tasks:** ${declared} total" does not match ${tableRows} parseable rows in table §3. Recommended to keep them in sync.`
            );
          }
        }
      }
    }

    // 3. SPRINT_DAG_MISSING
    const mermaidMatch = contentToValidate.match(MERMAID_BLOCK_REGEX);
    if (!mermaidMatch) {
      errors.push(
        '[SPRINT_DAG_MISSING] Sprint doc missing required Mermaid DAG block (```mermaid ... ```).'
      );
    } else if (!MERMAID_GRAPH_DIRECTIVE.test(mermaidMatch[1])) {
      warnings.push(
        'Sprint doc Mermaid block present but lacks a `graph LR|TD` or `flowchart LR|TD` directive — verify the DAG is renderable.'
      );
    }

    // 4. SPRINT_LIFECYCLE_MISSING (advisory)
    if (!LIFECYCLE_HEADING_REGEX.test(contentToValidate)) {
      warnings.push(
        'Sprint doc missing section "Lifecycle" (advisory) — recommended for tracking apertura/cierre dates.'
      );
    } else if (!APERTURA_DATE_REGEX.test(contentToValidate)) {
      warnings.push(
        'Section "Lifecycle" present but no parseable apertura date in YYYY-MM-DD format detected — recommended for tracking.'
      );
    }

    // === Output ===
    if (errors.length > 0 && mode === 'block') {
      const reason = `Sprint doc structure invalid (${errors.length} error${errors.length === 1 ? '' : 's'}):\n- ` +
        errors.join('\n- ') +
        (warnings.length > 0 ? `\n\nAdditional warnings:\n- ` + warnings.join('\n- ') : '');
      return {
        exitCode: 2,
        stdoutJson: { decision: 'block', code: 'SPRINT_DOC_STRUCTURE_INVALID', reason },
      };
    }

    if (errors.length > 0 || warnings.length > 0) {
      const allFindings = [
        ...errors.map(e => `BLOCKER (advisory mode): ${e}`),
        ...warnings.map(w => `WARN: ${w}`),
      ];
      return {
        exitCode: 0,
        stdoutJson: {
          hookSpecificOutput: {
            hookEventName: 'PreToolUse',
            additionalContext:
              `SPRINT DOC ADVISORY (${allFindings.length} finding${allFindings.length === 1 ? '' : 's'}):\n- ` +
              allFindings.join('\n- '),
          },
        },
      };
    }

    return { exitCode: 0 };
  } catch {
    return { exitCode: 0 };
  }
}

module.exports = runHook;
module.exports.runHook = runHook;

if (require.main === module) {
  let raw = '';
  const t = setTimeout(() => process.exit(0), 5000);
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', c => raw += c);
  process.stdin.on('end', async () => {
    clearTimeout(t);
    let parsed = {};
    try { parsed = raw.trim() ? JSON.parse(raw) : {}; } catch { process.exit(0); return; }
    const r = await runHook(parsed);
    if (r.stderr) process.stderr.write(r.stderr);
    if (r.stdoutJson) process.stdout.write(JSON.stringify(r.stdoutJson));
    process.exit(r.exitCode || 0);
  });
}
