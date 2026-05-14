# Session State — SessionStart hook (PowerShell variant)
#
# Cierra el loop con context-monitor que ESCRIBE ai_docs/STATE.md cuando contexto <=10%.
# Este hook LEE el head al iniciar la siguiente sesion e inyecta el contexto al system prompt
# como additionalContext.
#
# Opt-in: requiere session_state: true en .claude/hooks/config.json.
# Equivalente PowerShell de session-state.sh.

$ErrorActionPreference = 'SilentlyContinue'

try {
    $input = [Console]::In.ReadToEnd()
    $cwd = (Get-Location).Path

    if ($input) {
        try {
            $data = $input | ConvertFrom-Json
            if ($data.cwd) { $cwd = $data.cwd }
        } catch {}
    }

    # Opt-in
    $configPath = Join-Path $cwd '.claude\hooks\config.json'
    if (-not (Test-Path $configPath)) { exit 0 }

    $config = Get-Content $configPath -Raw | ConvertFrom-Json
    if ($config.session_state -ne $true) { exit 0 }

    # Resolución robusta de la ruta a ai_docs/ mediante .claude/.ai_docs_path.
    # Fallback garantizado a cwd/ai_docs para cero regresión en proyectos canónicos.
    function Resolve-AiDocsDir {
      param([string]$Cwd)
      $overrideFile = Join-Path (Join-Path $Cwd '.claude') '.ai_docs_path'
      if (Test-Path $overrideFile) {
        $resolved = (Get-Content $overrideFile -Encoding UTF8) |
          Where-Object { $_ -notmatch '^\s*#' -and $_.Trim() -ne '' } |
          Select-Object -First 1
        if ($resolved) { $resolved = ($resolved -replace '^\xEF\xBB\xBF', '').Trim() }
        if ($resolved -and [System.IO.Path]::IsPathRooted($resolved) -and (Test-Path $resolved)) {
          return $resolved
        }
      }
      return Join-Path $Cwd 'ai_docs'
    }

    # Leer ai_docs\STATE.md head si existe
    $aiDocsDir = Resolve-AiDocsDir -Cwd $cwd
    $statePath = Join-Path $aiDocsDir 'STATE.md'
    $statePresent = $false
    $stateHead = ''
    $activeTask = $null

    if (Test-Path $statePath) {
        $stateInfo = Get-Item $statePath -ErrorAction SilentlyContinue
        # Solo considerar STATE.md si tiene contenido (>0 bytes) — vacío equivale a ausente
        if ($stateInfo -and $stateInfo.Length -gt 0) {
            $statePresent = $true
            $stateHead = (Get-Content $statePath -TotalCount 20 -ErrorAction SilentlyContinue) -join "`n"
            $taskMatch = [regex]::Match($stateHead, '(?m)^active_task:\s*(.+)$')
            if ($taskMatch.Success) {
                $activeTask = $taskMatch.Groups[1].Value.Trim()
            }
        }
    }

    # Si STATE.md no existe, exit silente — cero tokens desperdiciados.
    if (-not $statePresent) {
        exit 0
    }

    # Construir additionalContext (solo cuando STATE.md existe)
    $lines = @('## Estado del proyecto (session-state hook)', '')
    $lines += '`ai_docs/STATE.md` detectado — sesion retomada. Tarea, fase y ultima accion:'
    $lines += ''
    if ($stateHead) { $lines += $stateHead }
    $lines += ''
    $lines += 'Para continuar: lee el task doc referenciado en `active_task:` y ejecuta `/status` para ver waves pendientes.'
    $additionalContext = $lines -join "`n"

    $output = @{
        hookSpecificOutput = @{
            hookEventName = 'SessionStart'
            additionalContext = $additionalContext
            state_present = $statePresent
            active_task = $activeTask
        }
    } | ConvertTo-Json -Depth 5 -Compress

    [Console]::Out.Write($output)
    exit 0
} catch {
    # Silent fail — nunca romper sesion
    exit 0
}
