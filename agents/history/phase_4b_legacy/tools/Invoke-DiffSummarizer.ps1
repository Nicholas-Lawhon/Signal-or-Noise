[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string]$CompletionReport,

    [string]$OutputPath
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $repoRoot

$reportPath = [System.IO.Path]::GetFullPath((Join-Path $repoRoot $CompletionReport))
if (-not (Test-Path -LiteralPath $reportPath -PathType Leaf)) {
    throw "Completion report not found: $CompletionReport"
}

if (-not $OutputPath) {
    $stem = [System.IO.Path]::GetFileNameWithoutExtension($reportPath)
    $OutputPath = Join-Path $repoRoot "agents/reports/$stem`_diff_summary.md"
} elseif (-not [System.IO.Path]::IsPathRooted($OutputPath)) {
    $OutputPath = Join-Path $repoRoot $OutputPath
}

$outputDirectory = Split-Path -Parent $OutputPath
New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null

$prompt = @"
You are the Diff Summarizer for Signal or Noise?. Do not edit files, run git commit/push, change state, or make approval decisions. Read this completion report:
$CompletionReport

Use its Files Changed section to scope your inspection. Inspect only the matching uncommitted changes with git diff; ignore unrelated working-tree changes. Compare the report's claimed acceptance criteria and test results to the scoped diff.
Return Markdown only, at most 200 words, with exactly these headings:
## Verification Summary
## Risks or Discrepancies
## Raw Diff Needed?

State concrete evidence, uncertainty, and whether the orchestrator must inspect the raw diff. This is a verification aid, not an approval.
"@

$previousErrorActionPreference = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
try {
    # OpenCode's default formatter writes ANSI/UI framing to stderr even on a
    # successful run. Do not let PowerShell promote that framing to a
    # terminating error; preserve it only for a genuine non-zero failure.
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

$content = [string]::Join([Environment]::NewLine, [string[]]$result)
[System.IO.File]::WriteAllText(
    $OutputPath,
    $content,
    [System.Text.UTF8Encoding]::new($false)
)
Write-Output "Diff summary written to $OutputPath"
