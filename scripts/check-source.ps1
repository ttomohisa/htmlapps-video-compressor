param(
  [string]$Root = ""
)

$ErrorActionPreference = "Stop"
if ([string]::IsNullOrWhiteSpace($Root)) { $Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path) }
$Root = [System.IO.Path]::GetFullPath($Root)

$targets = @(
  (Join-Path $Root "src"),
  (Join-Path $Root "scripts"),
  (Join-Path $Root "build-standalone.ps1"),
  (Join-Path $Root "build-standalone.bat"),
  (Join-Path $Root "app.config.json"),
  (Join-Path $Root "dependencies.json")
)

$files = foreach ($target in $targets) {
  if (Test-Path $target -PathType Container) {
    Get-ChildItem -Path $target -Recurse -File
  } elseif (Test-Path $target -PathType Leaf) {
    Get-Item $target
  }
}

$patterns = @(
  @{ Label = "remote URL"; Regex = 'https?://' },
  @{ Label = "fetch"; Regex = '\bfetch\s*\(' },
  @{ Label = "XHR"; Regex = '\bXMLHttpRequest\b' },
  @{ Label = "WebSocket"; Regex = '\bWebSocket\b' },
  @{ Label = "EventSource"; Regex = '\bEventSource\b' },
  @{ Label = "dynamic import"; Regex = '\bimport\s*\(' },
  @{ Label = "importScripts"; Regex = '\bimportScripts\s*\(' }
)

$hits = New-Object System.Collections.Generic.List[string]
foreach ($file in $files) {
  if ($file.Extension -notin @(".html", ".js", ".mjs", ".css", ".ps1", ".bat", ".json")) { continue }
  $lineNumber = 0
  foreach ($line in Get-Content -Encoding UTF8 $file.FullName) {
    $lineNumber++
    foreach ($pattern in $patterns) {
      if ($line -match $pattern.Regex) {
        $relative = $file.FullName.Substring($Root.Length).TrimStart([char[]]@([char]92, [char]47))
        $hits.Add("$relative`:$lineNumber [$($pattern.Label)] $($line.Trim())")
      }
    }
  }
}

$allowed = @(
  'build-standalone.ps1',
  'app.config.json',
  'dependencies.json',
  'scripts\\check-source.ps1',
  'scripts/check-source.ps1',
  'schemas\\',
  'schemas/'
)
$unexpected = @($hits | Where-Object {
  $hit = $_
  -not ($allowed | Where-Object { $hit.StartsWith($_, [System.StringComparison]::OrdinalIgnoreCase) })
})

if ($unexpected.Count -gt 0) {
  $unexpected | ForEach-Object { Write-Error $_ }
  throw "Source network check failed with $($unexpected.Count) unexpected hit(s)."
}

Write-Host "[OK] Source network check passed. Expected build-time URLs only." -ForegroundColor Green
