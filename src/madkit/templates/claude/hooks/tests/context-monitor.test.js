// Tests para context-monitor.js (versión 1.0.1).
//
// El hook lee bridge file `<tmpdir>/claude-ctx-{session_id}.json` escrito por el
// statusline. Casos cubiertos (≥4):
//   1. Sin .claude/hooks/config.json → exit 0 silencioso.
//   2. Flag context_monitor: false → exit 0 silencioso.
//   3. Bridge file con remaining_percentage: 50 (>35%) → exit 0 sin inyección.
//   4. Bridge file con remaining_percentage: 8 (<=10%) → exit 0 + STATE.md
//      escrito + stdout JSON con additionalContext mencionando "BREADCRUMB".

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, writeFileSync, rmSync, mkdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { invokeJsHook, makeTmpProject, hooksDir } from './helper.js';

function rmTmp(p) {
  try {
    rmSync(p, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 });
  } catch {
    // best-effort
  }
}

const HOOK = join(hooksDir(), 'context-monitor.js');

function bridgePath(sessionId) {
  return join(tmpdir(), `claude-ctx-${sessionId}.json`);
}

function warnPath(sessionId) {
  return join(tmpdir(), `claude-ctx-${sessionId}-warned.json`);
}

function makeSessionId() {
  return 'test-session-' + randomBytes(4).toString('hex');
}

function makeInput({ cwd, sessionId, toolName = 'Read' }) {
  return {
    session_id: sessionId,
    cwd,
    tool_name: toolName,
    tool_input: { file_path: join(cwd, 'foo.md') },
  };
}

function writeBridge(sessionId, metrics) {
  writeFileSync(bridgePath(sessionId), JSON.stringify({
    timestamp: Math.floor(Date.now() / 1000),
    ...metrics,
  }));
}

function cleanupSession(sessionId) {
  for (const p of [bridgePath(sessionId), warnPath(sessionId)]) {
    try { rmSync(p, { force: true }); } catch {}
  }
}

test('context-monitor: sin .claude/hooks/config.json → exit silencioso', (t) => {
  // Project SIN config.json
  const tmp = mkdtempSync(join(tmpdir(), 'cm-noconfig-'));
  const sessionId = makeSessionId();
  t.after(() => {
    rmTmp(tmp);
    cleanupSession(sessionId);
  });
  const input = makeInput({ cwd: tmp, sessionId });
  const r = invokeJsHook(HOOK, input, { cwd: tmp });
  assert.equal(r.exitCode, 0);
  assert.equal(r.stdout, '');
});

test('context-monitor: flag context_monitor:false → exit silencioso', (t) => {
  const tmp = makeTmpProject({
    __config__: { context_monitor: false },
  });
  const sessionId = makeSessionId();
  t.after(() => {
    rmTmp(tmp);
    cleanupSession(sessionId);
  });
  // Aún si hay bridge file con valores críticos, debe ser exit silencioso.
  writeBridge(sessionId, { remaining_percentage: 5, used_pct: 95 });
  const input = makeInput({ cwd: tmp, sessionId });
  const r = invokeJsHook(HOOK, input, { cwd: tmp });
  assert.equal(r.exitCode, 0);
  assert.equal(r.stdout, '');
});

test('context-monitor: remaining 50% (>35%) → exit 0 sin inyección', (t) => {
  const tmp = makeTmpProject({
    __config__: { context_monitor: true },
  });
  const sessionId = makeSessionId();
  t.after(() => {
    rmTmp(tmp);
    cleanupSession(sessionId);
  });
  writeBridge(sessionId, { remaining_percentage: 50, used_pct: 50 });
  const input = makeInput({ cwd: tmp, sessionId });
  const r = invokeJsHook(HOOK, input, { cwd: tmp });
  assert.equal(r.exitCode, 0);
  assert.equal(r.stdout, '', `Esperado sin output a 50% restante, got: ${r.stdout}`);
});

test('context-monitor: remaining 8% (<=10%) → escribe STATE.md + emite BREADCRUMB', (t) => {
  const tmp = makeTmpProject({
    __config__: { context_monitor: true },
  });
  // ai_docs/ debe existir para que el hook escriba STATE.md.
  mkdirSync(join(tmp, 'ai_docs'), { recursive: true });
  // Sembrar un task doc para que active_task se infiera.
  mkdirSync(join(tmp, 'ai_docs', 'tasks'), { recursive: true });
  writeFileSync(join(tmp, 'ai_docs', 'tasks', '042_active.md'), '# Tarea 042\n');

  const sessionId = makeSessionId();
  t.after(() => {
    rmTmp(tmp);
    cleanupSession(sessionId);
  });
  writeBridge(sessionId, { remaining_percentage: 8, used_pct: 92 });
  const input = makeInput({ cwd: tmp, sessionId, toolName: 'Edit' });
  const r = invokeJsHook(HOOK, input, { cwd: tmp });
  assert.equal(r.exitCode, 0, `Expected exit 0; stderr=${r.stderr}`);
  assert.match(r.stdout, /BREADCRUMB/, `Esperado mensaje "BREADCRUMB" en stdout: ${r.stdout}`);
  // STATE.md escrito
  const statePath = join(tmp, 'ai_docs', 'STATE.md');
  assert.ok(existsSync(statePath), 'STATE.md debe existir tras breadcrumb');
  const stateContent = readFileSync(statePath, 'utf8');
  assert.match(stateContent, /active_task:\s*042/, `STATE.md debe contener active_task: 042, got: ${stateContent}`);
});
