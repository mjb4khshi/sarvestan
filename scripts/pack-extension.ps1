# Pack extension for testers and release - dist only
$ErrorActionPreference = 'Stop'
$root = 'W:\sarv dashboard'
$dist = Join-Path $root 'dist'
$out = Join-Path $root 'sarvestan-extension.zip'
$manifest = Join-Path $dist 'manifest.json'

if (-not (Test-Path $manifest)) {
  Write-Host "ERROR: $manifest not found. Run npm run build first." -ForegroundColor Red
  exit 1
}

if (Test-Path $out) { Remove-Item $out -Force }
# Clean up any nested zip before packing
Get-ChildItem -Path $dist -Filter "*.zip" -ErrorAction SilentlyContinue | Remove-Item -Force
Get-ChildItem -Path (Join-Path $root "public") -Filter "sarvestan-extension.zip" -ErrorAction SilentlyContinue | Remove-Item -Force

$filesToPack = Get-ChildItem -Path $dist -Exclude "*.zip"
Compress-Archive -Path $filesToPack.FullName -DestinationPath $out -Force
$mb = [math]::Round((Get-Item $out).Length / 1MB, 2)

Copy-Item $out (Join-Path $root "public\sarvestan-extension.zip") -Force
Copy-Item $out (Join-Path $dist "sarvestan-extension.zip") -Force

Write-Host "OK: $out ($mb MB) packaged & copied to public and dist."
Write-Host "Testers: unzip -> chrome://extensions -> Load unpacked -> folder with manifest.json"
