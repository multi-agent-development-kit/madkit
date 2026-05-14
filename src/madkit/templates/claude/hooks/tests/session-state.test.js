// Tests para session-state.{sh,ps1} (versión 1.0.1 sh / 1.0.0 ps1).
//
// El hook se invoca en SessionStart, lee ai_docs/STATE.md y emite JSON con
// `additionalContext` + typed fields (state_present, active_task).
//
// Cambio T125 (B2): sin STATE.md → exit 0 silente (cero tokens).
// Comportamiento previo (emitir "sesión limpia") eliminado.
//
// Casos cubiertos (≥4):
//   1. Flag session_state: false → exit 0 sin output.
//   2. Sin ai_docs/STATE.md → exit 0 silente (cero stdout) — comportamiento T125.
//   3. Con ai_docs/STATE.md válido → exit 0 + state_present:true + active_task.
//   4. STATE.md vacío (0 bytes) → exit 0 silente (equivalente a ausente).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { invokeShellHook, makeTmpProject, hooksDir } from './helper.js';

function rmTmp(p) {
  try {
    rmSync(p, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 });
  } catch {
    // best-effort
  }
}

const SCRIPT_BASE = join(hooksDir(), 'session-state');

function makeInput({ cwd }) {
  return { cwd, source: 'startup' };
}

test('session-state: flag session_state:false → exit 0 silencioso', (t) => {
  const tmp = makeTmpProject({
    __config__: { session_state: false },
  });
  t.after(() => rmTmp(tmp));
  const r = invokeShellHook(SCRIPT_BASE, makeInput({ cwd: tmp }), { cwd: tmp });
  assert.equal(r.exitCode, 0, `Expected exit 0; stderr=${r.stderr}`);
  assert.equal(r.stdout.trim(), '', `Esperado stdout vacío con flag desactivada, got: ${r.stdout}`);
});

test('session-state: sin ai_docs/STATE.md → exit 0 silente (cero stdout) [T125 B2]', (t) => {
  const tmp = makeTmpProject({
    __config__: { session_state: true },
  });
  t.after(() => rmTmp(tmp));
  // ai_docs/ existe pero sin STATE.md
  mkdirSync(join(tmp, 'ai_docs'), { recursive: true });
  const r = invokeShellHook(SCRIPT_BASE, makeInput({ cwd: tmp }), { cwd: tmp });
  assert.equal(r.exitCode, 0, `Expected exit 0; stderr=${r.stderr}`);
  // T125 B2: cero output cuando STATE.md no existe — no desperdiciar tokens
  assert.equal(r.stdout.trim(), '', `Esperado stdout vacío sin STATE.md, got: ${r.stdout}`);
});

test('session-state: con ai_docs/STATE.md → state_present:true + active_task: "087"', (t) => {
  const tmp = makeTmpProject({
    __config__: { session_state: true },
  });
  t.after(() => rmTmp(tmp));
  mkdirSync(join(tmp, 'ai_docs'), { recursive: true });
  const stateContent = `---
active_task: 087
phase: implementación de tests
last_action: Edit on task-doc-validator.js
timestamp: 2026-05-05T12:34:56.000Z
session_id: test-abc
---

# Breadcrumb automático
contenido extra
`;
  writeFileSync(join(tmp, 'ai_docs', 'STATE.md'), stateContent);
  const r = invokeShellHook(SCRIPT_BASE, makeInput({ cwd: tmp }), { cwd: tmp });
  assert.equal(r.exitCode, 0, `Expected exit 0; stderr=${r.stderr}`);
  let parsed;
  try {
    parsed = JSON.parse(r.stdout);
  } catch (e) {
    assert.fail(`stdout no es JSON válido: ${r.stdout}`);
  }
  const inner = parsed.hookSpecificOutput;
  assert.equal(inner.state_present, true, `state_present debe ser true, got: ${inner.state_present}`);
  assert.equal(inner.active_task, '087', `active_task debe ser "087", got: ${inner.active_task}`);
  assert.match(inner.additionalContext || '', /STATE\.md/);
});

// T125 casos límite nuevos
test('session-state: STATE.md vacío (0 bytes) → exit 0 silente [T125 caso límite 2]', (t) => {
  const tmp = makeTmpProject({
    __config__: { session_state: true },
  });
  t.after(() => rmTmp(tmp));
  mkdirSync(join(tmp, 'ai_docs'), { recursive: true });
  // Crear STATE.md vacío — debe tratarse como ausente (silente)
  writeFileSync(join(tmp, 'ai_docs', 'STATE.md'), '');
  const r = invokeShellHook(SCRIPT_BASE, makeInput({ cwd: tmp }), { cwd: tmp });
  assert.equal(r.exitCode, 0, `Expected exit 0; stderr=${r.stderr}`);
  // T125 caso límite 2: STATE.md vacío = equivalente a ausente = cero output
  assert.equal(r.stdout.trim(), '', `Esperado stdout vacío con STATE.md vacío, got: ${r.stdout}`);
});
