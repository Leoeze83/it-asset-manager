param(
  [string]$Version = "2.1.0",
  [string]$Configuration = "Release"
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "../..")
$wxsPath = Join-Path $repoRoot "packaging/msi/AssetFlow.Agent.wxs"
$outputDir = Join-Path $repoRoot "dist/msi"

if (-not (Get-Command wix -ErrorAction SilentlyContinue)) {
  throw "WiX toolset no encontrado. Instala con: dotnet tool install --global wix"
}

if (-not (Test-Path $outputDir)) {
  New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

Push-Location $outputDir
try {
  wix build $wxsPath -define Version=$Version -o "AssetFlow-Agent-Installer.msi"
  Write-Host "MSI generado en: $outputDir/AssetFlow-Agent-Installer.msi"
} finally {
  Pop-Location
}
