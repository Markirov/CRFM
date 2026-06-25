# Stop hook — sugiere invocar crfm-reviewer si diff no trivial
# Output JSON: { hookSpecificOutput: { hookEventName, additionalContext } }
# No bloquea. Solo añade contexto a próximo prompt si hay diff significativo.

$ErrorActionPreference = 'SilentlyContinue'

# Lee stdin del hook (no se usa, pero hay que drenar)
$null = [Console]::In.ReadToEnd()

Set-Location $PSScriptRoot
Set-Location ..\..

# Diff staged + unstaged (sin untracked)
$stat = git diff HEAD --shortstat 2>$null

if (-not $stat) {
    # Nada que revisar
    Write-Output '{}'
    exit 0
}

# Parse "X files changed, Y insertions(+), Z deletions(-)"
$files = 0
$lines = 0
if ($stat -match '(\d+) files? changed') { $files = [int]$matches[1] }
if ($stat -match '(\d+) insertions?') { $lines += [int]$matches[1] }
if ($stat -match '(\d+) deletions?') { $lines += [int]$matches[1] }

# Umbral: 3+ archivos o 50+ líneas
if ($files -lt 3 -and $lines -lt 50) {
    Write-Output '{}'
    exit 0
}

# Detecta áreas sensibles tocadas
$diff = git diff HEAD --name-only 2>$null
$sensitive = @()
if ($diff -match 'firestore\.rules') { $sensitive += 'rules' }
if ($diff -match 'functions/src/') { $sensitive += 'functions' }
if ($diff -match 'firebase-service|role-service|telegram-service') { $sensitive += 'firebase-services' }
if ($diff -match 'parsers\.ts|ssw-basic\.ts|weapons\.ts|hangar-types\.ts|combat-types\.ts') { $sensitive += 'parsers/types' }
if ($diff -match 'combat-data\.ts|useSimulador\.ts') { $sensitive += 'mechanics' }

$suggested = @('crfm-reviewer')
if ($sensitive -contains 'rules' -or $sensitive -contains 'functions' -or $sensitive -contains 'firebase-services') {
    $suggested += 'crfm-firestore-audit'
}
if ($sensitive -contains 'parsers/types') {
    $suggested += 'crfm-parser-tester'
}
if ($sensitive -contains 'mechanics') {
    $suggested += 'crfm-rules-validator'
}

$agentList = $suggested -join ', '
$msg = "Diff actual: $files archivos, $lines líneas. Áreas: $($sensitive -join ', '). Sugerencia: lanzar subagente(s) [$agentList] en background antes de cerrar la tarea. Usuario puede ignorar si ya revisaste mentalmente."

$out = @{
    hookSpecificOutput = @{
        hookEventName = 'Stop'
        additionalContext = $msg
    }
} | ConvertTo-Json -Compress -Depth 4

Write-Output $out
exit 0
