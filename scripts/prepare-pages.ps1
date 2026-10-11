param()

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Dist = Join-Path $Root "dist"
$Pages = Join-Path $Root "pages-dist"
$MtPages = Join-Path $Pages "mt"
$WorkerSource = Join-Path $Root "vendor\coi-serviceworker\coi-serviceworker.js"
$LockPath = Join-Path $Root "coi-serviceworker.lock.json"

function Get-FileSha256Hex([string]$Path) {
  $algorithm = [System.Security.Cryptography.SHA256]::Create()
  $stream = [System.IO.File]::OpenRead($Path)
  try {
    return (($algorithm.ComputeHash($stream) | ForEach-Object { $_.ToString("x2") }) -join "")
  } finally {
    $stream.Dispose()
    $algorithm.Dispose()
  }
}

foreach ($path in @((Join-Path $Dist "index.html"), (Join-Path $Dist "index.mt.html"), $WorkerSource, $LockPath)) {
  if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { throw "Missing GitHub Pages input: $path" }
}

$lock = Get-Content -Raw -Encoding UTF8 -LiteralPath $LockPath | ConvertFrom-Json
if ([string]$lock.version -ne "0.1.7" -or [string]$lock.license -ne "MIT") {
  throw "Unexpected GitHub Pages isolation helper pin or license."
}
if ((Get-FileSha256Hex $WorkerSource) -ne ([string]$lock.sha256).ToLowerInvariant()) {
  throw "Vendored coi-serviceworker.js differs from the pinned SHA-256."
}

# Preserve every existing dist URL (raw MT HTML, self-extract copies, manifests, etc.).
# Stage the GitHub Pages-only /mt/ entry separately from the portable distributions.
if (Test-Path -LiteralPath $Pages) { Remove-Item -LiteralPath $Pages -Recurse -Force }
New-Item -ItemType Directory -Force -Path $Pages | Out-Null
Get-ChildItem -LiteralPath $Dist -Force | ForEach-Object {
  Copy-Item -LiteralPath $_.FullName -Destination $Pages -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $MtPages | Out-Null
Copy-Item -LiteralPath $WorkerSource -Destination (Join-Path $MtPages "coi-serviceworker.js") -Force

$mtOriginal = [System.IO.File]::ReadAllText((Join-Path $Dist "index.mt.html"), [System.Text.Encoding]::UTF8)
if ($mtOriginal.Contains("coi-serviceworker.js")) {
  throw "The original single-file MT distribution must remain independent of coi-serviceworker."
}

# The original standalone CSP intentionally has no 'self' script/worker permission.
# Only this GitHub Pages entry point may load/register the same-origin COI helper.
$scriptOld = "script-src 'unsafe-inline' 'wasm-unsafe-eval' blob:"
$scriptNew = "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' blob:"
$workerOld = "worker-src blob:"
$workerNew = "worker-src 'self' blob:"
if (([regex]::Matches($mtOriginal, [regex]::Escape($scriptOld))).Count -ne 1 -or
    ([regex]::Matches($mtOriginal, [regex]::Escape($workerOld))).Count -ne 1) {
  throw "The MT CSP contract changed. Review the Pages-only CSP extension."
}
$mtHtml = $mtOriginal.Replace($scriptOld, $scriptNew).Replace($workerOld, $workerNew)

$bootstrap = @'
  <!-- GitHub Pages only: COOP/COEP fallback is scoped to /mt/ and is never embedded in the standalone file. -->
  <script>
    if (window.crossOriginIsolated === false) {
      window.coi = {
        coepCredentialless: () => false,
        coepDegrade: () => false,
        quiet: true
      };
      const coiScript = document.createElement("script");
      coiScript.src = "./coi-serviceworker.js";
      document.head.appendChild(coiScript);
    }
  </script>
'@
if (([regex]::Matches($mtHtml, [regex]::Escape("</head>"))).Count -ne 1) {
  throw "The MT HTML must have exactly one closing head element."
}
$mtHtml = $mtHtml.Replace("</head>", $bootstrap + [Environment]::NewLine + "</head>")
[System.IO.File]::WriteAllText((Join-Path $MtPages "index.html"), $mtHtml, (New-Object System.Text.UTF8Encoding($false)))

if (-not (Test-Path -LiteralPath (Join-Path $Pages ".nojekyll"))) {
  [System.IO.File]::WriteAllText((Join-Path $Pages ".nojekyll"), "", (New-Object System.Text.UTF8Encoding($false)))
}

Write-Host "[OK] GitHub Pages site staged: $Pages" -ForegroundColor Green
Write-Host "  /    -> portable Single-thread build (all existing dist paths preserved)"
Write-Host "  /mt/ -> Multi-thread Pages entry + scoped same-origin COI Service Worker"
