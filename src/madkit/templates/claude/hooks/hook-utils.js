'use strict';
const fs = require('fs');
const path = require('path');

function resolveAiDocsDir(cwd) {
  const overridePath = path.join(cwd, '.claude', '.ai_docs_path');
  try {
    const raw = fs.readFileSync(overridePath, 'utf8').replace(/^﻿/, '');
    const resolved = raw.split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('#'))[0];
    if (resolved && path.isAbsolute(resolved) && fs.existsSync(resolved)) return resolved;
  } catch (_) {}
  return path.join(cwd, 'ai_docs');
}

function readConfig(cwd) {
  try {
    return JSON.parse(fs.readFileSync(path.join(cwd, '.claude', 'hooks', 'config.json'), 'utf8'));
  } catch {
    return null;
  }
}

module.exports = { resolveAiDocsDir, readConfig };
