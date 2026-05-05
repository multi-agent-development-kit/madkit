#!/usr/bin/env node
// hook-version: 1.0.0
// Task Doc Validator — PreToolUse hook (Write/Edit a ai_docs/tasks/*.md)
//
// Validador estructural mecánico de task docs en el momento de guardar. Atrapa
// malformatos antes de que se propaguen a downstream (subagents, plan-checker,
// doc-syncer).
//
// Defense-in-depth con skill `plan-checker` (T078): el hook valida ESTRUCTURA
// mecánica al guardar; la skill valida SEMÁNTICA tras guardar. Capas distintas.
//
// Verificaciones:
//   1. Cabecera obligatoria (Estado, Fecha de apertura, Complejidad, Alcance).
//   2. `> **Depende de:**` (opcional) bien formado si presente.
//   3. Secciones obligatorias por nivel de complejidad.
//   4. Numeración del archivo: ^\d{3}_[\w-]+\.md$.
//   5. Criterios de éxito con al menos 3 checkboxes.
//
// Severidad:
//   - BLOCKER (exit 2): cabecera ausente, sección obligatoria faltante, numeración
//     inválida, dep referida que no existe.
//   - ADVISORY (exit 0 con decision:approve + reason): formato fecha incorrecto,
//     "Depende de:" mal formado pero parseable, criterios sin checkboxes.
//
// Excepciones (no validar):
//   - Archivo en proceso de borrado (Write con content vacío).
//   - Path matchea ai_docs/tasks/000_* (calibración).
//
// Manejo de Edit puntual:
//   - Si old_string/new_string no tocan cabecera ni headings de sección
//     obligatoria, re-leer el archivo final post-mortem y re-validar.
//   - Si rompe estructura, BLOCKER.
//
// Opt-in: requiere `task_doc_validator: true` en .claude/hooks/config.json.

const fs = require('fs');
const path = require('path');

const VALID_STATES = ['ABIERTA', 'EN_PROGRESO', 'COMPLETADA', 'DESCARTADA'];
const VALID_COMPLEXITIES = ['SIMPLE', 'ESTÁNDAR', 'ESTANDAR', 'COMPLEJA', 'CRÍTICA', 'CRITICA'];

// Secciones obligatorias por nivel de complejidad
const REQUIRED_SECTIONS = {
  SIMPLE: ['## Contexto', '## Plan', '## Criterios de éxito'],
  ESTANDAR: ['## Contexto', '## Principios', '## Plan', '## Criterios de éxito', '## Impactos esperados', '## Estado'],
  COMPLEJA: ['## Contexto', '## Principios', '## Plan', '## Criterios de éxito', '## Impactos esperados', '## Riesgos y mitigaciones', '## Tareas relacionadas', '## Estado'],
  CRITICA: ['## Contexto', '## Principios', '## Plan', '## Criterios de éxito', '## Impactos esperados', '## Riesgos y mitigaciones', '## Tareas relacionadas', '## Estado'],
};

let input = '';
const stdinTimeout = setTimeout(() => process.exit(0), 5000);
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);
  try {
    const data = JSON.parse(input);
    const toolName = data.tool_name;
    const cwd = data.cwd || process.cwd();

    if (!['Write', 'Edit'].includes(toolName)) {
      process.exit(0);
    }

    // Opt-in
    const configPath = path.join(cwd, '.claude', 'hooks', 'config.json');
    if (!fs.existsSync(configPath)) {
      process.exit(0);
    }
    let config;
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch {
      process.exit(0);
    }
    if (config.task_doc_validator !== true) {
      process.exit(0);
    }

    const filePath = (data.tool_input && data.tool_input.file_path) || '';
    if (!filePath) {
      process.exit(0);
    }

    // Solo activar para ai_docs/tasks/*.md (cross-platform)
    const normalized = filePath.replace(/\\/g, '/');
    if (!/\bai_docs\/tasks\/[^/]+\.md$/.test(normalized)) {
      process.exit(0);
    }

    const fileName = path.basename(filePath);

    // Excepción: 000_* (calibración del proyecto)
    if (/^000_/.test(fileName)) {
      process.exit(0);
    }

    // CHECK numeración del nombre del archivo
    if (!/^\d{3}_[\w-]+\.md$/.test(fileName)) {
      blockExit(
        'TASK_DOC_FILENAME_INVALID',
        `Filename "${fileName}" must match the pattern NNN_descriptor.md (3-digit number prefix, snake_case or kebab-case descriptor, .md extension). See CLAUDE.md §3.2.`
      );
    }

    // Determinar contenido a validar
    let contentToValidate = '';
    let isFullWrite = false;

    if (toolName === 'Write') {
      contentToValidate = (data.tool_input && data.tool_input.content) || '';
      isFullWrite = true;

      // Excepción: archivo en proceso de borrado (content vacío en Write)
      if (contentToValidate.trim() === '') {
        process.exit(0);
      }
    } else if (toolName === 'Edit') {
      // Para Edit, hay dos enfoques:
      // 1) si old_string toca cabecera o heading obligatorio → validar new_string en contexto del archivo entero
      // 2) si no toca, re-leer archivo y aplicar el edit mentalmente para validar
      //
      // Estrategia simplificada: leer el archivo actual (pre-edit), simular el
      // reemplazo, y validar el resultado. Si el archivo no existe (lo crea
      // este Edit, raro pero posible), saltar validación al Write futuro.
      const oldString = (data.tool_input && data.tool_input.old_string) || '';
      const newString = (data.tool_input && data.tool_input.new_string) || '';
      if (!fs.existsSync(filePath)) {
        process.exit(0);
      }
      let current;
      try {
        current = fs.readFileSync(filePath, 'utf8');
      } catch {
        process.exit(0);
      }
      // Simular el edit (replace_all asumido false por defecto)
      const replaceAll = !!(data.tool_input && data.tool_input.replace_all);
      if (replaceAll) {
        contentToValidate = current.split(oldString).join(newString);
      } else {
        const idx = current.indexOf(oldString);
        if (idx === -1) {
          // El edit fallará igualmente; no nuestro problema. Salir silencioso.
          process.exit(0);
        }
        contentToValidate = current.slice(0, idx) + newString + current.slice(idx + oldString.length);
      }
    }

    // === Validaciones sobre contentToValidate ===

    const errors = [];   // BLOCKER
    const warnings = []; // ADVISORY

    // 1. CABECERA — buscar las 4 líneas obligatorias en las primeras 30 líneas
    const head = contentToValidate.split(/\r?\n/).slice(0, 30).join('\n');

    const stateMatch = head.match(/^>\s*\*\*Estado:\*\*\s*([A-ZÁÉÍÓÚÑ_]+)/m);
    if (!stateMatch) {
      errors.push('Missing or malformed `> **Estado:**` line in header (first 30 lines).');
    } else if (!VALID_STATES.includes(stateMatch[1])) {
      errors.push(`Invalid state "${stateMatch[1]}". Must be one of: ${VALID_STATES.join(', ')}.`);
    }

    const dateMatch = head.match(/^>\s*\*\*Fecha de apertura:\*\*\s*(\S+)/m);
    if (!dateMatch) {
      errors.push('Missing `> **Fecha de apertura:**` line in header.');
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(dateMatch[1])) {
      warnings.push(`Date "${dateMatch[1]}" should be in YYYY-MM-DD format.`);
    }

    const complexityMatch = head.match(/^>\s*\*\*Complejidad:\*\*\s*([A-ZÁÉÍÓÚÑ]+)/m);
    let complexityKey = null;
    if (!complexityMatch) {
      errors.push('Missing or malformed `> **Complejidad:**` line in header.');
    } else {
      const c = complexityMatch[1];
      if (!VALID_COMPLEXITIES.includes(c)) {
        errors.push(`Invalid complexity "${c}". Must be one of: SIMPLE, ESTÁNDAR, COMPLEJA, CRÍTICA.`);
      } else {
        // Normalizar a clave sin acentos
        if (c === 'ESTÁNDAR' || c === 'ESTANDAR') complexityKey = 'ESTANDAR';
        else if (c === 'CRÍTICA' || c === 'CRITICA') complexityKey = 'CRITICA';
        else complexityKey = c;
      }
    }

    const scopeMatch = head.match(/^>\s*\*\*Alcance:\*\*\s*(\S.*)/m);
    if (!scopeMatch) {
      errors.push('Missing `> **Alcance:**` line in header (must be non-empty).');
    }

    // 2. `Depende de:` (opcional)
    const depMatch = head.match(/^>\s*\*\*Depende de:\*\*\s*(.+)$/m);
    if (depMatch) {
      const ids = depMatch[1].split(/[,\s]+/).map(s => s.trim()).filter(Boolean);
      const taskFileId = fileName.match(/^(\d{3})/)[1];
      const tasksDir = path.join(cwd, 'ai_docs', 'tasks');

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

    // 3. SECCIONES OBLIGATORIAS por complejidad
    if (complexityKey) {
      const requiredSections = REQUIRED_SECTIONS[complexityKey] || [];
      const headings = (contentToValidate.match(/^##\s.+$/gm) || []).map(h => h.trim());
      for (const required of requiredSections) {
        // Match flexible: ignorar numeración o sufijos opcionales
        const baseTitle = required.replace(/^##\s*/, '').toLowerCase();
        const found = headings.some(h => h.toLowerCase().includes(baseTitle));
        if (!found) {
          errors.push(`Missing required section for complexity ${complexityKey}: "${required}".`);
        }
      }
    }

    // 4. CRITERIOS DE ÉXITO con checkboxes (advisory si <3)
    const criteriaMatch = contentToValidate.match(/##\s+Criterios de éxito[\s\S]*?(?=\n##\s|\n#\s|$)/);
    if (criteriaMatch) {
      const checkboxCount = (criteriaMatch[0].match(/^-\s*\[\s*[xX ]\s*\]/gm) || []).length;
      if (checkboxCount < 3) {
        warnings.push(`Section "Criterios de éxito" has ${checkboxCount} checkbox(es); recommended at least 3.`);
      }
    }

    // === Output ===

    if (errors.length > 0) {
      const reason =
        `Task doc structure invalid (${errors.length} error${errors.length === 1 ? '' : 's'}):\n- ` +
        errors.join('\n- ') +
        (warnings.length > 0 ? `\n\nAdditional warnings:\n- ` + warnings.join('\n- ') : '');
      blockExit('TASK_DOC_STRUCTURE_INVALID', reason);
    }

    if (warnings.length > 0) {
      const output = {
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          additionalContext:
            `TASK DOC ADVISORY (${warnings.length} formatting issue${warnings.length === 1 ? '' : 's'}):\n- ` +
            warnings.join('\n- ')
        }
      };
      process.stdout.write(JSON.stringify(output));
    }

    process.exit(0);
  } catch {
    // Silent fail — nunca bloquear
    process.exit(0);
  }
});

function blockExit(code, reason) {
  process.stdout.write(JSON.stringify({
    decision: 'block',
    code,
    reason
  }));
  process.exit(2);
}
