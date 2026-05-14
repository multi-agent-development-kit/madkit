#!/usr/bin/env node
// Context Monitor — PostToolUse hook
//
// Lee métricas de contexto del bridge file que escribe el statusline de Claude Code
// e inyecta avisos cuando el contexto se agota. Cuando llega a CRITICAL_BREADCRUMB
// (≤10% restante) escribe ai_docs/STATE.md como breadcrumb para retomar la sesión.
//
// Adaptado de get-shit-done/hooks/gsd-context-monitor.js — eliminadas dependencias
// de .planning/, sustituidas por .claude/hooks/config.json y ai_docs/STATE.md.
//
// Cómo funciona:
//   1. El statusline escribe métricas en <tmpdir>/claude-ctx-{session_id}.json
//   2. Este hook las lee tras cada tool use
//   3. Si remaining baja del threshold, inyecta WARN/CRITICAL al agent
//   4. Si baja del threshold de breadcrumb, escribe ai_docs/STATE.md
//
// Thresholds:
//   WARNING            (remaining ≤ 35%)  — agent debe terminar el subtask actual
//   CRITICAL           (remaining ≤ 25%)  — agent debe parar y avisar al usuario
//   CRITICAL_BREADCRUMB (remaining ≤ 10%) — además escribe STATE.md
//
// Debounce: 5 tool uses entre warnings repetidas. Severity escalation
// (WARNING → CRITICAL) bypasea el debounce.

const fs = require('fs');
const os = require('os');
const path = require('path');

// Resolución robusta de la ruta a ai_docs/ mediante .claude/.ai_docs_path.
// Fallback garantizado a cwd/ai_docs para cero regresión en proyectos canónicos.
function resolveAiDocsDir(cwd) {
  const overridePath = path.join(cwd, '.claude', '.ai_docs_path');
  try {
    const raw = fs.readFileSync(overridePath, 'utf8').replace(/^﻿/, '');
    const resolved = raw.split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('#'))[0];
    if (resolved && path.isAbsolute(resolved) && fs.existsSync(resolved)) {
      return resolved;
    }
  } catch (_) { /* archivo no existe o no legible → fallback */ }
  return path.join(cwd, 'ai_docs');
}

const WARNING_THRESHOLD = 35;
const CRITICAL_THRESHOLD = 25;
const BREADCRUMB_THRESHOLD = 10;
const STALE_SECONDS = 60;
const DEBOUNCE_CALLS = 5;

async function runHook(input) {
  try {
    const data = typeof input === 'string' ? JSON.parse(input) : (input || {});
    const sessionId = data.session_id;

    if (!sessionId) return { exitCode: 0 };

    // Sanitizar session_id: rechazar separadores de path o ".." para evitar traversal
    if (/[/\\]|\.\./.test(sessionId)) return { exitCode: 0 };

    const cwd = data.cwd || process.cwd();

    const configPath = path.join(cwd, '.claude', 'hooks', 'config.json');
    if (!fs.existsSync(configPath)) return { exitCode: 0 };
    let config;
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch {
      return { exitCode: 0 };
    }
    if (config.context_monitor !== true) return { exitCode: 0 };

    const tmpDir = os.tmpdir();
    const metricsPath = path.join(tmpDir, `claude-ctx-${sessionId}.json`);

    if (!fs.existsSync(metricsPath)) return { exitCode: 0 };

    let metrics;
    try {
      metrics = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
    } catch {
      return { exitCode: 0 };
    }

    const now = Math.floor(Date.now() / 1000);
    if (metrics.timestamp && (now - metrics.timestamp) > STALE_SECONDS) return { exitCode: 0 };

    const remaining = metrics.remaining_percentage;
    const usedPct = metrics.used_pct;

    if (typeof remaining !== 'number' || remaining > WARNING_THRESHOLD) return { exitCode: 0 };

    const warnPath = path.join(tmpDir, `claude-ctx-${sessionId}-warned.json`);
    let warnData = { callsSinceWarn: 0, lastLevel: null, breadcrumbWritten: false };
    let firstWarn = true;

    if (fs.existsSync(warnPath)) {
      try {
        warnData = JSON.parse(fs.readFileSync(warnPath, 'utf8'));
        firstWarn = false;
      } catch {
        // corrupto, reset
      }
    }

    warnData.callsSinceWarn = (warnData.callsSinceWarn || 0) + 1;

    const isCritical = remaining <= CRITICAL_THRESHOLD;
    const isBreadcrumb = remaining <= BREADCRUMB_THRESHOLD;
    const currentLevel = isCritical ? 'critical' : 'warning';

    const severityEscalated = currentLevel === 'critical' && warnData.lastLevel === 'warning';
    if (!firstWarn && warnData.callsSinceWarn < DEBOUNCE_CALLS && !severityEscalated && !isBreadcrumb) {
      fs.writeFileSync(warnPath, JSON.stringify(warnData));
      return { exitCode: 0 };
    }

    warnData.callsSinceWarn = 0;
    warnData.lastLevel = currentLevel;

    // Breadcrumb a ai_docs/STATE.md cuando ≤10% restante
    // Solo lo escribimos UNA vez por sesión (warnData.breadcrumbWritten),
    // para no sobrescribir el "momento de crash" en cada debounce.
    if (isBreadcrumb && !warnData.breadcrumbWritten) {
      try {
        const stateDir = resolveAiDocsDir(cwd);
        if (fs.existsSync(stateDir)) {
          const statePath = path.join(stateDir, 'STATE.md');
          const lastTool = data.tool_name || 'unknown';
          const lastFile =
            (data.tool_input && (data.tool_input.file_path || data.tool_input.command || '')) || '';

          // Detectar active_task: buscar el task doc más reciente en ai_docs/tasks/
          // No mutamos nada; solo leemos para registrar.
          let activeTask = 'unknown';
          const tasksDir = path.join(stateDir, 'tasks');
          if (fs.existsSync(tasksDir)) {
            try {
              const taskFiles = fs.readdirSync(tasksDir)
                .filter(f => /^\d{3}_.*\.md$/.test(f))
                .sort();
              if (taskFiles.length > 0) {
                const latestTaskFile = taskFiles[taskFiles.length - 1];
                const match = latestTaskFile.match(/^(\d{3})_/);
                if (match) activeTask = match[1];
              }
            } catch { /* ignore */ }
          }

          const stateContent =
`---
active_task: ${activeTask}
phase: unknown — revisar el task doc para localizar la fase actual
last_action: ${lastTool}${lastFile ? ' on ' + path.basename(lastFile) : ''}
timestamp: ${new Date().toISOString()}
session_id: ${sessionId}
---

# Breadcrumb automático — context-monitor hook

Contexto agotado al ${usedPct}% (${remaining}% restante). Sesión cerrada en plena fase. Para retomar:

1. Lee \`ai_docs/tasks/${activeTask}_*.md\`
2. Localiza la fase indicada arriba (revisar "Estado de implementación" si existe)
3. Continúa desde el último step no completado
`;
          fs.writeFileSync(statePath, stateContent);
          warnData.breadcrumbWritten = true;
        }
      } catch {
        // no romper el hook si falla la escritura
      }
    }

    fs.writeFileSync(warnPath, JSON.stringify(warnData));

    // Mensaje al agent
    let message;
    if (isBreadcrumb) {
      message =
        `CONTEXT BREADCRUMB ESCRITO: Uso ${usedPct}%, restante ${remaining}%. ` +
        `Se ha escrito ai_docs/STATE.md como breadcrumb para retomar en una sesión nueva. ` +
        `Avisa al usuario que el contexto está casi agotado y propón cerrar el subtask actual.`;
    } else if (isCritical) {
      message =
        `CONTEXT CRITICAL: Uso ${usedPct}%, restante ${remaining}%. ` +
        `Contexto casi agotado. Avisa al usuario y pregunta cómo proceder. ` +
        `NO inicies trabajo nuevo. NO escribas archivos de handoff sin pedirlo el usuario.`;
    } else {
      message =
        `CONTEXT WARNING: Uso ${usedPct}%, restante ${remaining}%. ` +
        `Contexto limitado. Evita iniciar trabajo nuevo o exploración innecesaria. ` +
        `Si no estás entre pasos definidos del plan, considera avisar al usuario para preparar pausa.`;
    }

    const stdoutJson = {
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext: message
      }
    };
    return { exitCode: 0, stdoutJson };
  } catch {
    return { exitCode: 0 };
  }
}

module.exports = runHook;
module.exports.runHook = runHook;

if (require.main === module) {
  let raw = '';
  const t = setTimeout(() => process.exit(0), 10000);
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
