param(
    [string]$ProjectName = "iqmindware",
    [string]$Branch = "main",
    [string]$VerifyUrl = "https://www.iqmindware.com/",
    [switch]$CheckOnly,
    [switch]$SkipVerify
)

$ErrorActionPreference = "Stop"

function Invoke-Git {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Args
    )

    $output = & git @Args 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "git $($Args -join ' ') failed.`n$output"
    }
    return $output
}

function Get-GitSubmodulePaths {
    param(
        [Parameter(Mandatory = $true)]
        [string]$RepoRoot
    )

    $gitmodulesPath = Join-Path $RepoRoot ".gitmodules"
    if (-not (Test-Path $gitmodulesPath)) {
        return @()
    }

    $lines = & git config -f $gitmodulesPath --get-regexp '^submodule\..*\.path$' 2>$null
    if ($LASTEXITCODE -ne 0 -or -not $lines) {
        return @()
    }

    return @(
        $lines |
            ForEach-Object { ($_ -split '\s+', 2)[1].Trim() } |
            Where-Object { $_ }
    )
}

$siteRoot = Split-Path -Parent $PSScriptRoot
Push-Location $siteRoot

try {
    $repoRoot = ((Invoke-Git -Args @("rev-parse", "--show-toplevel")) | Select-Object -First 1).Trim()
    $headCommit = ((Invoke-Git -Args @("rev-parse", "HEAD")) | Select-Object -First 1).Trim()
    $headMessage = ((Invoke-Git -Args @("log", "-1", "--pretty=%s")) | Select-Object -First 1).Trim()

    $gitlinkPaths = @(
        (Invoke-Git -Args @("ls-files", "--stage")) |
            Where-Object { $_ -match '^160000\s' } |
            ForEach-Object { ($_ -split '\s+')[-1].Trim() } |
            Where-Object { $_ }
    )
    $submodulePaths = @(Get-GitSubmodulePaths -RepoRoot $repoRoot)
    $unexpectedGitlinks = @($gitlinkPaths | Where-Object { $submodulePaths -notcontains $_ })

    if ($unexpectedGitlinks.Count -gt 0) {
        throw "Broken gitlinks in parent repo index: $($unexpectedGitlinks -join ', '). Remove them before Cloudflare deploy."
    }

    Write-Host "Site root: $siteRoot"
    Write-Host "Repo root: $repoRoot"
    Write-Host "Commit: $headCommit"
    Write-Host "Project: $ProjectName"

    if ($CheckOnly) {
        Write-Host "Preflight checks passed."
        return
    }

    $deployArgs = @(
        "-y", "wrangler", "pages", "deploy", ".",
        "--project-name", $ProjectName,
        "--branch", $Branch,
        "--commit-hash", $headCommit,
        "--commit-message", $headMessage,
        "--commit-dirty=true"
    )

    & npx @deployArgs
    if ($LASTEXITCODE -ne 0) {
        throw "Cloudflare Pages deploy failed."
    }

    if (-not $SkipVerify) {
        Start-Sleep -Seconds 5
        $response = Invoke-WebRequest -Uri $VerifyUrl -UseBasicParsing
        Write-Host "Verify URL: $VerifyUrl"
        Write-Host "Status: $($response.StatusCode)"
    }
}
finally {
    Pop-Location
}
