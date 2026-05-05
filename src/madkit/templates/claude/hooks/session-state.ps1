# hook-version: 1.0.0
# Session State — SessionStart hook (PowerShell variant)
#
# Cierra el loop con context-monitor (T077) que ESCRIBE ai_docs/STATE.md cuando contexto <=10%.
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

    # Leer ai_docs\STATE.md head si existe
    $statePath = Join-Path $cwd 'ai_docs\STATE.md'
    $statePresent = $false
    $stateHead = ''
    $activeTask = $null

    if (Test-Path $statePath) {
        $statePresent = $true
        $stateHead = (Get-Content $statePath -TotalCount 20 -ErrorAction SilentlyContinue) -join "`n"
        $taskMatch = [regex]::Match($stateHead, '(?m)^active_task:\s*(.+)$')
        if ($taskMatch.Success) {
            $activeTask = $taskMatch.Groups[1].Value.Trim()
        }
    }

    # Construir additionalContext
    $lines = @('## Estado del proyecto (session-state hook)', '')
    if ($statePresent) {
        $lines += '`ai_docs/STATE.md` detectado — sesion retomada. Tarea, fase y ultima accion:'
        $lines += ''
        if ($stateHead) { $lines += $stateHead }
        $lines += ''
        $lines += 'Para continuar: lee el task doc referenciado en `active_task:` y ejecuta `/status` para ver waves pendientes.'
    } else {
        $lines += 'Sin `ai_docs/STATE.md` — sesion limpia. Si retomando trabajo, ejecuta `/status` para inventario de tareas ABIERTAS / EN_PROGRESO.'
    }
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
