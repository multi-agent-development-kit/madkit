// helper.js — invocadores cross-platform para los hooks deployables.
//
// Solo usa builtins de Node ≥20 (cero deps externas).
//
// API:
//   invokeJsHook(hookPath, input, opts) → { stdout, stderr, exitCode }
//   invokeShellHook(scriptBase, input, opts) → { stdout, stderr, exitCode }
//     scriptBase: ruta sin extensión; el helper añade .ps1 en win32, .sh en POSIX.
//   makeTmpProject(fixtures) → string (path al tmpdir creado)
//     fixtures: objeto { 'rel/path.ext': 'contenido' | Buffer }

import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, sep } from 'node:path';
import { randomBytes } from 'node:crypto';

const IS_WIN = process.platform === 'win32';

// En Windows, pwsh (PowerShell 7+) puede no estar disponible. Fallback a powershell.exe.
function pickPwshBinary() {
  // Detección barata: spawnSync('pwsh', ['-NoProfile', '-Command', '$PSVersionTable.PSVersion.Major'])
  const probe = spawnSync('pwsh', ['-NoProfile', '-Command', '$PSVersionTable.PSVersion.Major'], {
    encoding: 'utf8',
    timeout: 3000,
  });
  if (probe.status === 0) return 'pwsh';
  return 'powershell';
}

let _pwshCached = null;
function pwshBinary() {
  if (_pwshCached) return _pwshCached;
  _pwshCached = IS_WIN ? pickPwshBinary() : 'pwsh';
  return _pwshCached;
}

export function invokeJsHook(hookPath, input, opts = {}) {
  const result = spawnSync('node', [hookPath], {
    input: typeof input === 'string' ? input : JSON.stringify(input),
    encoding: 'utf8',
    timeout: opts.timeout ?? 5000,
    cwd: opts.cwd,
    env: { ...process.env, ...(opts.env || {}) },
  });
  return {
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    exitCode: result.status,
  };
}

export function invokeShellHook(scriptBase, input, opts = {}) {
  let cmd;
  let args;
  if (IS_WIN) {
    cmd = pwshBinary();
    // Forzamos UTF-8 en la consola antes de ejecutar el .ps1 — sin esto, los
    // caracteres no-ASCII (em-dash, tildes) se serializan en CP1252 y rompen
    // el JSON. Usamos -Command con un wrapper que setea OutputEncoding y luego
    // ejecuta el script vía dot-source para preservar stdin.
    const ps1 = scriptBase + '.ps1';
    args = [
      '-NoProfile',
      '-ExecutionPolicy', 'Bypass',
      '-Command',
      // Propagar $LASTEXITCODE explícitamente — PowerShell -Command devuelve 1
      // por defecto cuando un script invocado vía & sale con exit != 0.
      `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; [Console]::InputEncoding = [System.Text.Encoding]::UTF8; & '${ps1.replace(/'/g, "''")}'; exit $LASTEXITCODE`,
    ];
  } else {
    cmd = 'bash';
    args = [scriptBase + '.sh'];
  }
  const result = spawnSync(cmd, args, {
    input: typeof input === 'string' ? input : JSON.stringify(input),
    encoding: 'utf8',
    timeout: opts.timeout ?? 5000,
    cwd: opts.cwd,
    env: { ...process.env, ...(opts.env || {}) },
  });
  return {
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    exitCode: result.status,
  };
}

/**
 * Crea un directorio temporal con la estructura solicitada.
 * Si fixtures contiene la clave especial '__config__' (objeto), lo escribe en
 * .claude/hooks/config.json. Cualquier otra clave es ruta relativa al tmpdir.
 *
 * @param {Object} fixtures map de archivos a crear (rel-path → string|Buffer).
 * @returns {string} path absoluto al tmpdir creado.
 */
export function makeTmpProject(fixtures = {}) {
  const base = mkdtempSync(join(tmpdir(), 'claude-hook-test-' + randomBytes(6).toString('hex') + '-'));

  // Siempre garantizar .claude/hooks/ — los hooks lo asumen.
  mkdirSync(join(base, '.claude', 'hooks'), { recursive: true });

  for (const [rel, content] of Object.entries(fixtures)) {
    if (rel === '__config__') {
      const configPath = join(base, '.claude', 'hooks', 'config.json');
      writeFileSync(configPath, JSON.stringify(content, null, 2), 'utf8');
      continue;
    }
    const abs = join(base, rel.replaceAll('/', sep));
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content);
  }
  return base;
}

/**
 * Helper: obtiene el path absoluto del directorio raíz `claude-templates/hooks/`.
 * Útil para que los tests resuelvan la ruta de cada hook sin hard-codear.
 */
export function hooksDir() {
  // tests/ está dentro de claude-templates/hooks/. Subimos un nivel.
  return new URL('..', import.meta.url).pathname
    // En Windows fileURL pathname empieza con `/C:/...` — quitamos el slash inicial.
    .replace(/^\/(\w):\//, '$1:/');
}
