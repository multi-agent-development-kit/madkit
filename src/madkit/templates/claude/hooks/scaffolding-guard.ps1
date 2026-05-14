# Scaffolding Guard — PreToolUse hook (PowerShell variant)
#
# Bloquea git commits que:
#   (a) incluyen archivos en ai_docs/, .claude/ o .cursor/.
#   (b) tienen mensaje sin formato <type>: <subject> con type en
#       {create, optimize, update, fix, refactor} (CLAUDE.md §3.4).
#   (c) contienen "Co-Authored-By:" con "Claude" o "anthropic"
#       (CLAUDE.md §3.4 prohíbe atribuir commits a Claude).
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
    # Acepta: true (forma compacta) o {enabled: true, ...} (forma extendida)
    $sgVal = $config.scaffolding_guard
    $sgEnabled = ($sgVal -eq $true) -or (
        $sgVal -is [System.Management.Automation.PSCustomObject] -and
        ($sgVal.PSObject.Properties.Match('enabled').Count -eq 0 -or $sgVal.enabled -ne $false)
    )
    if (-not $sgEnabled) { exit 0 }

    # Leer excluded_dirs de config (scaffolding_guard.excluded_dirs: [])
    $excludedDirs = @()
    $sgCfg = $config.scaffolding_guard
    if ($sgCfg -is [System.Management.Automation.PSCustomObject] -and
        $sgCfg.PSObject.Properties.Match('excluded_dirs').Count -gt 0) {
        $excludedDirs = @($sgCfg.excluded_dirs)
    }

    # Solo procesar git commit
    $cmd = $data.tool_input.command
    if (-not $cmd -or $cmd -notmatch '^git\s+commit') { exit 0 }

    # CHECK 1: archivos staged prohibidos
    Push-Location $cwd
    $staged = git diff --cached --name-only 2>$null
    Pop-Location

    if ($staged) {
        # Filtrar staged por excluded_dirs (override granular por directorio)
        $filtered = $staged | Where-Object {
            $file = $_
            $excluded = $false
            foreach ($dir in $excludedDirs) {
                if ($file -match "^$([regex]::Escape($dir))[/\\]") {
                    $excluded = $true
                    break
                }
            }
            -not $excluded
        }
        $forbidden = $filtered | Where-Object { $_ -match '^(ai_docs|\.claude|\.cursor)/' } | Select-Object -First 3
        if ($forbidden) {
            $list = ($forbidden -join ',')
            $reason = "AI scaffolding staged for commit: $list. These directories must never be committed (ver configuración de scaffolding del proyecto en CLAUDE.md o .claude/hooks/README.md). Run: git reset HEAD ai_docs/ .claude/ .cursor/"
            $output = @{ decision = 'block'; code = 'SCAFFOLDING_STAGED'; reason = $reason } | ConvertTo-Json -Compress
            [Console]::Out.Write($output)
            exit 2
        }
    }

    # CHECK 2: Co-Authored-By: Claude / anthropic prohibido (CLAUDE.md §3.4)
    # Verifica antes del formato — la atribucion indebida es mas critica.
    if ($cmd -match '(?i)Co-Authored-By:[^\n]*(Claude|anthropic)') {
        $reason = 'Commit prohibido: "Co-Authored-By: Claude/anthropic" detectado. La configuracion de scaffolding del proyecto (ver CLAUDE.md o .claude/hooks/README.md) prohibe atribuir commits a Claude o Anthropic. Eliminar la linea Co-Authored-By y volver a commitear.'
        $output = @{ decision = 'block'; code = 'COMMIT_COAUTHOR_FORBIDDEN'; reason = $reason } | ConvertTo-Json -Compress
        [Console]::Out.Write($output)
        exit 2
    }

    # CHECK 3: formato del mensaje
    # Intentar extraer el mensaje en múltiples variantes de quoting.
    $msg = $null
    $msgSource = 'extracted'
    if ($cmd -match '-m\s+"([^"]+)"') { $msg = $Matches[1] }
    elseif ($cmd -match "-m\s+'([^']+)'") { $msg = $Matches[1] }
    elseif ($cmd -match '--message=(\S+)') { $msg = $Matches[1] }
    elseif ($cmd -match "-m\s+\`\$'([^']+)'") { $msg = $Matches[1] }
    elseif ($cmd -match '-F\s+(\S+)') {
        $fileArg = $Matches[1]
        if (Test-Path $fileArg) {
            $msg = (Get-Content $fileArg -TotalCount 1 -ErrorAction SilentlyContinue)
        }
        if (-not $msg) {
            # Archivo -F no accesible: fallback a git log (advisory si formato inválido)
            Push-Location $cwd
            $msg = (git log -1 --format=%s 2>$null)
            Pop-Location
            if ($msg) { $msgSource = 'git_log_fallback' }
        }
    }

    if (-not $msg) {
        # Fallback: intentar leer último commit (heredoc / editor interactivo)
        Push-Location $cwd
        $lastMsg = (git log -1 --format=%s 2>$null)
        Pop-Location
        if ($lastMsg) {
            $msg = $lastMsg
            $msgSource = 'git_log_fallback'
        } else {
            # Modo interactivo u otro formato no reconocido: advisory, no bloquear
            $warnOutput = @{ hookSpecificOutput = @{ hookEventName = 'PreToolUse'; additionalContext = 'SCAFFOLDING GUARD WARN: commit format not validatable (interactive editor or unrecognized -m format). Review manually that subject follows: <type>: <subject> with types create|optimize|update|fix|refactor.' } } | ConvertTo-Json -Compress
            [Console]::Out.Write($warnOutput)
            exit 0
        }
    }

    if ($msg) {
        $subject = ($msg -split "`n")[0]
        if ($subject -notmatch '^(create|optimize|update|fix|refactor)(\(.+\))?:\s.+') {
            if ($msgSource -eq 'git_log_fallback') {
                $warnOutput = @{ hookSpecificOutput = @{ hookEventName = 'PreToolUse'; additionalContext = 'SCAFFOLDING GUARD WARN: last commit subject may not follow format <type>: <subject>. Review with git log -1.' } } | ConvertTo-Json -Compress
                [Console]::Out.Write($warnOutput)
                exit 0
            }
            $reason = 'Commit subject must follow the project commit format (ver configuracion de scaffolding en CLAUDE.md o .claude/hooks/README.md): <type>: <subject>. Valid types: create, optimize, update, fix, refactor. Subject in lowercase, imperative, no trailing period.'
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
