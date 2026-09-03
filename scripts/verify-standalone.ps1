param(
  [Parameter(Mandatory = $true)]
  [string]$Path,
  [bool]$RequireNetworkBlock = $true
)

$ErrorActionPreference = "Stop"
$fullPath = [System.IO.Path]::GetFullPath($Path)
if (-not (Test-Path $fullPath)) { throw "Standalone HTML not found: $fullPath" }

$content = [System.IO.File]::ReadAllText($fullPath, [System.Text.Encoding]::UTF8)
$errors = New-Object System.Collections.Generic.List[string]

foreach ($placeholder in @("__APP_CONFIG_JSON__", "__BUILD_MANIFEST_JSON__", "__EMBEDDED_ASSET_BUNDLE_JSON__")) {
  if ($content.Contains($placeholder)) { $errors.Add("Unresolved placeholder: $placeholder") }
}

if ($content -match '<script[^>]+src\s*=') { $errors.Add("External script reference found.") }
if ($content -match '<link[^>]+href\s*=\s*["'']\s*https?://') { $errors.Add("External link reference found.") }
if ($content -match '@import\s+(url\()?\s*["'']?https?://') { $errors.Add("External CSS import found.") }
if ($content -match '<iframe\b') { $errors.Add("iframe is not allowed in the standalone output.") }
if ($RequireNetworkBlock -and $content -notmatch "connect-src\s+'none'") { $errors.Add("CSP must include connect-src 'none'.") }
if ($content -notmatch "script-src[^;]*'wasm-unsafe-eval'") { $errors.Add("CSP must include script-src 'wasm-unsafe-eval' for ffmpeg.wasm.") }
if ($content -match "(?<!wasm-)'unsafe-eval'") { $errors.Add("CSP must not include the broader JavaScript 'unsafe-eval'.") }
if ($content -notmatch 'ffmpeg-wasm-builder') { $errors.Add("Embedded Builder dependency metadata was not found.") }
if ($content -notmatch '"core-wasm"\s*:\s*\{[^}]*"encoding"\s*:\s*"gzip-base64"') { $errors.Add("ffmpeg.wasm must be embedded with gzip-base64 encoding.") }
if ($content -notmatch 'new\s+DecompressionStream\(["'']gzip["'']\)') { $errors.Add("The gzip decompressor for ffmpeg.wasm was not found.") }
if ($content -match 'EMBEDDED_ASSET_BUNDLE_BASE64') { $errors.Add("Outer Base64 asset bundle wrapper must not be present.") }
if ($content -notmatch '__FFMPEG_WASM_PROGRESS__') { $errors.Add("Compact runner progress marker was not found.") }
if ($content -match '@ffmpeg/core|ffmpeg-core\.js|libx265') { $errors.Add("Legacy FFmpeg runtime/codec references remain in the standalone output.") }
if ($content -notmatch 'VP9\s*/\s*WebM') { $errors.Add("VP9 / WebM output UI was not found.") }
if ($content -notmatch 'H\.264\s*/\s*MP4') { $errors.Add("H.264 / MP4 output UI was not found.") }

if ($errors.Count -gt 0) {
  $errors | ForEach-Object { Write-Error $_ }
  throw "Standalone verification failed with $($errors.Count) error(s)."
}

Write-Host "[OK] Standalone verification passed: $fullPath" -ForegroundColor Green
