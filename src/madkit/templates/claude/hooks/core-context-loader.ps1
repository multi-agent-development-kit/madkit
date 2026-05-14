# Core Context Loader - SessionStart hook - PowerShell port
#
# Funcional parity with core-context-loader.sh. Same opt-in flag, same
# whitelist + pointer index behavior. ASCII-only file body for safety under
# Windows PowerShell 5.1 default codepage.

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

try {
  $stdin = [Console]::In.ReadToEnd()
} catch {
  $stdin = ""
}

$cwd = $null
try {
  if ($stdin) {
    $payload = $stdin | ConvertFrom-Json -ErrorAction Stop
    if ($payload.cwd) { $cwd = $payload.cwd }
  }
} catch { }
if (-not $cwd) { $cwd = (Get-Location).Path }

$configPath = Join-Path -Path $cwd -ChildPath ".claude/hooks/config.json"
if (-not (Test-Path $configPath)) { exit 0 }

$enabled = $false
$headLines = 30
$maxTotal = 400
$maxBytes = 50000
$indexOthers = $true
$essentialFiles = @("master_idea.md", "architecture.md")

try {
  $config = Get-Content -Path $configPath -Raw -ErrorAction Stop | ConvertFrom-Json -ErrorAction Stop
  $v = $config.core_context_loader
  if ($v -eq $true) {
    $enabled = $true
  } elseif ($v -is [System.Management.Automation.PSCustomObject]) {
    $isEnabled = $true
    if ($v.PSObject.Properties.Match('enabled').Count -gt 0) {
      $isEnabled = ($v.enabled -ne $false)
    }
    if ($isEnabled) {
      $enabled = $true
      if ($v.PSObject.Properties.Match('head_lines').Count -gt 0) {
        $h = [int]($v.head_lines)
        if ($h -lt 10) { $h = 30 }
        if ($h -gt 200) { $h = 200 }
        $headLines = $h
      }
      if ($v.PSObject.Properties.Match('max_total_lines').Count -gt 0) {
        $m = [int]($v.max_total_lines)
        if ($m -lt 50) { $m = 400 }
        if ($m -gt 1000) { $m = 1000 }
        $maxTotal = $m
      }
      if ($v.PSObject.Properties.Match('max_bytes').Count -gt 0) {
        $mb = [int]($v.max_bytes)
        if ($mb -lt 1000) { $mb = 50000 }
        if ($mb -gt 500000) { $mb = 500000 }
        $maxBytes = $mb
      }
      if ($v.PSObject.Properties.Match('index_others').Count -gt 0) {
        $indexOthers = ($v.index_others -ne $false)
      }
      if ($v.PSObject.Properties.Match('essential_files').Count -gt 0 -and $v.essential_files -is [System.Collections.IEnumerable]) {
        $essentialFiles = @($v.essential_files | Where-Object { $_ -is [string] -and $_.EndsWith('.md') })
      }
    }
  }
} catch {
  exit 0
}

if (-not $enabled) { exit 0 }

# Resolución robusta de la ruta a ai_docs/ mediante .claude/.ai_docs_path.
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

$aiDocsDir = Resolve-AiDocsDir -Cwd $cwd
$coreDir = Join-Path -Path $aiDocsDir -ChildPath "core"
if (-not (Test-Path $coreDir -PathType Container)) { exit 0 }

# Inventario completo de core/*.md
$allFiles = @()
try {
  $allFiles = @(Get-ChildItem -Path $coreDir -File -Filter "*.md" -ErrorAction Stop |
    Sort-Object Name |
    ForEach-Object { $_.Name })
} catch {
  exit 0
}
if ($allFiles.Count -eq 0) { exit 0 }

# Esenciales presentes en filesystem (preserva orden de essential_files).
$presentEssential = @()
foreach ($f in $essentialFiles) {
  if ($allFiles -contains $f) { $presentEssential += $f }
}
# Pointer index = todos los .md menos los esenciales.
$pointerFiles = @($allFiles | Where-Object { $essentialFiles -notcontains $_ })

$blocks = @()
$totalLines = 0
$truncated = $false

foreach ($name in $presentEssential) {
  if ($totalLines -ge $maxTotal) {
    $truncated = $true
    break
  }
  $fullPath = Join-Path -Path $coreDir -ChildPath $name
  $content = $null
  try {
    $content = @(Get-Content -Path $fullPath -Encoding UTF8 -ErrorAction Stop)
  } catch { continue }

  $lineCount = $content.Count
  $allowed = [Math]::Min($headLines, $maxTotal - $totalLines)
  if ($lineCount -le $allowed) {
    $slice = $content
  } else {
    $slice = $content[0..($allowed - 1)]
  }

  $sliceJoined = $slice -join "`n"
  $block = "## ai_docs/core/" + $name + "`n" + $sliceJoined
  if ($lineCount -gt $allowed) {
    $extra = $lineCount - $allowed
    $truncMark = [char]0x2014
    $block += "`n`n[TRUNCATED " + $truncMark + " " + $extra + " lines more, leer archivo completo on-demand]"
  }
  $blocks += $block
  $totalLines += $slice.Count
}

# Si no hay esenciales ni pointers para listar, exit 0.
if ($blocks.Count -eq 0 -and (-not $indexOthers -or $pointerFiles.Count -eq 0)) { exit 0 }

$truncMsg = ""
if ($truncated) {
  $truncMsg = "`n`n[TRUNCATED - max_total_lines reached, remaining files not included]"
}
$header = "# Project context loaded at session start (core-context-loader hook)`n`nEsenciales inyectados con head-$headLines; cap total $maxTotal lines, byte cap $maxBytes B.`nPara los archivos listados como pointer index abajo, usa la herramienta Read cuando el trabajo lo requiera.$truncMsg"

if ($blocks.Count -gt 0) {
  $additionalContext = $header + "`n`n" + ($blocks -join "`n`n---`n`n")
} else {
  $additionalContext = $header
}

if ($indexOthers -and $pointerFiles.Count -gt 0) {
  $indexLines = @()
  foreach ($p in $pointerFiles) {
    $indexLines += "- ``ai_docs/core/" + $p + "``"
  }
  $indexBlock = "## Otros archivos en ai_docs/core/ (read on-demand)`n`n" + ($indexLines -join "`n")
  $additionalContext = $additionalContext + "`n`n---`n`n" + $indexBlock
}

# Cap en bytes
$enc = [System.Text.Encoding]::UTF8
$byteLen = $enc.GetByteCount($additionalContext)
if ($byteLen -gt $maxBytes) {
  $bytes = $enc.GetBytes($additionalContext)
  $truncBytes = $bytes[0..($maxBytes - 1)]
  $truncStr = $enc.GetString($truncBytes)
  $lastNl = $truncStr.LastIndexOf("`n")
  if ($lastNl -gt 0) { $truncStr = $truncStr.Substring(0, $lastNl) }
  $additionalContext = $truncStr + "`n`n[TRUNCATED - byte cap ($maxBytes B)]"
}

$indexedCount = 0
if ($indexOthers) { $indexedCount = $pointerFiles.Count }

$out = [ordered]@{
  hookSpecificOutput = [ordered]@{
    hookEventName       = "SessionStart"
    additionalContext   = $additionalContext
    core_files_loaded   = $blocks.Count
    core_lines_inyected = $totalLines
    core_files_indexed  = $indexedCount
    truncated           = $truncated
  }
}

$json = $out | ConvertTo-Json -Depth 6 -Compress
[Console]::Out.Write($json)
exit 0
