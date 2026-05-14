#!/usr/bin/env node
// Sprint Sync — PreToolUse hook
//
// Valida bidireccionalidad mecánica task↔sprint en tiempo de Write/Edit:
//   - Si se escribe un task doc con `> **Sprint:** NN`, verifica que
//     `ai_docs/sprints/NN_*.md` existe y lista el ID en su tabla de tasks.
//   - Si se escribe un sprint doc, verifica que cada task ID listado
//     en su tabla existe en `ai_docs/tasks/`.
//
// Triggers: Write, Edit cuyo target esté bajo ai_docs/tasks/ o ai_docs/sprints/.
// Modos:
//   - "advisory" (default cuando flag activo): emite WARN vía additionalContext, no bloquea.
//   - "block": rechaza la operación con `{decision: "block", code, reason}` + exit 2.
//   - flag ausente o sprint_sync != objeto con .mode: hook desactivado, exit 0 silencioso.
//
// Schema canónico de PreToolUse — consistente con prompt-guard.js (referencia canónica
// del repo). Block mode usa `{decision, code, reason}` no `additionalContext`.
//
// Excluye: ai_docs/refs/ y ai_docs/tasks/_archive/.
//
// Validación de overlap de `files_touched` entre tasks de la misma wave del
// mismo sprint. Retrocompatible: skip silencioso si bloque `contract:` ausente,
// campo `files_touched:` ausente, sprint con 1 sola task, o sprint doc no
// parseable.

const fs = require('fs');
const path = require('path');
const { resolveAiDocsDir, readConfig } = require('./hook-utils');

function isExcludedPath(filePath) {
  const p = filePath.replace(/\\/g, '/');
  return (
    p.includes('/ai_docs/refs/') ||
    p.includes('ai_docs/refs/') ||
    p.includes('/ai_docs/tasks/_archive/') ||
    p.includes('ai_docs/tasks/_archive/')
  );
}

function isUnderTasks(filePath) {
  const p = filePath.replace(/\\/g, '/');
  return p.includes('/ai_docs/tasks/') || p.startsWith('ai_docs/tasks/');
}

function isUnderSprints(filePath) {
  const p = filePath.replace(/\\/g, '/');
  return p.includes('/ai_docs/sprints/') || p.startsWith('ai_docs/sprints/');
}

function extractSprintFromTask(content) {
  const m = content.match(/^>\s*\*\*Sprint:\*\*\s*(\d+)\s*$/m);
  if (!m) return null;
  return m[1].padStart(2, '0');
}

function extractTaskIdFromFilename(filePath) {
  const name = path.basename(filePath);
  const m = name.match(/^(\d{3})_/);
  return m ? m[1] : null;
}

function extractTaskIdsFromSprint(content) {
  // Tabla "## 3. Tabla de tasks" — IDs de la primera columna.
  // Formato esperado: | 100 | <título> | ...
  const lines = content.split('\n');
  const ids = [];
  let inTable = false;
  for (const line of lines) {
    if (/^##\s+3\.\s+Tabla de tasks/i.test(line)) {
      inTable = true;
      continue;
    }
    if (inTable && /^##\s+/i.test(line)) {
      // Siguiente sección H2 — fin de la tabla
      break;
    }
    if (inTable) {
      const m = line.match(/^\|\s*(\d{3})\s*\|/);
      if (m) ids.push(m[1]);
    }
  }
  return ids;
}

function extractSprintFromFilename(filePath) {
  const name = path.basename(filePath);
  const m = name.match(/^(\d{2})_/);
  return m ? m[1] : null;
}

function extractSprintEstado(content) {
  const m = content.match(/\*\*Estado:\*\*\s*(\w+)/);
  return m ? m[1].toUpperCase() : null;
}

function findSprintFile(cwd, sprintNum) {
  const dir = path.join(resolveAiDocsDir(cwd), 'sprints');
  if (!fs.existsSync(dir)) return null;
  try {
    const files = fs.readdirSync(dir).filter(
      f => f.startsWith(`${sprintNum}_`) && f.endsWith('.md')
    );
    return files[0] ? path.join(dir, files[0]) : null;
  } catch {
    return null;
  }
}

function findTaskFile(cwd, taskId) {
  const dir = path.join(resolveAiDocsDir(cwd), 'tasks');
  if (!fs.existsSync(dir)) return null;
  try {
    const files = fs.readdirSync(dir).filter(
      f => f.startsWith(`${taskId}_`) && f.endsWith('.md')
    );
    return files[0] ? path.join(dir, files[0]) : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Helpers: extracción de files_touched y tabla del sprint doc
// ---------------------------------------------------------------------------

/**
 * Extraer la lista `files_touched:` del bloque `contract:` de un task doc.
 * Heurística simple sobre líneas fijas del YAML incrustado en markdown:
 *   - Busca bloque delimitado por ```yaml ... ``` que contenga `contract:`
 *   - Dentro del bloque, busca la clave `  files_touched:` (2 espacios)
 *   - Extrae bullets `    - "..."` (4 espacios) hasta la siguiente clave
 * Devuelve array de strings normalizados (path.normalize + toLowerCase en win32).
 * Devuelve [] si bloque ausente, campo ausente, o cualquier error (try/catch).
 *
 * @param {string} content — contenido del task doc
 * @returns {string[]}
 */
function extractFilesTouched(content) {
  try {
    // Localizar bloque ```yaml que contenga contract:
    const blockRe = /```yaml\s*([\s\S]*?)```/g;
    let m;
    while ((m = blockRe.exec(content)) !== null) {
      const block = m[1];
      if (!/^\s*contract:/m.test(block)) continue;
      // Encontrar la línea files_touched: dentro del bloque
      const lines = block.split('\n');
      let inFilesTouched = false;
      const files = [];
      for (const line of lines) {
        if (/^  files_touched:\s*$/.test(line) || /^  files_touched:\s*\[\]/.test(line)) {
          inFilesTouched = true;
          continue;
        }
        if (inFilesTouched) {
          // Bullet de 4 espacios: `    - "path/al/archivo"`
          const bullet = line.match(/^    - "(.+)"/);
          if (bullet) {
            files.push(normalizePath(bullet[1]));
            continue;
          }
          // También aceptar sin comillas: `    - path/al/archivo`
          const bulletNQ = line.match(/^    - (.+)/);
          if (bulletNQ) {
            files.push(normalizePath(bulletNQ[1].trim()));
            continue;
          }
          // Si llegamos a otra clave de primer nivel (2 espacios + no bullet) → fin
          if (/^  \w/.test(line)) break;
        }
      }
      return files;
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Normalizar un path para comparación cross-platform.
 * En Windows: path.normalize + toLowerCase. En POSIX: solo path.normalize.
 *
 * @param {string} p
 * @returns {string}
 */
function normalizePath(p) {
  // Convertir backslash a forward slash para comparación uniforme
  const normalized = path.normalize(p).replace(/\\/g, '/');
  return process.platform === 'win32' ? normalized.toLowerCase() : normalized;
}

/**
 * Parsear la tabla "## 3. Tabla de tasks" de un sprint doc.
 * Formato de fila esperado:
 *   | NNN | <título> | <estado> | <wave> | <depends> |
 * Devuelve { taskId: { wave: number, dependsOn: string[] } }.
 * Devuelve {} si sección ausente, tabla no parseable, o cualquier error.
 *
 * @param {string} sprintDocPath — ruta absoluta al sprint doc
 * @returns {Object}
 */
function parseSprintTaskTable(sprintDocPath) {
  try {
    const content = fs.readFileSync(sprintDocPath, 'utf8');
    const lines = content.split('\n');
    const table = {};
    let inTable = false;
    for (const line of lines) {
      if (/^##\s+3\.\s+Tabla de tasks/i.test(line)) {
        inTable = true;
        continue;
      }
      if (inTable && /^##\s+/i.test(line)) break; // next H2 = end of table
      if (!inTable) continue;
      // Fila de datos: | NNN | ... | wave | depends |
      // Grupos: ID (col 1), wave (col 4), depends (col 5)
      const rowM = line.match(/^\|\s*(\d{3})\s*\|[^|]*\|[^|]*\|\s*(\d+)\s*\|\s*([^|]*)\s*\|/);
      if (rowM) {
        const taskId = rowM[1];
        const wave = parseInt(rowM[2], 10);
        const depsRaw = rowM[3].trim();
        // Parsear dependencias: "113, 114" → ["113", "114"]; "—" o "" → []
        const dependsOn = depsRaw === '—' || depsRaw === '' || depsRaw === '-'
          ? []
          : depsRaw.split(/[\s,]+/).filter(s => /^\d{3}$/.test(s));
        table[taskId] = { wave, dependsOn };
      }
    }
    return table;
  } catch {
    return {};
  }
}

/**
 * Para cada task del sprint (excepto currentTaskId), leer su task doc y extraer
 * files_touched. Errores de lectura → omitir task silenciosamente.
 *
 * @param {string} cwd
 * @param {string} currentTaskId — ID de la task que se está escribiendo (3 dígitos)
 * @param {Object} taskTable — resultado de parseSprintTaskTable
 * @returns {Object} { taskId: { wave, filesTouched, dependsOn } }
 */
function getSprintTaskFiles(cwd, currentTaskId, taskTable) {
  const result = {};
  for (const [taskId, info] of Object.entries(taskTable)) {
    if (taskId === currentTaskId) continue;
    try {
      const taskFile = findTaskFile(cwd, taskId);
      if (!taskFile) continue;
      const content = fs.readFileSync(taskFile, 'utf8');
      result[taskId] = {
        wave: info.wave,
        dependsOn: info.dependsOn,
        filesTouched: extractFilesTouched(content),
      };
    } catch {
      // Omitir silenciosamente — archivo borrado o sin permisos
    }
  }
  return result;
}

/**
 * Detectar overlaps de files_touched entre tasks de la misma wave sin
 * dependencia declarada entre ellas. Devuelve array de mensajes de warning.
 *
 * @param {string} currentTaskId
 * @param {string[]} currentFiles
 * @param {number} currentWave
 * @param {string[]} currentDependsOn — dependencias declaradas DE la task actual
 * @param {Object} siblingFiles — resultado de getSprintTaskFiles
 * @param {Object} taskTable — resultado de parseSprintTaskTable (para verificar depends recíprocos)
 * @param {string} sprintNum
 * @returns {string[]}
 */
function detectOverlaps(currentTaskId, currentFiles, currentWave, currentDependsOn, siblingFiles, taskTable, sprintNum) {
  const warnings = [];
  if (currentFiles.length === 0) return warnings;
  for (const [siblingId, siblingInfo] of Object.entries(siblingFiles)) {
    if (siblingInfo.wave !== currentWave) continue;
    if (siblingInfo.filesTouched.length === 0) continue;
    // Verificar dependencia bidireccional: A depende de B o B depende de A
    const aDepB = currentDependsOn.includes(siblingId);
    const bDepA = (siblingInfo.dependsOn || []).includes(currentTaskId);
    if (aDepB || bDepA) continue; // dependencia justifica el toque secuencial
    // Intersección de archivos normalizados
    const overlap = currentFiles.filter(f => siblingInfo.filesTouched.includes(f));
    for (const file of overlap) {
      warnings.push(
        `[sprint-sync WARN] Task ${currentTaskId} y Task ${siblingId} (Sprint ${sprintNum}, Wave ${currentWave}) modifican el mismo archivo sin \`Depende de:\` declarado: ${file}.\n` +
        `Recordatorio: task doc es source of truth de scope. Si la modificación es intencional, añadir \`Depende de: ${siblingId}\` en task ${currentTaskId} o viceversa; si es error, revisar el alcance en el task doc.`
      );
    }
  }
  return warnings;
}

// ---------------------------------------------------------------------------

async function runHook(input, preloadedConfig) {
  try {
    const data = typeof input === 'string' ? JSON.parse(input) : (input || {});
    const toolName = data.tool_name;
    const cwd = data.cwd || process.cwd();

    if (!['Write', 'Edit'].includes(toolName)) return { exitCode: 0 };

    const config = preloadedConfig !== undefined ? preloadedConfig : readConfig(cwd);
    if (!config) return { exitCode: 0 };
    const syncCfg = config.sprint_sync;
    if (!syncCfg || typeof syncCfg !== 'object' || !syncCfg.mode) return { exitCode: 0 };
    const mode = syncCfg.mode === 'block' ? 'block' : 'advisory';

    const filePath = (data.tool_input && data.tool_input.file_path) || '';
    if (!filePath) return { exitCode: 0 };

    if (isExcludedPath(filePath)) return { exitCode: 0 };

    if (!isUnderTasks(filePath) && !isUnderSprints(filePath)) return { exitCode: 0 };

    let content = '';
    if (toolName === 'Write') {
      content = (data.tool_input && data.tool_input.content) || '';
    } else if (toolName === 'Edit') {
      const oldString = (data.tool_input && data.tool_input.old_string) || '';
      const newString = (data.tool_input && data.tool_input.new_string) || '';
      if (fs.existsSync(filePath)) {
        try {
          const current = fs.readFileSync(filePath, 'utf8');
          const replaceAll = !!(data.tool_input && data.tool_input.replace_all);
          if (replaceAll) {
            content = current.split(oldString).join(newString);
          } else {
            const idx = current.indexOf(oldString);
            if (idx === -1) return { exitCode: 0 };
            content = current.slice(0, idx) + newString + current.slice(idx + oldString.length);
          }
        } catch {
          content = newString;
        }
      } else {
        content = newString;
      }
    }
    if (!content) return { exitCode: 0 };

    // warnings: array de strings (aditivo); advisories: siempre advisory, nunca block
    const warnings = [];
    const advisories = [];

    if (isUnderTasks(filePath)) {
      // Caso A: task doc — validar que el Sprint declarado existe y lista la task
      const sprintNum = extractSprintFromTask(content);
      if (sprintNum) {
        const sprintFile = findSprintFile(cwd, sprintNum);
        if (!sprintFile) {
          warnings.push(`[sprint-sync WARN] Task declara Sprint ${sprintNum} pero ai_docs/sprints/${sprintNum}_*.md no existe`);
        } else {
          const taskId = extractTaskIdFromFilename(filePath);
          if (taskId) {
            try {
              const sprintContent = fs.readFileSync(sprintFile, 'utf8');
              const ids = extractTaskIdsFromSprint(sprintContent);
              if (!ids.includes(taskId)) {
                warnings.push(`[sprint-sync WARN] Task ${taskId} no aparece en tabla del Sprint ${sprintNum}`);
              }
            } catch {
              // Lectura del sprint falló — no bloquear, fallar silencioso
            }

            // Validación de overlap de files_touched (aditiva)
            try {
              const currentFiles = extractFilesTouched(content);
              if (currentFiles.length > 0 && sprintFile) {
                const taskTable = parseSprintTaskTable(sprintFile);
                const currentEntry = taskTable[taskId];
                if (currentEntry && Object.keys(taskTable).length > 1) {
                  const siblingFiles = getSprintTaskFiles(cwd, taskId, taskTable);
                  const overlapWarns = detectOverlaps(
                    taskId,
                    currentFiles,
                    currentEntry.wave,
                    currentEntry.dependsOn,
                    siblingFiles,
                    taskTable,
                    sprintNum
                  );
                  for (const w of overlapWarns) warnings.push(w);
                }
              }
            } catch {
              // Overlap check falla silenciosamente — no interrumpir el flujo
            }
          }
        }
      }
    } else if (isUnderSprints(filePath)) {
      // Caso B: sprint doc — validar que cada task ID en la tabla existe
      const taskIds = extractTaskIdsFromSprint(content);
      const missing = taskIds.filter(id => !findTaskFile(cwd, id));
      if (missing.length > 0) {
        warnings.push(`[sprint-sync WARN] Sprint lista task(s) inexistente(s): ${missing.join(', ')}`);
      }

      // Advisory de cierre de sprint: invocar doc-syncer (opt-in via sprint_close_doc_sync)
      if (config.sprint_close_doc_sync === true) {
        const estado = extractSprintEstado(content);
        if (estado === 'COMPLETADA') {
          const sprintId = extractSprintFromFilename(filePath) || '??';
          advisories.push(
            `[sprint-sync INFO] Sprint ${sprintId} marcado como COMPLETADA. ` +
            `Invocar doc-syncer: "Cierre de sprint ${sprintId}. Audita ai_docs/core/ ` +
            `contra el código actual. Reporta GAP/EXTRA/DRIFT."`
          );
        }
      }

      // Cruzar files_touched de TODAS las tasks del sprint doc
      try {
        // Escribir el sprint doc a un tmp no aplica — el archivo aún no existe en disco.
        // Parsear la tabla del contenido siendo escrito para extraer IDs y waves.
        const taskTable = {};
        const lines = content.split('\n');
        let inTable = false;
        for (const line of lines) {
          if (/^##\s+3\.\s+Tabla de tasks/i.test(line)) { inTable = true; continue; }
          if (inTable && /^##\s+/i.test(line)) break;
          if (!inTable) continue;
          const rowM = line.match(/^\|\s*(\d{3})\s*\|[^|]*\|[^|]*\|\s*(\d+)\s*\|\s*([^|]*)\s*\|/);
          if (rowM) {
            const tId = rowM[1];
            const wave = parseInt(rowM[2], 10);
            const depsRaw = rowM[3].trim();
            const dependsOn = depsRaw === '—' || depsRaw === '' || depsRaw === '-'
              ? []
              : depsRaw.split(/[\s,]+/).filter(s => /^\d{3}$/.test(s));
            taskTable[tId] = { wave, dependsOn };
          }
        }
        if (Object.keys(taskTable).length > 1) {
          // Para cada task en la tabla, obtener sus files_touched del task doc en disco
          const taskFilesMap = {};
          for (const tId of Object.keys(taskTable)) {
            try {
              const tf = findTaskFile(cwd, tId);
              if (!tf) continue;
              const tc = fs.readFileSync(tf, 'utf8');
              taskFilesMap[tId] = extractFilesTouched(tc);
            } catch { /* omitir silenciosamente */ }
          }
          // Cruzar todos los pares de tasks de la misma wave sin dependencia
          const ids = Object.keys(taskFilesMap);
          for (let i = 0; i < ids.length; i++) {
            for (let j = i + 1; j < ids.length; j++) {
              const idA = ids[i], idB = ids[j];
              const infoA = taskTable[idA], infoB = taskTable[idB];
              if (!infoA || !infoB || infoA.wave !== infoB.wave) continue;
              const aDepB = (infoA.dependsOn || []).includes(idB);
              const bDepA = (infoB.dependsOn || []).includes(idA);
              if (aDepB || bDepA) continue;
              const filesA = taskFilesMap[idA] || [];
              const filesB = taskFilesMap[idB] || [];
              const overlap = filesA.filter(f => filesB.includes(f));
              const sprintId = extractSprintFromFilename(filePath);
              for (const file of overlap) {
                warnings.push(
                  `[sprint-sync WARN] Task ${idA} y Task ${idB} (Sprint ${sprintId || '??'}, Wave ${infoA.wave}) modifican el mismo archivo sin \`Depende de:\` declarado: ${file}.\n` +
                  `Recordatorio: task doc es source of truth de scope. Si la modificación es intencional, añadir \`Depende de: ${idB}\` en task ${idA} o viceversa; si es error, revisar el alcance en el task doc.`
                );
              }
            }
          }
        }
      } catch {
        // Overlap check en sprint doc falla silenciosamente
      }
    }

    if (warnings.length === 0 && advisories.length === 0) return { exitCode: 0 };

    if (mode === 'block' && warnings.length > 0) {
      // Advisories incluidas en el reason para visibilidad; causa del bloqueo son los warnings
      const reason = [...warnings, ...advisories].join('\n');
      return {
        exitCode: 2,
        stdoutJson: { decision: 'block', code: 'SPRINT_SYNC_BLOCKED', reason },
      };
    }

    const combined = [...warnings, ...advisories].join('\n');
    return {
      exitCode: 0,
      stdoutJson: {
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          additionalContext: combined,
        },
      },
    };
  } catch {
    return { exitCode: 0 };
  }
}

module.exports = runHook;
module.exports.runHook = runHook;

if (require.main === module) {
  let raw = '';
  const t = setTimeout(() => process.exit(0), 3000);
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
