// Tests para scaffolding-guard.{sh,ps1} (versión 1.0.0).
//
// El hook bloquea git commits que (a) incluyen archivos en ai_docs/, .claude/ o
// .cursor/, o (b) tienen mensaje sin formato canónico <type>: <subject>.
//
// Necesita git inicializado en el cwd del fixture (para `git diff --cached`).
//
// Casos cubiertos (≥4):
//   1. `git commit -m "create: nueva skill"` con src/foo.js staged → exit 0.
//   2. `git commit ...` con archivo en ai_docs/tasks/ staged → exit 2 (SCAFFOLDING_STAGED).
//   3. `git commit -m "added new feature"` (sin tipo canónico) → exit 2 (COMMIT_FORMAT_INVALID).
//   4. `git commit -m "fix: <subject muy largo>"` (>72 chars) → exit 2 (COMMIT_SUBJECT_TOO_LONG).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { invokeShellHook, makeTmpProject, hooksDir } from './helper.js';

// Cleanup robusto cross-platform — Windows EBUSY puede ocurrir si .git tiene
// procesos pendientes. force + maxRetries + retryDelay mitigan.
function rmTmp(p) {
  try {
    rmSync(p, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  } catch {
    // best-effort
  }
}

const SCRIPT_BASE = join(hooksDir(), 'scaffolding-guard');

/**
 * Inicializa un repo git en `cwd` con un commit inicial vacío y una identidad
 * local. Necesario para que `git diff --cached --name-only` funcione sin pedir
 * configuración global.
 */
function initRepo(cwd) {
  const opts = { cwd, stdio: 'ignore' };
  execSync('git init -b main', opts);
  execSync('git config user.email "test@example.com"', opts);
  execSync('git config user.name "Test"', opts);
  execSync('git config commit.gpgsign false', opts);
  // Crear commit inicial mínimo para que existan refs.
  writeFileSync(join(cwd, '.gitignore'), 'node_modules/\n');
  execSync('git add .gitignore', opts);
  execSync('git commit -m "initial: stub" --no-verify', opts);
}

function makeInput({ cwd, command }) {
  return {
    tool_name: 'Bash',
    cwd,
    tool_input: { command },
  };
}

test('scaffolding-guard: commit válido sobre src/ → exit 0', (t) => {
  const tmp = makeTmpProject({
    __config__: { scaffolding_guard: true },
  });
  t.after(() => rmTmp(tmp));
  initRepo(tmp);
  // Stage de un archivo legítimo.
  mkdirSync(join(tmp, 'src'), { recursive: true });
  writeFileSync(join(tmp, 'src', 'foo.js'), 'export const foo = 1;\n');
  execSync('git add src/foo.js', { cwd: tmp, stdio: 'ignore' });

  const r = invokeShellHook(SCRIPT_BASE, makeInput({
    cwd: tmp,
    command: 'git commit -m "create: nueva skill"',
  }), { cwd: tmp });
  assert.equal(r.exitCode, 0, `Expected exit 0; stdout=${r.stdout}; stderr=${r.stderr}`);
});

test('scaffolding-guard: archivo en ai_docs/tasks/ staged → exit 2 (SCAFFOLDING_STAGED)', (t) => {
  const tmp = makeTmpProject({
    __config__: { scaffolding_guard: true },
  });
  t.after(() => rmTmp(tmp));
  initRepo(tmp);
  mkdirSync(join(tmp, 'ai_docs', 'tasks'), { recursive: true });
  writeFileSync(join(tmp, 'ai_docs', 'tasks', '999_test.md'), '# test\n');
  // Force-add aunque .gitignore lo excluya en proyectos reales (en este tmp no
  // tenemos exclusión configurada, así que `git add` basta).
  execSync('git add -f ai_docs/tasks/999_test.md', { cwd: tmp, stdio: 'ignore' });

  const r = invokeShellHook(SCRIPT_BASE, makeInput({
    cwd: tmp,
    command: 'git commit -m "create: leak"',
  }), { cwd: tmp });
  assert.equal(r.exitCode, 2, `Expected exit 2; stdout=${r.stdout}; stderr=${r.stderr}`);
  assert.match(r.stdout, /SCAFFOLDING_STAGED/);
});

test('scaffolding-guard: tipo no canónico ("added") → exit 2 (COMMIT_FORMAT_INVALID)', (t) => {
  const tmp = makeTmpProject({
    __config__: { scaffolding_guard: true },
  });
  t.after(() => rmTmp(tmp));
  initRepo(tmp);
  mkdirSync(join(tmp, 'src'), { recursive: true });
  writeFileSync(join(tmp, 'src', 'a.js'), '\n');
  execSync('git add src/a.js', { cwd: tmp, stdio: 'ignore' });

  const r = invokeShellHook(SCRIPT_BASE, makeInput({
    cwd: tmp,
    command: 'git commit -m "added new feature"',
  }), { cwd: tmp });
  assert.equal(r.exitCode, 2, `Expected exit 2; stdout=${r.stdout}; stderr=${r.stderr}`);
  assert.match(r.stdout, /COMMIT_FORMAT_INVALID/);
});

test('scaffolding-guard: subject >72 chars → exit 2 (COMMIT_SUBJECT_TOO_LONG)', (t) => {
  const tmp = makeTmpProject({
    __config__: { scaffolding_guard: true },
  });
  t.after(() => rmTmp(tmp));
  initRepo(tmp);
  mkdirSync(join(tmp, 'src'), { recursive: true });
  writeFileSync(join(tmp, 'src', 'b.js'), '\n');
  execSync('git add src/b.js', { cwd: tmp, stdio: 'ignore' });

  // 70 chars de subject tras "fix: " = total 75 chars de subject (>72).
  const longSubject = 'fix: ' + 'a'.repeat(80);
  const r = invokeShellHook(SCRIPT_BASE, makeInput({
    cwd: tmp,
    command: `git commit -m "${longSubject}"`,
  }), { cwd: tmp });
  assert.equal(r.exitCode, 2, `Expected exit 2; stdout=${r.stdout}; stderr=${r.stderr}`);
  assert.match(r.stdout, /COMMIT_SUBJECT_TOO_LONG/);
});

test('scaffolding-guard: Co-Authored-By: Claude → exit 2 (COMMIT_COAUTHOR_FORBIDDEN)', (t) => {
  const tmp = makeTmpProject({
    __config__: { scaffolding_guard: true },
  });
  t.after(() => rmTmp(tmp));
  initRepo(tmp);
  mkdirSync(join(tmp, 'src'), { recursive: true });
  writeFileSync(join(tmp, 'src', 'c.js'), '\n');
  execSync('git add src/c.js', { cwd: tmp, stdio: 'ignore' });

  // Mensaje válido en formato pero con Co-Authored-By: Claude — DEBE bloquear.
  const message = 'fix: corregir bug X\\n\\nDetalle del fix.\\n\\nCo-Authored-By: Claude <noreply@anthropic.com>';
  const r = invokeShellHook(SCRIPT_BASE, makeInput({
    cwd: tmp,
    command: `git commit -m "${message}"`,
  }), { cwd: tmp });
  assert.equal(r.exitCode, 2, `Expected exit 2; stdout=${r.stdout}; stderr=${r.stderr}`);
  assert.match(r.stdout, /COMMIT_COAUTHOR_FORBIDDEN/);
});

test('scaffolding-guard: Co-Authored-By: anthropic → exit 2 (COMMIT_COAUTHOR_FORBIDDEN)', (t) => {
  const tmp = makeTmpProject({
    __config__: { scaffolding_guard: true },
  });
  t.after(() => rmTmp(tmp));
  initRepo(tmp);
  mkdirSync(join(tmp, 'src'), { recursive: true });
  writeFileSync(join(tmp, 'src', 'd.js'), '\n');
  execSync('git add src/d.js', { cwd: tmp, stdio: 'ignore' });

  // Variante: solo "anthropic" sin "Claude" debe disparar igual.
  const message = 'create: nueva feature\\n\\nCo-Authored-By: someone <bot@anthropic.com>';
  const r = invokeShellHook(SCRIPT_BASE, makeInput({
    cwd: tmp,
    command: `git commit -m "${message}"`,
  }), { cwd: tmp });
  assert.equal(r.exitCode, 2, `Expected exit 2; stdout=${r.stdout}; stderr=${r.stderr}`);
  assert.match(r.stdout, /COMMIT_COAUTHOR_FORBIDDEN/);
});

test('scaffolding-guard: Co-Authored-By legítimo (humano) → exit 0', (t) => {
  // Co-Authored-By con un humano (sin Claude/anthropic) NO debe bloquear.
  const tmp = makeTmpProject({
    __config__: { scaffolding_guard: true },
  });
  t.after(() => rmTmp(tmp));
  initRepo(tmp);
  mkdirSync(join(tmp, 'src'), { recursive: true });
  writeFileSync(join(tmp, 'src', 'e.js'), '\n');
  execSync('git add src/e.js', { cwd: tmp, stdio: 'ignore' });

  const message = 'fix: pair-programmed bug\\n\\nCo-Authored-By: Jane Doe <jane@company.com>';
  const r = invokeShellHook(SCRIPT_BASE, makeInput({
    cwd: tmp,
    command: `git commit -m "${message}"`,
  }), { cwd: tmp });
  assert.equal(r.exitCode, 0, `Expected exit 0 con humano coauthor; stdout=${r.stdout}; stderr=${r.stderr}`);
});

// ============================================================================
// T125 — Tests para nuevas features: excluded_dirs (B1) + CHECK 3 fallbacks (B3)
// ============================================================================

test('T125 B1: excluded_dirs:["ai_docs"] permite commit con ai_docs/ staged → exit 0', (t) => {
  // Con excluded_dirs: ["ai_docs"], archivos en ai_docs/ no deben bloquearse.
  const tmp = makeTmpProject({
    __config__: {
      scaffolding_guard: {
        enabled: true,
        excluded_dirs: ['ai_docs'],
      },
    },
  });
  t.after(() => rmTmp(tmp));
  initRepo(tmp);
  mkdirSync(join(tmp, 'ai_docs', 'tasks'), { recursive: true });
  writeFileSync(join(tmp, 'ai_docs', 'tasks', '125_test.md'), '# test\n');
  execSync('git add -f ai_docs/tasks/125_test.md', { cwd: tmp, stdio: 'ignore' });

  const r = invokeShellHook(SCRIPT_BASE, makeInput({
    cwd: tmp,
    command: 'git commit -m "update: task doc"',
  }), { cwd: tmp });
  // Con excluded_dirs, ai_docs/ no bloquea
  assert.equal(r.exitCode, 0, `Expected exit 0 con excluded_dirs; stdout=${r.stdout}; stderr=${r.stderr}`);
});

test('T125 B1: sin excluded_dirs → comportamiento original (ai_docs staged bloquea)', (t) => {
  // Sin excluded_dirs, el comportamiento debe ser idéntico al original.
  const tmp = makeTmpProject({
    __config__: { scaffolding_guard: true },
  });
  t.after(() => rmTmp(tmp));
  initRepo(tmp);
  mkdirSync(join(tmp, 'ai_docs', 'tasks'), { recursive: true });
  writeFileSync(join(tmp, 'ai_docs', 'tasks', '999_test.md'), '# test\n');
  execSync('git add -f ai_docs/tasks/999_test.md', { cwd: tmp, stdio: 'ignore' });

  const r = invokeShellHook(SCRIPT_BASE, makeInput({
    cwd: tmp,
    command: 'git commit -m "create: test"',
  }), { cwd: tmp });
  assert.equal(r.exitCode, 2, `Expected exit 2 sin excluded_dirs; stdout=${r.stdout}; stderr=${r.stderr}`);
  assert.match(r.stdout, /SCAFFOLDING_STAGED/);
});

test('T125 B3: git commit -F /file → CHECK 3 fallback a git log o advisory, no bloquea incorrectamente', (t) => {
  // -F file: el hook debe intentar leer el archivo o caer en fallback advisory.
  // No debe bloquear con COMMIT_FORMAT_INVALID porque no puede extraer el MSG limpio.
  // Nota: si el fallback de git log lee el último commit válido (canónico), pasa.
  // Si lee un mensaje no-canónico, debe emitir advisory (exit 0) en lugar de bloquear.
  const tmp = makeTmpProject({
    __config__: { scaffolding_guard: true },
  });
  t.after(() => rmTmp(tmp));
  // initRepo usa "initial: stub" — añadimos también un commit con formato canónico
  // para que el fallback git log lo lea en lugar de "initial: stub" (que no es canónico).
  initRepo(tmp);
  mkdirSync(join(tmp, 'src'), { recursive: true });
  writeFileSync(join(tmp, 'src', 'f.js'), '\n');
  execSync('git add src/f.js', { cwd: tmp, stdio: 'ignore' });
  // Crear un commit previo con formato canónico para que git log -1 lo devuelva
  execSync('git commit -m "create: archivo fuente inicial" --no-verify', { cwd: tmp, stdio: 'ignore' });
  // Ahora añadir otro archivo para el test de -F
  writeFileSync(join(tmp, 'src', 'g.js'), '\n');
  execSync('git add src/g.js', { cwd: tmp, stdio: 'ignore' });

  const r = invokeShellHook(SCRIPT_BASE, makeInput({
    cwd: tmp,
    command: 'git commit -F /nonexistent_msg_file.txt',
  }), { cwd: tmp });
  // Archivo no existe → fallback a git log (lee "create: archivo fuente inicial") → válido → exit 0
  // O si el fallback lee mensaje no-canónico → advisory (exit 0 con hookSpecificOutput)
  // El hook NO debe bloquear con COMMIT_FORMAT_INVALID en ningún caso de -F inaccesible
  assert.equal(r.exitCode, 0,
    `Expected exit 0 (git log fallback o advisory); exitCode=${r.exitCode}; stdout=${r.stdout}; stderr=${r.stderr}`);
  assert.doesNotMatch(r.stdout, /COMMIT_FORMAT_INVALID/,
    'No debe bloquear con COMMIT_FORMAT_INVALID cuando -F no puede resolverse');
});
