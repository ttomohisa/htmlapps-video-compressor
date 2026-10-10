param(
  [switch]$ForceDownload
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)


function Get-FileSha256Hex([string]$Path) {
  if (-not (Test-Path -LiteralPath $Path)) { throw "File not found for SHA-256: $Path" }
  $algorithm = [System.Security.Cryptography.SHA256]::Create()
  $stream = [System.IO.File]::OpenRead($Path)
  try {
    return (($algorithm.ComputeHash($stream) | ForEach-Object { $_.ToString("x2") }) -join "")
  } finally {
    $stream.Dispose()
    $algorithm.Dispose()
  }
}

$required = @(
  "AGENTS.md",
  "APP_SPEC.md",
  "app.config.json",
  "dependencies.json",
  "src\index.template.html",
  "build-standalone.ps1",
  "build-with-local-ffmpeg.bat",
  "update-ffmpeg.bat",
  "scripts\update-ffmpeg.ps1",
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

$hashSensitiveScripts = @(
  (Join-Path $Root "build-standalone.ps1"),
  (Join-Path $Root "scripts\build-self-extract.ps1")
)
foreach ($scriptPath in $hashSensitiveScripts) {
  $scriptText = [System.IO.File]::ReadAllText($scriptPath)
  if ($scriptText -match '(?<![A-Za-z0-9_-])Get-FileHash(?![A-Za-z0-9_-])') {
    throw "Build scripts must use the .NET SHA-256 helper instead of Get-FileHash: $scriptPath"
  }
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
if ([string]$app.version -ne "1.3.5") { throw "app.config.json: expected release version 1.3.5" }

$templateText = [System.IO.File]::ReadAllText((Join-Path $Root "src\index.template.html"), [System.Text.Encoding]::UTF8)
foreach ($requiredMarker in @('id="outputNameInput"', 'id="mobileBar"', 'dialog[open]{display:flex;flex-direction:column}')) {
  if (-not $templateText.Contains($requiredMarker)) { throw "src/index.template.html is missing required application marker: $requiredMarker" }
}


$dependencies = Get-Content -Raw -Encoding UTF8 (Join-Path $Root "dependencies.json") | ConvertFrom-Json
$ffmpegDependency = @($dependencies.dependencies | Where-Object { [string]$_.id -eq "ffmpeg-wasm-builder" })
if ($ffmpegDependency.Count -ne 1) { throw "dependencies.json must contain exactly one ffmpeg-wasm-builder dependency" }
if ([string]$ffmpegDependency[0].source -ne "github-release") { throw "ffmpeg-wasm-builder must use source=github-release" }
if ([string]$ffmpegDependency[0].version -notmatch '^[0-9]+\.[0-9]+\.[0-9]+(?:[-+][0-9A-Za-z.-]+)?$') { throw "ffmpeg-wasm-builder version must be an explicit semver" }
if ([string]$ffmpegDependency[0].releaseAsset -notmatch '\{version\}') { throw "releaseAsset must derive from the single version field" }
if ([string]$ffmpegDependency[0].sourceAsset -notmatch '\{version\}') { throw "sourceAsset must derive from the single version field" }

$node = Get-Command node -ErrorAction SilentlyContinue
if ($null -eq $node) { throw "Node.js 22 or newer is required for application regression checks." }
$regressionScript = Join-Path $Root "scripts\test-source-lifecycle.cjs"
& $node.Source $regressionScript
if ($LASTEXITCODE -ne 0) { throw "Application source lifecycle regression checks failed." }
& $node.Source $regressionScript (Join-Path $Root "video-compressor.html")
if ($LASTEXITCODE -ne 0) { throw "Checked-in distribution lifecycle checks failed. Rebuild video-compressor.html." }

& (Join-Path $Root "scripts\check-source.ps1")
$buildArguments = @{}
if ($ForceDownload) { $buildArguments.ForceDownload = $true }
& (Join-Path $Root "build-standalone.ps1") @buildArguments

$distOutput = Join-Path $Root "dist\index.html"
$rootOutput = Join-Path $Root "video-compressor.html"
if (-not (Test-Path -LiteralPath $rootOutput)) { throw "Root distribution HTML was not generated: video-compressor.html" }
$distHash = (Get-FileSha256Hex $distOutput)
$rootHash = (Get-FileSha256Hex $rootOutput)
if ($distHash -ne $rootHash) { throw "video-compressor.html must match dist/index.html" }
& $node.Source $regressionScript $distOutput
if ($LASTEXITCODE -ne 0) { throw "Built standalone lifecycle regression checks failed." }

$manifestPath = Join-Path $Root "dist\dependency-manifest.json"
$manifest = Get-Content -Raw -Encoding UTF8 -LiteralPath $manifestPath | ConvertFrom-Json
$resolved = @($manifest.dependencies | Where-Object { [string]$_.id -eq "ffmpeg-wasm-builder" })
if ($resolved.Count -ne 1) { throw "Generated manifest must contain exactly one ffmpeg-wasm-builder dependency" }
if ([string]$resolved[0].version -ne [string]$ffmpegDependency[0].version) { throw "Generated manifest Builder version does not match dependencies.json" }
if ([string]$resolved[0].archiveSha256 -notmatch '^[0-9a-f]{64}$') { throw "Generated manifest must record the verified Release archive SHA-256" }
if ([string]$resolved[0].sourceSha256 -notmatch '^[0-9a-f]{64}$') { throw "Generated manifest must record the corresponding-source SHA-256" }
if ([string]::IsNullOrWhiteSpace([string]$resolved[0].correspondingSourceUrl)) { throw "Generated manifest must record the corresponding-source URL" }

& $node.Source --test (Join-Path $Root "scripts\test-support\timing-readers.test.cjs")
if ($LASTEXITCODE -ne 0) { throw "Media timing parser regression checks failed." }
& $node.Source (Join-Path $Root "scripts\test-core-timing.cjs") $distOutput
if ($LASTEXITCODE -ne 0) { throw "Embedded FFmpeg media timing regression checks failed." }

foreach ($target in @("src\index.template.html", "video-compressor.html", "dist\index.html", "dist\index.self-extract.html")) {
  & $node.Source (Join-Path $Root "scripts\test-dialog-layout.cjs") (Join-Path $Root $target)
  if ($LASTEXITCODE -ne 0) { throw "Dialog layout regression checks failed for $target" }
}

Write-Host "[OK] Repository check passed." -ForegroundColor Green
