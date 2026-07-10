[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string]$Task
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $repoRoot

$prompt = @"
You are the Git Operator for Signal or Noise?. Read AGENTS.md and
agents/routing.md first. Perform only this mechanical git task:

$Task

Preserve unrelated work. Never expose or stage secrets, .env files, or
node_modules. Do not use destructive git operations. Do not commit, merge,
delete branches, or push unless the task explicitly authorizes that exact
operation; pushing additionally requires explicit user approval. Report the
commands run and concise results. Do not make product or acceptance decisions.
"@

$previousErrorActionPreference = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
try {
    $rawResult = & opencode run --auto --pure -m deepseek/deepseek-v4-pro --format default $prompt 2>&1
    $exitCode = $LASTEXITCODE
} finally {
    $ErrorActionPreference = $previousErrorActionPreference
}

$stderrOutput = @($rawResult | Where-Object { $_ -is [System.Management.Automation.ErrorRecord] })
$result = @($rawResult | Where-Object { $_ -isnot [System.Management.Automation.ErrorRecord] })
if ($exitCode -ne 0) {
    $details = ($stderrOutput | ForEach-Object ToString) -join [Environment]::NewLine
    throw "DeepSeek Git Operator failed with exit code $exitCode. $details"
}

$result | ForEach-Object { Write-Output $_ }
