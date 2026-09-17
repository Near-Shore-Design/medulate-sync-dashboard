<#
.SYNOPSIS
  Sets up medulate-sync-dashboard for local development on a new Windows machine (idempotent).

.DESCRIPTION
  Node.js check, npm ci (when node_modules is missing or stale), .env from
  .env.example, then tests + a production build to prove the machine can ship.
  Production is deployed by Vercel; this never touches it. See RELEASING.md.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts\setup_dev.ps1
#>
[CmdletBinding()]
param([switch]$SkipChecks)

$ErrorActionPreference = 'Stop'
$Repo = Split-Path -Parent $PSScriptRoot
Set-Location $Repo

function Check([string]$What) { if ($LASTEXITCODE -ne 0) { throw "$What failed (exit $LASTEXITCODE)" } }

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    $portable = Get-ChildItem "$env:USERPROFILE\nodejs-portable\node-v*" -Directory -ErrorAction SilentlyContinue |
                Sort-Object Name -Descending | Select-Object -First 1
    if ($portable) { $env:Path = "$($portable.FullName);$env:Path" }
    elseif (Test-Path "$env:ProgramFiles\nodejs\node.exe") { $env:Path = "$env:ProgramFiles\nodejs;$env:Path" }
    else { throw 'Node.js not found. Install it: winget install OpenJS.NodeJS.LTS' }
}
Write-Host "==> node $(& node --version)"

$stamp = 'node_modules\.package-lock.json'
if (-not (Test-Path $stamp) -or ((Get-Item package-lock.json).LastWriteTime -gt (Get-Item $stamp).LastWriteTime)) {
    Write-Host '==> npm ci'
    & npm ci; Check 'npm ci'
}

if (-not (Test-Path .env)) { Copy-Item .env.example .env; Write-Host '==> Created .env from .env.example (points at the production API)' }

if (-not $SkipChecks) {
    Write-Host '==> Tests';            & npm test;      Check 'npm test'
    Write-Host '==> Production build'; & npm run build; Check 'npm run build'
}

Write-Host ''
Write-Host 'Ready. Run: npm run dev   (http://localhost:8080)' -ForegroundColor Green
