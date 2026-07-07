# Builds the Chrome Web Store zip. Run from the repo root:
#   powershell -File scripts/package.ps1
$ErrorActionPreference = "Stop"

$manifest = Get-Content manifest.json -Raw | ConvertFrom-Json
$out = "webshell-v$($manifest.version).zip"

if (Test-Path $out) { Remove-Item $out }

# Only what the extension needs at runtime — no docs, tests, git or scripts.
Compress-Archive -Path manifest.json, _locales, content, background, options, icons -DestinationPath $out

Write-Host "Created $out ($([math]::Round((Get-Item $out).Length / 1KB)) KB)"
