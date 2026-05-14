// Tests para core-context-loader.{sh,ps1} (versión 2.0.0, T134).
//
// Modelo del hook desde T134:
//   - Whitelist de esenciales (default `master_idea.md` + `architecture.md`)
//     se cargan con head-N (default 30) en additionalContext.
//   - El resto de `core/*.md` se anuncia como pointer index (read on-demand)
//     si `index_others: true` (default).
//
// Casos cubiertos (≥5):
//   1. Flag core_context_loader ausente → exit 0 silencioso.
//   2. ai_docs/core/ ausente → exit 0 silencioso (con flag activa).
//   3. Esenciales + extras presentes → carga esenciales + indexa extras.
//   4. Solo extras presentes (sin esenciales) → emite solo el pointer index.
//   5. Cap en bytes (T125 W4) — preservado.

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

const SCRIPT_BASE = join(hooksDir(), 'core-context-loader');

function makeInput({ cwd }) {
  return { cwd, source: 'startup' };
}

test('core-context-loader: flag ausente → exit 0 silencioso', (t) => {
  const tmp = makeTmpProject({
    __config__: { /* sin core_context_loader */ },
  });
  t.after(() => rmTmp(tmp));
  // Aunque core/ exista con archivos, sin flag NO emite nada.
  mkdirSync(join(tmp, 'ai_docs', 'core'), { recursive: true });
  writeFileSync(join(tmp, 'ai_docs', 'core', 'master_idea.md'), '# Master Idea\nLínea 2\n');
  const r = invokeShellHook(SCRIPT_BASE, makeInput({ cwd: tmp }), { cwd: tmp });
  assert.equal(r.exitCode, 0, `Expected exit 0; stderr=${r.stderr}`);
  assert.equal(r.stdout.trim(), '', `Esperado stdout vacío con flag ausente, got: ${r.stdout}`);
});

test('core-context-loader: ai_docs/core/ ausente con flag activa → exit 0 silencioso', (t) => {
  const tmp = makeTmpProject({
    __config__: { core_context_loader: true },
  });
  t.after(() => rmTmp(tmp));
  // ai_docs/ no existe — no creamos nada.
  const r = invokeShellHook(SCRIPT_BASE, makeInput({ cwd: tmp }), { cwd: tmp });
  assert.equal(r.exitCode, 0, `Expected exit 0; stderr=${r.stderr}`);
  assert.equal(r.stdout.trim(), '', `Esperado stdout vacío sin core/, got: ${r.stdout}`);
});

test('core-context-loader: esenciales cargados + extras como pointer index', (t) => {
  const tmp = makeTmpProject({
    __config__: { core_context_loader: true },
  });
  t.after(() => rmTmp(tmp));
  mkdirSync(join(tmp, 'ai_docs', 'core'), { recursive: true });
  writeFileSync(join(tmp, 'ai_docs', 'core', 'master_idea.md'), '# Master Idea\nMVP del proyecto.\n');
  writeFileSync(join(tmp, 'ai_docs', 'core', 'architecture.md'), '# Architecture\nSistema cliente-servidor.\n');
  writeFileSync(join(tmp, 'ai_docs', 'core', 'data_models.md'), '# Data models\nEntidades del schema.\n');
  writeFileSync(join(tmp, 'ai_docs', 'core', 'decisions.md'), '# Decisions\nADR 001: usar Node.\n');
  const r = invokeShellHook(SCRIPT_BASE, makeInput({ cwd: tmp }), { cwd: tmp });
  assert.equal(r.exitCode, 0, `Expected exit 0; stderr=${r.stderr}`);
  assert.notEqual(r.stdout.trim(), '');
  let parsed;
  try {
    parsed = JSON.parse(r.stdout);
  } catch (e) {
    assert.fail(`stdout no es JSON válido: ${r.stdout}`);
  }
  const inner = parsed.hookSpecificOutput;
  assert.ok(inner, 'Falta hookSpecificOutput');
  assert.equal(inner.hookEventName, 'SessionStart');
  // Esenciales cargados: master_idea + architecture (default whitelist)
  assert.equal(inner.core_files_loaded, 2, `Expected 2 esenciales cargados, got: ${inner.core_files_loaded}`);
  // Extras indexados: data_models + decisions
  assert.equal(inner.core_files_indexed, 2, `Expected 2 archivos en pointer index, got: ${inner.core_files_indexed}`);
  // Contenido cargado
  assert.match(inner.additionalContext, /## ai_docs\/core\/master_idea\.md/);
  assert.match(inner.additionalContext, /## ai_docs\/core\/architecture\.md/);
  assert.match(inner.additionalContext, /MVP del proyecto/);
  // Pointer index aparece como referencia
  assert.match(inner.additionalContext, /Otros archivos en ai_docs\/core\/ \(read on-demand\)/);
  assert.match(inner.additionalContext, /`ai_docs\/core\/data_models\.md`/);
  assert.match(inner.additionalContext, /`ai_docs\/core\/decisions\.md`/);
  // El contenido de los pointer NO debe estar inyectado
  assert.doesNotMatch(inner.additionalContext, /Entidades del schema/);
  assert.doesNotMatch(inner.additionalContext, /ADR 001/);
});

test('core-context-loader: sin esenciales presentes → emite solo pointer index', (t) => {
  const tmp = makeTmpProject({
    __config__: { core_context_loader: true },
  });
  t.after(() => rmTmp(tmp));
  mkdirSync(join(tmp, 'ai_docs', 'core'), { recursive: true });
  // Solo extras (no master_idea ni architecture)
  writeFileSync(join(tmp, 'ai_docs', 'core', 'data_models.md'), '# Data models\nEntidades.\n');
  writeFileSync(join(tmp, 'ai_docs', 'core', 'decisions.md'), '# Decisions\nADR 001.\n');
  const r = invokeShellHook(SCRIPT_BASE, makeInput({ cwd: tmp }), { cwd: tmp });
  assert.equal(r.exitCode, 0, `Expected exit 0; stderr=${r.stderr}`);
  let parsed;
  try {
    parsed = JSON.parse(r.stdout);
  } catch (e) {
    assert.fail(`stdout no es JSON válido: ${r.stdout}`);
  }
  const inner = parsed.hookSpecificOutput;
  assert.equal(inner.core_files_loaded, 0, `Sin esenciales, esperado 0 cargados`);
  assert.equal(inner.core_files_indexed, 2, `Esperado 2 en pointer index`);
  // Header presente, pointer index presente
  assert.match(inner.additionalContext, /Otros archivos en ai_docs\/core\/ \(read on-demand\)/);
  assert.match(inner.additionalContext, /`ai_docs\/core\/data_models\.md`/);
});

// ============================================================================
// T125 W4 — Cap en bytes (preservado)
// ============================================================================

test('T125 W4: archivo de 100KB en core/ → output truncado con marker [TRUNCATED — byte cap]', (t) => {
  // El default max_bytes es 50000 B (~50KB). Un archivo de 100KB debe truncarse.
  const tmp = makeTmpProject({
    __config__: { core_context_loader: true },  // forma compacta, max_bytes default 50000
  });
  t.after(() => rmTmp(tmp));
  mkdirSync(join(tmp, 'ai_docs', 'core'), { recursive: true });
  // master_idea.md grande (~100KB) — es esencial, así que se inyecta al additionalContext
  const bigContent = '# Big Master Idea\n\n' + 'X '.repeat(50000);  // ~100KB aprox
  writeFileSync(join(tmp, 'ai_docs', 'core', 'master_idea.md'), bigContent);
  const r = invokeShellHook(SCRIPT_BASE, makeInput({ cwd: tmp }), { cwd: tmp });
  assert.equal(r.exitCode, 0, `Expected exit 0; stderr=${r.stderr}`);
  assert.notEqual(r.stdout.trim(), '', 'Esperado output no vacío');
  let parsed;
  try {
    parsed = JSON.parse(r.stdout);
  } catch (e) {
    assert.fail(`stdout no es JSON válido: ${r.stdout}`);
  }
  const ctx = parsed.hookSpecificOutput.additionalContext;
  // El output debe contener el marker de byte cap
  assert.match(ctx, /TRUNCATED.*byte cap/i, `Esperado marker de byte cap; ctx recibido: ${ctx.slice(0, 200)}`);
  // El output debe ser menor que 60KB con algo de margen para JSON overhead
  const outputBytes = Buffer.byteLength(r.stdout, 'utf8');
  assert.ok(outputBytes < 65000, `Output total demasiado grande: ${outputBytes} bytes`);
});
