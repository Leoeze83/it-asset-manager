param(
  [string]$Version = "2.1.0",
  [string]$Configuration = "Release"
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "../..")
$wxsPath = Join-Path $repoRoot "packaging/msi/AssetFlow.Agent.wxs"
$cleanupWxsPath = Join-Path $repoRoot "packaging/msi/AssetFlow.Agent.Cleanup.wxs"
$outputDir = Join-Path $repoRoot "dist/msi"
$downloadsDir = Join-Path $repoRoot "public/downloads"

$wixCmd = $null
$wixCommandInfo = Get-Command wix -ErrorAction SilentlyContinue
if ($wixCommandInfo) {
  $wixCmd = $wixCommandInfo.Source
}

if (-not $wixCmd) {
  $knownWixPaths = @(
    "C:\Program Files\WiX Toolset v6.0\bin\wix.exe",
    "C:\Program Files\WiX Toolset v5.0\bin\wix.exe",
    "C:\Program Files\WiX Toolset v4.0\bin\wix.exe"
  )

  foreach ($candidate in $knownWixPaths) {
    if (Test-Path $candidate) {
      $wixCmd = $candidate
      break
    }
  }
}

if (-not $wixCmd) {
  throw "WiX toolset no encontrado. Instala con: winget install --id WiXToolset.WiXCLI --exact"
}

if (-not (Test-Path $outputDir)) {
  New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

if (-not (Test-Path $downloadsDir)) {
  New-Item -ItemType Directory -Path $downloadsDir -Force | Out-Null
}

Push-Location $outputDir
try {
  & $wixCmd build $wxsPath -define Version=$Version -o "AssetFlow-Agent-Installer.msi"
  if ($LASTEXITCODE -ne 0) {
    throw "Fallo la compilacion de AssetFlow-Agent-Installer.msi"
  }
  Write-Host "MSI generado en: $outputDir/AssetFlow-Agent-Installer.msi"
  & $wixCmd build $cleanupWxsPath -define Version=$Version -o "AssetFlow-Agent-Uninstaller.msi"
  if ($LASTEXITCODE -ne 0) {
    throw "Fallo la compilacion de AssetFlow-Agent-Uninstaller.msi"
  }
  Write-Host "MSI generado en: $outputDir/AssetFlow-Agent-Uninstaller.msi"

  $installerPath = Join-Path $outputDir "AssetFlow-Agent-Installer.msi"
  $uninstallerPath = Join-Path $outputDir "AssetFlow-Agent-Uninstaller.msi"

  if (-not (Test-Path $installerPath)) {
    throw "No se genero $installerPath"
  }

  if (-not (Test-Path $uninstallerPath)) {
    throw "No se genero $uninstallerPath"
  }

  Copy-Item -Force $installerPath (Join-Path $downloadsDir "AssetFlow-Agent-Installer.msi")
  Copy-Item -Force $uninstallerPath (Join-Path $downloadsDir "AssetFlow-Agent-Uninstaller.msi")

  Write-Host "MSI publicado en: $downloadsDir/AssetFlow-Agent-Installer.msi"
  Write-Host "MSI publicado en: $downloadsDir/AssetFlow-Agent-Uninstaller.msi"
} finally {
  Pop-Location
}
