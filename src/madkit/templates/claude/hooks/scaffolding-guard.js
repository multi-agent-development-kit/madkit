#!/usr/bin/env node
'use strict';
// Scaffolding Guard — PreToolUse hook (Bash|PowerShell matcher)
// Node.js port of scaffolding-guard.sh. Bundleable via hook-runner.
//
// Optimización crítica: comprueba si es `git commit` o `gh pr create` ANTES de cualquier I/O.
// 99% de calls (no son commit ni gh pr) devuelven inmediatamente sin tocar disco.

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { readConfig } = require('./hook-utils');

const MSG_PATTERNS = [
  /-m\s+"([^"]+)"/,
  /-m\s+'([^']+)'/,
  /--message=([^\s]+)/,
  /-m\s+\$'([^']+)'/,
];

async function runHook(input, preloadedConfig) {
  try {
    const data = typeof input === 'string' ? JSON.parse(input) : (input || {});

    if (!['Bash', 'PowerShell'].includes(data.tool_name)) return { exitCode: 0 };

    const cmd = ((data.tool_input && data.tool_input.command) || '').trim();
    // Fast path: zero I/O para el 99% de calls (no son git commit ni gh pr)
    const isGitCommit = /^git\s+commit/.test(cmd);
    const isGhPrCreate = /^gh\s+pr\s+(create|edit)/.test(cmd);
    if (!isGitCommit && !isGhPrCreate) return { exitCode: 0 };

    const cwd = data.cwd || process.cwd();
    const config = preloadedConfig !== undefined ? preloadedConfig : readConfig(cwd);
    if (!config) return { exitCode: 0 };

    const sgVal = config.scaffolding_guard;
    if (!sgVal) return { exitCode: 0 };
    const enabled = sgVal === true || (typeof sgVal === 'object' && sgVal.enabled !== false);
    if (!enabled) return { exitCode: 0 };

    const excludedDirs = (typeof sgVal === 'object' && Array.isArray(sgVal.excluded_dirs))
      ? sgVal.excluded_dirs : [];

    // CHECK 1: archivos staged en directorios prohibidos (solo git commit)
    if (isGitCommit) {
    let stagedStr = '';
    try { stagedStr = execSync('git diff --cached --name-only', { cwd, encoding: 'utf8', timeout: 5000 }); } catch {}
    if (stagedStr) {
      const lines = stagedStr.split(/\r?\n/).filter(Boolean);
      const filtered = excludedDirs.length
        ? lines.filter(l => !excludedDirs.some(d => l.startsWith(d + '/') || l.startsWith(d + '\\')))
        : lines;
      const forbidden = filtered.filter(l => /^(ai_docs|\.claude|\.cursor)\//.test(l)).slice(0, 3);
      if (forbidden.length) {
        return block('SCAFFOLDING_STAGED',
          `AI scaffolding staged for commit: ${forbidden.join(', ')}. These directories must never be committed (ver CLAUDE.md o .claude/hooks/README.md). Run: git reset HEAD ai_docs/ .claude/ .cursor/`);
      }
    }
    } // end CHECK 1

    // CHECK 2: Co-Authored-By prohibido (git commit y gh pr create)
    if (/Co-Authored-By:[^\n]*(Claude|anthropic)/i.test(cmd)) {
      return block('COMMIT_COAUTHOR_FORBIDDEN',
        'Commit/PR prohibido: "Co-Authored-By: Claude/anthropic" detectado. Ver CLAUDE.md o .claude/hooks/README.md. Eliminar la línea Co-Authored-By.');
    }

    if (!isGitCommit) return { exitCode: 0 };

    // CHECK 3: formato del mensaje
    let msg = '';
    let msgSource = 'extracted';

    for (const pat of MSG_PATTERNS) {
      const m = cmd.match(pat);
      if (m) { msg = m[1]; break; }
    }

    if (!msg) {
      const mF = cmd.match(/-F\s+(\S+)/);
      if (mF) {
        try { msg = fs.readFileSync(mF[1], 'utf8').split(/\r?\n/)[0] || ''; } catch {}
        if (!msg) {
          try {
            const fallback = execSync('git log -1 --format=%s', { cwd, encoding: 'utf8', timeout: 3000 }).trim();
            if (fallback) { msg = fallback; msgSource = 'git_log_fallback'; }
          } catch {}
        }
      }
    }

    if (!msg) {
      try {
        const fallback = execSync('git log -1 --format=%s', { cwd, encoding: 'utf8', timeout: 3000 }).trim();
        if (fallback) { msg = fallback; msgSource = 'git_log_fallback'; }
      } catch {}
    }

    if (!msg) {
      return advisory('SCAFFOLDING GUARD WARN: commit format not validatable (interactive editor or unrecognized -m format). Review manually that subject follows: <type>: <subject> with types create|optimize|update|fix|refactor.');
    }

    const subject = msg.split(/\r?\n/)[0];
    if (!/^(create|optimize|update|fix|refactor)(\(.+\))?:\s+.+/.test(subject)) {
      if (msgSource === 'git_log_fallback') {
        return advisory('SCAFFOLDING GUARD WARN: last commit subject may not follow format <type>: <subject>. Review with git log -1.');
      }
      return block('COMMIT_FORMAT_INVALID',
        'Commit subject must follow the project commit format (ver CLAUDE.md o .claude/hooks/README.md): <type>: <subject>. Valid types: create, optimize, update, fix, refactor. Subject in lowercase, imperative, no trailing period.');
    }
    if (subject.length > 72) {
      return block('COMMIT_SUBJECT_TOO_LONG', 'Commit subject must be 72 characters or fewer.');
    }

    return { exitCode: 0 };
  } catch {
    return { exitCode: 0 };
  }
}

function block(code, reason) {
  return { exitCode: 2, stdoutJson: { decision: 'block', code, reason } };
}

function advisory(msg) {
  return { exitCode: 0, stdoutJson: { hookSpecificOutput: { hookEventName: 'PreToolUse', additionalContext: msg } } };
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
