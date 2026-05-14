#!/usr/bin/env node
// Task Doc Validator — PreToolUse hook (Write/Edit a ai_docs/tasks/*.md)
//
// Validador estructural mecánico de task docs en el momento de guardar. Atrapa
// malformatos antes de que se propaguen a downstream (subagents, plan-checker,
// doc-syncer).
//
// Defense-in-depth con skill `plan-checker`: el hook valida ESTRUCTURA
// mecánica al guardar; la skill valida SEMÁNTICA tras guardar. Capas distintas.
//
// Verificaciones:
//   1. Numeración del archivo: ^\d{3}_[\w-]+\.md$ (BLOCKER si no matchea).
//      Acepta sufijo opcional "_sNN_" dentro del descriptor (sprint suffix).
//   2. Sección "Criterios de Éxito" presente (h2 o h3, case-insensitive,
//      acepta con o sin tilde) — única sección obligatoria en todos los niveles.
//   3. ≥3 checkboxes en la sección de criterios (advisory si <3, no bloquea).
//   4. `> **Depende de:**` (opcional) bien formado si presente: IDs de 3 dígitos,
//      no auto-referencia, archivos referidos existen.
//   5. Cabeceras blockquote `> **Estado:**`, `> **Fecha de apertura:**`,
//      `> **Complejidad:**`, `> **Alcance:**` — TODAS OPCIONALES. Si están
//      presentes, se validan los valores. Si ausentes, no se penaliza.
//   6. Sección "Lifecycle" recomendada (advisory) en docs largos — no bloquea.
//   7. Sección "Casos límite mínimos" / "Failure Modes" / "Modos de fallo":
//      - BLOCKER si el task doc declara crear artifact ejecutable NUEVO Y
//        la sección está ausente o tiene <3 entradas concretas (≥30 chars cada una).
//      - ADVISORY si solo modifica artifacts existentes Y sección ausente o <3.
//      Detección "artifact ejecutable nuevo" via parsing de "Impactos esperados":
//      busca líneas con `(creado)` + extensión `.js|.sh|.ps1|.py|.ts|.tsx|.go|.jsx|.mjs|.cjs`
//      O paths bajo `.claude/(agents|hooks|skills)`, `src/`, `app/`,
//      `pages/api/`, `server/`.
//   8. Engineering Hygiene Criteria — los 4 substrings canónicos (Cleanup
//      exhaustivo de comentarios + Sin dead/legacy code + DRY/KISS/early returns
//      + TDD reutilizando infra) deben estar presentes en "Criterios de Éxito"
//      cuando la task toca código ejecutable. plan-checker D10 valida que cada
//      criterio tiene paso del plan que lo materializa. Excepción declarable
//      como "Excepción a Criterios de Calidad de Ingeniería..." dentro del
//      cuerpo de "Riesgos aceptados", "Decisiones aceptadas" o "Riesgos y
//      mitigaciones".
//   9. Sprint Suffix Coherence — si el filename incluye "_sNN_", debe haber
//      cabecera "> **Sprint:** NN" coherente. Reglas:
//        - filename con sufijo + sin cabecera Sprint → BLOCKER.
//        - filename con sufijo NN + cabecera Sprint MM (NN≠MM) → BLOCKER.
//        - filename sin sufijo + cabecera Sprint NN → WARN advisory.
//        - filename sin sufijo + sin cabecera Sprint → tarea atómica (válido).
//
// Severidad:
//   - BLOCKER (exit 2): numeración del filename inválida, "Criterios de Éxito"
//     ausente, dep referida inexistente, auto-referencia en deps,
//     "Casos límite mínimos" ausente con artifact ejecutable nuevo,
//     "Criterios de Calidad de Ingeniería" canónicos ausentes con código
//     ejecutable presente y sin declaración de excepción.
//   - ADVISORY (exit 0 con additionalContext): formato fecha incorrecto, valor
//     de Estado/Complejidad inválido cuando la cabecera está presente,
//     "Depende de:" mal formado pero parseable, criterios con <3 checkboxes,
//     Lifecycle recomendado ausente, "Casos límite mínimos" ausente sin
//     artifact ejecutable nuevo.
//
// Excepciones (no validar):
//   - Archivo en proceso de borrado (Write con content vacío).
//   - Path matchea ai_docs/tasks/000_* (calibración).
//
// Manejo de Edit puntual:
//   - Re-leer archivo, simular reemplazo, validar resultado.
//
// Opt-in: requiere `task_doc_validator: true` en .claude/hooks/config.json.

const fs = require('fs');
const path = require('path');
const { resolveAiDocsDir } = require('./hook-utils');

const VALID_STATES = ['ABIERTA', 'EN_PROGRESO', 'COMPLETADA', 'DESCARTADA'];
const VALID_COMPLEXITIES = ['SIMPLE', 'ESTÁNDAR', 'ESTANDAR', 'COMPLEJA', 'CRÍTICA', 'CRITICA'];

// Match flexible de "Criterios de Éxito" (con/sin tilde, case-insensitive).
// Acepta h2 (## ) o h3 (### ), con o sin numeración previa (ej. "### Criterios de Éxito"
// o "## Criterios de éxito" o "## 3. Criterios de exito").
const CRITERIA_HEADING_REGEX = /^#{2,3}\s+.*criterios\s+de\s+[éeè]xito.*$/im;
// Lookahead `(?=\n#{1,3}\s|$(?![\s\S]))` ancla a "próximo heading h1/h2/h3" o
// "fin-de-string real". `$(?![\s\S])` es fin-de-string verdadero incluso con
// flag `m`, evitando que el lazy `[\s\S]*?` cierre el grupo en el primer `\n`.
const CRITERIA_SECTION_REGEX = /^#{2,3}\s+.*criterios\s+de\s+[éeè]xito[^\n]*\n([\s\S]*?)(?=\n#{1,3}\s|$(?![\s\S]))/im;

// Failure Mode Coverage
// Acepta: "Casos límite/limite mínimos/minimos", "Failure Modes", "Modos de fallo".
const FAILURE_MODES_HEADING_REGEX = /^#{2,3}\s+.*(casos\s+l[íi]mite|failure\s+modes?|modos\s+de\s+fallo).*$/im;
const FAILURE_MODES_SECTION_REGEX = /^#{2,3}\s+.*(?:casos\s+l[íi]mite|failure\s+modes?|modos\s+de\s+fallo)[^\n]*\n([\s\S]*?)(?=\n#{1,3}\s|$(?![\s\S]))/im;

// Sección "Impactos esperados" para detectar artifacts nuevos.
const IMPACTS_SECTION_REGEX = /^#{2,3}\s+.*impactos?\s+esperados?[^\n]*\n([\s\S]*?)(?=\n#{1,3}\s|$(?![\s\S]))/im;

// Heurística "artifact ejecutable nuevo": línea contiene "(creado" + extensión
// ejecutable, O path bajo directorios ejecutables canónicos del proyecto
// (meta-repo: claude-templates/; destino: .claude/) o Node/Next/Python.
const EXEC_EXT_REGEX = /\.(js|sh|ps1|py|ts|tsx|go|jsx|mjs|cjs)\b/i;
const EXEC_PATH_REGEX = /(claude-templates\/(agents|hooks|skills)|\.claude\/(agents|hooks|skills)|\bsrc\/|\bapp\/|\bpages\/api\/|\bserver\/)/i;
// Acepta variantes: (creado), (nuevo), (added), (new) — con o sin contenido adicional.
const NEW_ARTIFACT_MARKER_REGEX = /\((creado|nuevo|added|new)[^)]*\)/i;

function hasNewExecutableArtifact(content) {
  const m = content.match(IMPACTS_SECTION_REGEX);
  if (!m) return false;
  const section = m[1];
  const lines = section.split(/\r?\n/);
  for (const line of lines) {
    if (!NEW_ARTIFACT_MARKER_REGEX.test(line)) continue;
    if (EXEC_EXT_REGEX.test(line) || EXEC_PATH_REGEX.test(line)) return true;
  }
  return false;
}

function countConcreteFailureModes(sectionContent) {
  // Cuenta bullets "concretos": ≥30 chars de texto tras el marker, no
  // placeholder vacío tipo "[describir]" o "TODO".
  const lines = sectionContent.split(/\r?\n/);
  let count = 0;
  for (const raw of lines) {
    const m = raw.match(/^\s*(?:[-*]|\d+\.)\s+(.+)$/);
    if (!m) continue;
    const text = m[1].trim();
    if (text.length < 30) continue;
    // Excluir placeholders puros (línea entera entre brackets) y TODO/describir solos.
    if (/^\[[^\]]*\]$/.test(text)) continue;
    if (/^(TODO|FIXME|describir|placeholder|listar|por\s+rellenar)\b/i.test(text)) continue;
    count++;
  }
  return count;
}

// Engineering Hygiene Criteria.
// Los 4 substrings canónicos que TODO task que toca código ejecutable debe
// listar en "Criterios de Éxito". Las patterns son tolerantes a variantes
// razonables (ver task_template.md sección "Criterios de Éxito").
//
// Para `dry-kiss`, el regex acepta tanto el header canónico junto
// (`DRY/KISS/early returns aplicados`) como variantes en líneas separadas
// donde los 3 conceptos aparecen en cualquier orden dentro del cuerpo de
// la sección (lookaheads multi-línea `[\s\S]*`).
const HYGIENE_CRITERIA_PATTERNS = [
  { id: 'cleanup-comentarios', pattern: /Cleanup\s+exhaustivo\s+de\s+comentarios/i, name: 'Cleanup exhaustivo de comentarios' },
  { id: 'dead-legacy', pattern: /Sin\s+dead(?:\/legacy)?\s+code|Sin\s+legacy\s+code/i, name: 'Sin dead/legacy code' },
  { id: 'dry-kiss', pattern: /DRY\/KISS\/early\s+returns|(?=[\s\S]*\bDRY\b)(?=[\s\S]*\bKISS\b)(?=[\s\S]*early\s+returns?)/i, name: 'DRY/KISS/early returns aplicados' },
  { id: 'tdd', pattern: /TDD\s+reutilizando\s+infra|Tests?\s+con\s+infra\s+existente/i, name: 'TDD reutilizando infra existente' },
];

// Declaración de excepción: ÚNICAMENTE válida dentro del cuerpo de una de
// las 3 secciones aceptadas (coherente con plan-checker SKILL.md). Acotar
// al cuerpo evita falsos positivos si el texto aparece en un comentario
// suelto del plan.
const HYGIENE_EXCEPTION_SECTION_REGEX = /^#{2,3}\s+.*(?:riesgos\s+aceptados|decisiones\s+aceptadas|riesgos\s+y\s+mitigaciones)[^\n]*\n([\s\S]*?)(?=\n#{1,3}\s|$(?![\s\S]))/im;
const HYGIENE_EXCEPTION_BODY_REGEX = /Excepci[óo]n\s+a\s+Criterios\s+de\s+Calidad\s+de\s+Ingenier[íi]a/i;

function hasHygieneException(content) {
  const m = content.match(HYGIENE_EXCEPTION_SECTION_REGEX);
  if (!m) return false;
  return HYGIENE_EXCEPTION_BODY_REGEX.test(m[1]);
}

// Reusa EXEC_EXT_REGEX/EXEC_PATH_REGEX existentes. Distinto a
// hasNewExecutableArtifact: aquí basta cualquier mención de archivo
// ejecutable (creado o modificado), no exige marker (creado/nuevo/added/new).
function hasExecutableContent(content) {
  return EXEC_EXT_REGEX.test(content) || EXEC_PATH_REGEX.test(content);
}

// Sprint Suffix Coherence. Acopla filename "_sNN_" con cabecera
// "> **Sprint:** NN". Anclaje single-line con flag /m sobre las primeras 30
// líneas del task doc — la cabecera blockquote vive al inicio.
const FILENAME_SPRINT_SUFFIX_REGEX = /^\d{3}_s(\d{2})_/;
const SPRINT_HEADER_REGEX = /^>\s*\*\*Sprint:\*\*\s*(\d+)\s*$/m;

async function runHook(input, preloadedConfig) {
  try {
    const data = typeof input === 'string' ? JSON.parse(input) : (input || {});
    const toolName = data.tool_name;
    const cwd = data.cwd || process.cwd();

    if (!['Write', 'Edit'].includes(toolName)) return { exitCode: 0 };

    const config = preloadedConfig !== undefined ? preloadedConfig
      : (() => { try { return JSON.parse(fs.readFileSync(path.join(cwd, '.claude', 'hooks', 'config.json'), 'utf8')); } catch { return null; } })();
    if (!config || config.task_doc_validator !== true) return { exitCode: 0 };

    const filePath = (data.tool_input && data.tool_input.file_path) || '';
    if (!filePath) return { exitCode: 0 };

    // Solo activar para ai_docs/tasks/*.md (cross-platform)
    const normalized = filePath.replace(/\\/g, '/');
    if (!/\bai_docs\/tasks\/[^/]+\.md$/.test(normalized)) return { exitCode: 0 };

    const fileName = path.basename(filePath);

    // Excepción: 000_* (calibración del proyecto)
    if (/^000_/.test(fileName)) return { exitCode: 0 };

    // CHECK numeración del nombre del archivo (BLOCKER)
    if (!/^\d{3}_[\w-]+\.md$/.test(fileName)) {
      return blockResult(
        'TASK_DOC_FILENAME_INVALID',
        `Filename "${fileName}" must match the pattern NNN_descriptor.md (3-digit number prefix, snake_case or kebab-case descriptor, .md extension). See CLAUDE.md §3.2.`
      );
    }

    // Determinar contenido a validar
    let contentToValidate = '';

    if (toolName === 'Write') {
      contentToValidate = (data.tool_input && data.tool_input.content) || '';

      // Excepción: archivo en proceso de borrado (content vacío en Write)
      if (contentToValidate.trim() === '') return { exitCode: 0 };
    } else if (toolName === 'Edit') {
      // Estrategia: leer el archivo actual (pre-edit), simular el reemplazo,
      // validar el resultado.
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
        if (idx === -1) {
          // El edit fallará igualmente; no nuestro problema. Salir silencioso.
          return { exitCode: 0 };
        }
        contentToValidate = current.slice(0, idx) + newString + current.slice(idx + oldString.length);
      }
    }

    // === Validaciones sobre contentToValidate ===

    const errors = [];   // BLOCKER
    const warnings = []; // ADVISORY

    // 1. CABECERAS BLOCKQUOTE OPCIONALES — buscar en las primeras 30 líneas.
    //    Si están presentes, validar valores. Si ausentes, no penalizar.
    const head = contentToValidate.split(/\r?\n/).slice(0, 30).join('\n');

    const stateMatch = head.match(/^>\s*\*\*Estado:\*\*\s*([A-ZÁÉÍÓÚÑ_]+)/m);
    if (stateMatch && !VALID_STATES.includes(stateMatch[1])) {
      warnings.push(`Header "Estado" has invalid value "${stateMatch[1]}". Expected one of: ${VALID_STATES.join(', ')}.`);
    }

    const dateMatch = head.match(/^>\s*\*\*Fecha de apertura:\*\*\s*(\S+)/m);
    if (dateMatch && !/^\d{4}-\d{2}-\d{2}$/.test(dateMatch[1])) {
      warnings.push(`Header "Fecha de apertura" "${dateMatch[1]}" should be in YYYY-MM-DD format.`);
    }

    const complexityMatch = head.match(/^>\s*\*\*Complejidad:\*\*\s*([A-ZÁÉÍÓÚÑ]+)/m);
    if (complexityMatch && !VALID_COMPLEXITIES.includes(complexityMatch[1])) {
      warnings.push(`Header "Complejidad" has invalid value "${complexityMatch[1]}". Expected one of: SIMPLE, ESTÁNDAR, COMPLEJA, CRÍTICA.`);
    }

    const scopeMatch = head.match(/^>\s*\*\*Alcance:\*\*\s*(\S.*)/m);
    if (scopeMatch && scopeMatch[1].trim().length === 0) {
      warnings.push('Header "Alcance" is present but empty.');
    }

    // 1.5 Sprint Suffix Coherence.
    //     Filename con sufijo "_sNN_" debe coincidir con cabecera Sprint NN.
    const filenameSuffixMatch = fileName.match(FILENAME_SPRINT_SUFFIX_REGEX);
    const sprintHeaderMatch = head.match(SPRINT_HEADER_REGEX);
    const filenameSprintSuffix = filenameSuffixMatch ? filenameSuffixMatch[1] : null;
    const sprintHeaderId = sprintHeaderMatch ? sprintHeaderMatch[1].padStart(2, '0') : null;

    if (filenameSprintSuffix && !sprintHeaderId) {
      errors.push(
        `[SPRINT_SUFFIX_MISMATCH] Filename has sprint suffix "_s${filenameSprintSuffix}_" but body lacks "> **Sprint:** NN" header. Add the header or rename the file without the suffix.`
      );
    } else if (filenameSprintSuffix && sprintHeaderId && filenameSprintSuffix !== sprintHeaderId) {
      errors.push(
        `[SPRINT_SUFFIX_MISMATCH] Filename suffix "_s${filenameSprintSuffix}_" does not match body header "> **Sprint:** ${sprintHeaderId}". They must reference the same sprint number.`
      );
    } else if (!filenameSprintSuffix && sprintHeaderId) {
      warnings.push(
        `Task declares "> **Sprint:** ${sprintHeaderId}" but filename lacks suffix "_s${sprintHeaderId}_". Recommended to rename to NNN_s${sprintHeaderId}_<descriptor>.md for traceability.`
      );
    }

    // 2. `Depende de:` (opcional, validado estrictamente si presente)
    const depMatch = head.match(/^>\s*\*\*Depende de:\*\*\s*(.+)$/m);
    if (depMatch) {
      const ids = depMatch[1].split(/[,\s]+/).map(s => s.trim()).filter(Boolean);
      const taskFileId = fileName.match(/^(\d{3})/)[1];
      const tasksDir = path.join(resolveAiDocsDir(cwd), 'tasks');

      for (const id of ids) {
        if (!/^\d{3}$/.test(id)) {
          warnings.push(`"Depende de:" entry "${id}" should be a 3-digit task ID.`);
          continue;
        }
        if (id === taskFileId) {
          errors.push(`"Depende de:" cannot self-reference (this task is ${id}).`);
          continue;
        }
        // Verificar existencia del task referido (SKIP si el dir no existe)
        if (fs.existsSync(tasksDir)) {
          try {
            const exists = fs.readdirSync(tasksDir).some(f => f.startsWith(`${id}_`));
            if (!exists) {
              errors.push(`"Depende de:" references task ${id} but no file ai_docs/tasks/${id}_*.md exists.`);
            }
          } catch { /* ignore */ }
        }
      }
    }

    // 3. SECCIÓN "Criterios de Éxito" obligatoria (h2 o h3) — única exigida.
    //    Match flexible: case-insensitive, con/sin tilde, con/sin numeración.
    if (!CRITERIA_HEADING_REGEX.test(contentToValidate)) {
      errors.push('Missing required section "Criterios de Éxito" (h2 or h3, case-insensitive, with or without accent).');
    } else {
      // 4. Conteo de checkboxes en la sección de criterios.
      const sectionMatch = contentToValidate.match(CRITERIA_SECTION_REGEX);
      if (sectionMatch) {
        const checkboxCount = (sectionMatch[1].match(/^\s*-\s*\[\s*[xX ]\s*\]/gm) || []).length;
        if (checkboxCount === 0) {
          errors.push('Section "Criterios de Éxito" found but contains zero checkboxes — at least one criterion is required.');
        } else if (checkboxCount < 3) {
          warnings.push(`Section "Criterios de Éxito" has ${checkboxCount} checkbox(es); recommended at least 3.`);
        }
      }
    }

    // 5. Sección "Lifecycle" recomendada (advisory). Detecta h2 o h3 con
    //    "Lifecycle" en cualquier parte del título (ej. "## 5. Lifecycle").
    const headings = contentToValidate.match(/^#{2,3}\s+.+$/gm) || [];
    const hasLifecycle = headings.some(h => /lifecycle/i.test(h));
    // Solo advisory si el doc es claramente largo (>40 líneas) — heurística simple
    // para evitar advisorios espurios en SIMPLE.
    const lineCount = contentToValidate.split(/\r?\n/).length;
    if (!hasLifecycle && lineCount > 40) {
      warnings.push('Section "Lifecycle" recommended for ESTÁNDAR/COMPLEJA/CRÍTICA tasks (advisory).');
    }

    // 6. Sección "Casos límite mínimos" — Failure Mode Coverage.
    //    BLOCKER si artifact ejecutable nuevo Y (sección ausente O <3 entradas concretas).
    //    ADVISORY si solo edits Y (sección ausente O <3 entradas concretas).
    const hasFailureSection = FAILURE_MODES_HEADING_REGEX.test(contentToValidate);
    const hasNewExec = hasNewExecutableArtifact(contentToValidate);
    let concreteCount = 0;
    if (hasFailureSection) {
      const fmMatch = contentToValidate.match(FAILURE_MODES_SECTION_REGEX);
      if (fmMatch) {
        concreteCount = countConcreteFailureModes(fmMatch[1]);
      }
    }
    const failureModesUnderfilled = !hasFailureSection || concreteCount < 3;
    if (failureModesUnderfilled) {
      const detail = !hasFailureSection
        ? 'section absent'
        : `${concreteCount} concrete entries (need ≥3, ≥30 chars each, no placeholders)`;
      if (hasNewExec) {
        errors.push(
          `Section "Casos límite mínimos" / "Failure Modes" ${detail}. Dimension 8 requires ≥3 concrete failure modes when task creates new executable artifact (hook/agent/skill/code under src|app|server|pages/api).`
        );
      } else {
        warnings.push(
          `Section "Casos límite mínimos" / "Failure Modes" ${detail} (advisory — task only modifies existing artifacts). Recommended to declare ≥3 concrete failure modes.`
        );
      }
    }

    // 7. Engineering Hygiene Criteria.
    //    BLOCKER si task menciona código ejecutable Y los 4 criterios canónicos
    //    no están presentes en el documento Y no hay declaración de excepción.
    //    Búsqueda sobre el documento completo (no solo "Criterios de Éxito")
    //    porque la sub-sección canónica "Criterios de Calidad de Ingeniería"
    //    suele ser sibling h3, fuera del cuerpo capturado por
    //    CRITERIA_SECTION_REGEX. Los strings canónicos son específicos —
    //    riesgo de falso negativo despreciable. Defense-in-depth con
    //    plan-checker D10 (semántico) sobre la misma materia.
    if (hasExecutableContent(contentToValidate) && !hasHygieneException(contentToValidate)) {
      for (const criterion of HYGIENE_CRITERIA_PATTERNS) {
        if (!criterion.pattern.test(contentToValidate)) {
          errors.push(
            `Engineering Hygiene criterion "${criterion.name}" missing from task doc but task touches executable code. Add the canonical "Criterios de Calidad de Ingeniería" block from task_template.md (sección "Criterios de Éxito") or declare exception in "Riesgos aceptados" / "Decisiones aceptadas" / "Riesgos y mitigaciones" section.`
          );
        }
      }
    }

    // === Output ===

    if (errors.length > 0) {
      const reason =
        `Task doc structure invalid (${errors.length} error${errors.length === 1 ? '' : 's'}):\n- ` +
        errors.join('\n- ') +
        (warnings.length > 0 ? `\n\nAdditional warnings:\n- ` + warnings.join('\n- ') : '');
      return blockResult('TASK_DOC_STRUCTURE_INVALID', reason);
    }

    if (warnings.length > 0) {
      return {
        exitCode: 0,
        stdoutJson: {
          hookSpecificOutput: {
            hookEventName: 'PreToolUse',
            additionalContext:
              `TASK DOC ADVISORY (${warnings.length} formatting issue${warnings.length === 1 ? '' : 's'}):\n- ` +
              warnings.join('\n- '),
          },
        },
      };
    }

    return { exitCode: 0 };
  } catch {
    return { exitCode: 0 };
  }
}

function blockResult(code, reason) {
  return {
    exitCode: 2,
    stdoutJson: { decision: 'block', code, reason },
  };
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
