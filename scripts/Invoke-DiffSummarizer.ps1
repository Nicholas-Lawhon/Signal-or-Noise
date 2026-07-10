[CmdletBinding()]
param(
    [ValidateSet('Working', 'Staged', 'Head')]
    [string]$Mode = 'Staged',

    [string[]]$Paths = @()
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $repoRoot

$scope = if ($Paths.Count -gt 0) {
    "Restrict inspection to these paths: $($Paths -join ', ')."
} else {
    'Inspect the complete selected diff.'
}

$prompt = @"
You are the read-only Diff Summarizer for Signal or Noise?. Read AGENTS.md and
agents/routing.md. Use git only to inspect the $Mode diff. $scope

Mode meanings:
- Working: unstaged working-tree diff plus untracked, non-ignored files.
- Staged: staged/index diff.
- Head: all current changes relative to HEAD, including staged, unstaged, and
  untracked non-ignored files.

For Working and Head, run `git ls-files --others --exclude-standard` and inspect
the listed file contents in addition to `git diff`; ordinary diff output does not
include untracked files. Apply any requested path restriction to both sources.

Do not edit, stage, commit, switch branches, clean, merge, or push. Return
Markdown only, at most 250 words, with exactly these headings:
## Change Summary
## Risks or Discrepancies
## Raw Diff Needed?

Name security/privacy/scoring/database-sensitive files explicitly. State whether
a higher-reasoning agent should inspect any raw diff and why. This is a compact
routing aid, not approval.
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
    throw "DeepSeek Diff Summarizer failed with exit code $exitCode. $details"
}

$result | ForEach-Object { Write-Output $_ }
