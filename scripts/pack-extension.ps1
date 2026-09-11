# Pack extension for testers - dist only
$ErrorActionPreference = 'Stop'
$root = 'W:\sarv dashboard'
$dist = Join-Path $root 'dist'
$out = Join-Path $root 'sarvestan-extension.zip'
$manifest = Join-Path $dist 'manifest.json'
if (-not (Test-Path $manifest)) {
  Write-Host "ERROR: $manifest not found" -ForegroundColor Red
  exit 1
}
if (Test-Path $out) { Remove-Item $out -Force }
Compress-Archive -Path (Join-Path $dist '*') -DestinationPath $out -Force
$mb = [math]::Round((Get-Item $out).Length / 1MB, 2)
Write-Host "OK: $out ($mb MB)"
Write-Host "Testers: unzip -> chrome://extensions -> Load unpacked -> folder with manifest.json"
