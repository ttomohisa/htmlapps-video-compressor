param(
  [switch]$ForceDownload
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

$required = @(
  "AGENTS.md",
  "APP_SPEC.md",
  "app.config.json",
  "dependencies.json",
  "src\index.template.html",
  "build-standalone.ps1",
  "scripts\build-self-extract.ps1",
  "scripts\check-source.ps1",
  "scripts\verify-standalone.ps1",
  "scripts\verify-self-extract.ps1",
  "README.md",
  "README.ja.md",
  "LICENSE",
  "THIRD_PARTY_NOTICES.md",
  "schemas\app-config.schema.json",
  "schemas\dependencies.schema.json"
)

foreach ($relative in $required) {
  $path = Join-Path $Root $relative
  if (-not (Test-Path $path)) { throw "Required repository file is missing: $relative" }
}

$selfExtractBuilderPath = Join-Path $Root "scripts\build-self-extract.ps1"
foreach ($byte in [System.IO.File]::ReadAllBytes($selfExtractBuilderPath)) {
  if ($byte -gt 127) {
    throw "scripts\build-self-extract.ps1 must remain ASCII-only for Windows PowerShell 5.1 compatibility."
  }
}

$app = Get-Content -Raw -Encoding UTF8 (Join-Path $Root "app.config.json") | ConvertFrom-Json
if ([string]::IsNullOrWhiteSpace([string]$app.name)) { throw "app.config.json: name is required" }
if ([string]::IsNullOrWhiteSpace([string]$app.slug)) { throw "app.config.json: slug is required" }
if ([string]::IsNullOrWhiteSpace([string]$app.version)) { throw "app.config.json: version is required" }

& (Join-Path $Root "scripts\check-source.ps1")
$buildArguments = @{}
if ($ForceDownload) { $buildArguments.ForceDownload = $true }
& (Join-Path $Root "build-standalone.ps1") @buildArguments

Write-Host "[OK] Repository check passed." -ForegroundColor Green
