# hook-version: 1.0.0
# Scaffolding Guard — PreToolUse hook (PowerShell variant)
#
# Bloquea git commits que (a) incluyen archivos en ai_docs/, .claude/ o .cursor/, o
# (b) tienen mensaje sin formato <type>: <subject> con type en
# {create, optimize, update, fix, refactor} (CLAUDE.md §3.4).
#
# Opt-in: requiere `scaffolding_guard: true` en .claude/hooks/config.json.
# Equivalente PowerShell de scaffolding-guard.sh.

$ErrorActionPreference = 'SilentlyContinue'

try {
    # Leer JSON por stdin
    $input = [Console]::In.ReadToEnd()
    if (-not $input) { exit 0 }

    $data = $input | ConvertFrom-Json
    $cwd = if ($data.cwd) { $data.cwd } else { Get-Location }

    # Opt-in
    $configPath = Join-Path $cwd '.claude\hooks\config.json'
    if (-not (Test-Path $configPath)) { exit 0 }

    $config = Get-Content $configPath -Raw | ConvertFrom-Json
    if ($config.scaffolding_guard -ne $true) { exit 0 }

    # Solo procesar git commit
    $cmd = $data.tool_input.command
    if (-not $cmd -or $cmd -notmatch '^git\s+commit') { exit 0 }

    # CHECK 1: archivos staged prohibidos
    Push-Location $cwd
    $staged = git diff --cached --name-only 2>$null
    Pop-Location

    if ($staged) {
        $forbidden = $staged | Where-Object { $_ -match '^(ai_docs|\.claude|\.cursor)/' } | Select-Object -First 3
        if ($forbidden) {
            $list = ($forbidden -join ',')
            $reason = "AI scaffolding staged for commit: $list. These directories must never be committed (CLAUDE.md prohibitions). Run: git reset HEAD ai_docs/ .claude/ .cursor/"
            $output = @{ decision = 'block'; code = 'SCAFFOLDING_STAGED'; reason = $reason } | ConvertTo-Json -Compress
            [Console]::Out.Write($output)
            exit 2
        }
    }

    # CHECK 2: formato del mensaje
    $msg = $null
    if ($cmd -match '-m\s+"([^"]+)"') { $msg = $Matches[1] }
    elseif ($cmd -match "-m\s+'([^']+)'") { $msg = $Matches[1] }

    if ($msg) {
        $subject = ($msg -split "`n")[0]
        if ($subject -notmatch '^(create|optimize|update|fix|refactor)(\(.+\))?:\s.+') {
            $reason = 'Commit subject must follow CLAUDE.md section 3.4 format: <type>: <subject>. Valid types: create, optimize, update, fix, refactor. Subject in lowercase, imperative, no trailing period.'
            $output = @{ decision = 'block'; code = 'COMMIT_FORMAT_INVALID'; reason = $reason } | ConvertTo-Json -Compress
            [Console]::Out.Write($output)
            exit 2
        }
        if ($subject.Length -gt 72) {
            $reason = 'Commit subject must be 72 characters or fewer.'
            $output = @{ decision = 'block'; code = 'COMMIT_SUBJECT_TOO_LONG'; reason = $reason } | ConvertTo-Json -Compress
            [Console]::Out.Write($output)
            exit 2
        }
    }

    exit 0
} catch {
    # Silent fail — nunca bloquear
    exit 0
}
