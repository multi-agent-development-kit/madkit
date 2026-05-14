// Tests para tolerancia a directorios no-git en scripts/sync_templates.{sh,ps1}
// (T146 M16).
//
// Background: el script aborta exit 1 cuando cwd no es git repo y subdirs
// inmediatos no contienen exactamente 1 .git/. Bug observado por el usuario:
// primera ejecución falla, segunda funciona (tras git init manual).
//
// Operaciones reales del script (gh api, tar, find, cp, JSON merge con node)
// NO requieren git. Solo la derivación de PROJECT_ROOT lo usaba — pwd lo
// cubre igual.
//
// Política nueva (tests A* como SSOT):
//   - cwd git              → PROJECT_ROOT = git rev-parse --show-toplevel
//   - cwd no-git, 1 .git/  → cd a subdir, derivar toplevel
//   - cwd no-git, >1 .git/ → exit 1 (preserva guardia anti-ambigüedad)
//   - cwd no-git, 0 .git/  → WARN + PROJECT_ROOT = pwd + continuar

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = new URL('../../..', import.meta.url).pathname
  .replace(/^\/(\w):\//, '$1:/');

// ─── Lógica de detección (SSOT — scripts sh/ps1 la replican) ───────────────
// Recibe el estado del filesystem inmediato (¿cwd es git? ¿cuántos subdirs
// inmediatos tienen .git/?) y devuelve { action, projectRoot, warn }.
// Acciones posibles:
//   - 'use-cwd-git'    → cwd es git repo; PROJECT_ROOT derivado de git.
//   - 'cd-subdir'      → cd al único subdir con .git/ y derivar toplevel.
//   - 'use-cwd-no-git' → cwd no es git, sin subdirs git → continuar con pwd.
//   - 'abort-multi'    → >1 subdir con git → exit 1.
export function detectProjectRoot(state) {
  const { cwdIsGit, subdirsWithGit } = state;
  if (cwdIsGit) {
    return { action: 'use-cwd-git', projectRoot: 'git-toplevel', warn: null };
  }
  if (subdirsWithGit.length === 1) {
    return { action: 'cd-subdir', projectRoot: subdirsWithGit[0], warn: null };
  }
  if (subdirsWithGit.length > 1) {
    return {
      action: 'abort-multi',
      projectRoot: null,
      warn: `ERROR: Multiple git repos found in subdirectories: ${subdirsWithGit.join(', ')}. Run from inside the target repo.`,
    };
  }
  return {
    action: 'use-cwd-no-git',
    projectRoot: 'cwd',
    warn: 'WARN: cwd no es git repo y no hay subdir con .git/ — operando en modo no-git (cwd como PROJECT_ROOT).',
  };
}

// ─── A) Política de detección (A1-A5) ──────────────────────────────────────

test('A1 cwd git → action use-cwd-git, sin WARN', () => {
  const r = detectProjectRoot({ cwdIsGit: true, subdirsWithGit: [] });
  assert.equal(r.action, 'use-cwd-git');
  assert.equal(r.projectRoot, 'git-toplevel');
  assert.equal(r.warn, null);
});

test('A2 cwd no-git + 1 subdir git → cd al subdir', () => {
  const r = detectProjectRoot({ cwdIsGit: false, subdirsWithGit: ['my-project'] });
  assert.equal(r.action, 'cd-subdir');
  assert.equal(r.projectRoot, 'my-project');
  assert.equal(r.warn, null);
});

test('A3 cwd no-git + >1 subdirs git → abort con error', () => {
  const r = detectProjectRoot({ cwdIsGit: false, subdirsWithGit: ['repo-a', 'repo-b'] });
  assert.equal(r.action, 'abort-multi');
  assert.equal(r.projectRoot, null);
  assert.ok(r.warn.startsWith('ERROR:'), 'mensaje de error claro');
  assert.ok(r.warn.includes('repo-a') && r.warn.includes('repo-b'), 'lista candidatos');
});

test('A4 cwd no-git + 0 subdirs git → WARN + cwd como PROJECT_ROOT (M16 fix)', () => {
  const r = detectProjectRoot({ cwdIsGit: false, subdirsWithGit: [] });
  assert.equal(r.action, 'use-cwd-no-git');
  assert.equal(r.projectRoot, 'cwd');
  assert.ok(r.warn.startsWith('WARN:'), 'WARN, no ERROR');
  assert.ok(r.warn.includes('modo no-git'), 'mensaje explica el modo');
});

test('A5 cwd no-git + 3 subdirs git → abort (preserva guardia con N>2)', () => {
  const r = detectProjectRoot({
    cwdIsGit: false,
    subdirsWithGit: ['r1', 'r2', 'r3']
  });
  assert.equal(r.action, 'abort-multi');
});

// ─── B) Regresión: comportamiento existente preservado ─────────────────────

test('B1 regresión — happy path git: action sigue siendo use-cwd-git', () => {
  // Caso típico de proyectos canónicos: el usuario corre desde la raíz del repo.
  const r = detectProjectRoot({ cwdIsGit: true, subdirsWithGit: [] });
  assert.equal(r.action, 'use-cwd-git');
});

test('B2 regresión — split-workspace con 1 subdir git sigue funcionando', () => {
  // Caso documentado en setup_project.md Fase 1.2: monorepo donde .claude/ vive
  // en root y el código está en un subdirectorio.
  const r = detectProjectRoot({ cwdIsGit: false, subdirsWithGit: ['code'] });
  assert.equal(r.action, 'cd-subdir');
  assert.equal(r.projectRoot, 'code');
});

test('B3 regresión — guardia anti-ambigüedad (2+ git subdirs) sigue abortando', () => {
  // El comportamiento original ya abortaba en este caso. El fix M16 NO lo cambia.
  const r = detectProjectRoot({ cwdIsGit: false, subdirsWithGit: ['front', 'back'] });
  assert.equal(r.action, 'abort-multi');
});

// ─── C) Documentación del cambio en el script ──────────────────────────────

test('C1 sync_templates.sh contiene fallback no-git con WARN', () => {
  const script = readFileSync(join(REPO_ROOT, 'scripts', 'sync_templates.sh'), 'utf8');

  // El script debe contener una rama que setea PROJECT_ROOT="$(pwd)" y emite
  // WARN cuando no hay git ni subdirs git.
  assert.ok(/PROJECT_ROOT="?\$\(pwd\)"?/.test(script) || /PROJECT_ROOT="?\$PWD"?/.test(script),
    'sync_templates.sh debe setear PROJECT_ROOT desde pwd cuando no hay git');
  assert.ok(/WARN.*no.?git|modo no-git/i.test(script),
    'sync_templates.sh debe emitir WARN en modo no-git');
});

test('C2 sync_templates.ps1 contiene fallback no-git con WARN', () => {
  const script = readFileSync(join(REPO_ROOT, 'scripts', 'sync_templates.ps1'), 'utf8');

  // PowerShell: $ProjectRoot = $PWD.Path o equivalent en el branch no-git
  assert.ok(/\$ProjectRoot\s*=\s*\$PWD\.Path|\$ProjectRoot\s*=\s*\(Get-Location\)/.test(script),
    'sync_templates.ps1 debe setear $ProjectRoot desde $PWD cuando no hay git');
  assert.ok(/WARN.*no.?git|modo no-git/i.test(script),
    'sync_templates.ps1 debe emitir WARN en modo no-git');
});
