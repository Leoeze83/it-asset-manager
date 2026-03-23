param(
  [ValidateSet("Purge", "Status")]
  [string]$Mode = "Purge"
)

$ErrorActionPreference = "Stop"

$taskNames = @(
  "AssetFlowSecureAgent",
  "AssetFlowAgent",
  "AssetFlowSecureAgentLegacy"
)

$pathsToRemove = @(
  (Join-Path $env:ProgramData "AssetFlow"),
  (Join-Path $env:ProgramData "AssetFlowAgent"),
  (Join-Path $env:ProgramFiles "AssetFlowAgent"),
  (Join-Path ${env:ProgramFiles(x86)} "AssetFlowAgent"),
  (Join-Path $env:LocalAppData "AssetFlow"),
  (Join-Path $env:AppData "AssetFlow")
)

function Assert-Administrator {
  $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = New-Object Security.Principal.WindowsPrincipal($identity)
  if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw "Run PowerShell as Administrator for this operation."
  }
}

function Remove-Tasks {
  foreach ($name in $taskNames) {
    $task = Get-ScheduledTask -TaskName $name -ErrorAction SilentlyContinue
    if ($task) {
      try {
        Stop-ScheduledTask -TaskName $name -ErrorAction SilentlyContinue
      } catch {
      }
      Unregister-ScheduledTask -TaskName $name -Confirm:$false -ErrorAction SilentlyContinue
      Write-Host "Removed task: $name"
    }
  }
}

function Remove-Traces {
  foreach ($path in $pathsToRemove) {
    if (-not [string]::IsNullOrWhiteSpace($path) -and (Test-Path $path)) {
      Remove-Item $path -Recurse -Force -ErrorAction SilentlyContinue
      Write-Host "Removed path: $path"
    }
  }

  Remove-Item -Path "HKLM:\SOFTWARE\AssetFlow" -Recurse -Force -ErrorAction SilentlyContinue
  Remove-Item -Path "HKLM:\SOFTWARE\WOW6432Node\AssetFlow" -Recurse -Force -ErrorAction SilentlyContinue
}

function Show-Status {
  Write-Host "== AssetFlow cleanup status =="
  foreach ($name in $taskNames) {
    $task = Get-ScheduledTask -TaskName $name -ErrorAction SilentlyContinue
    if ($task) {
      Write-Host "Task present: $name"
    } else {
      Write-Host "Task absent: $name"
    }
  }

  foreach ($path in $pathsToRemove) {
    if (-not [string]::IsNullOrWhiteSpace($path) -and (Test-Path $path)) {
      Write-Host "Path present: $path"
    } else {
      Write-Host "Path absent: $path"
    }
  }
}

switch ($Mode) {
  "Purge" {
    Assert-Administrator
    Remove-Tasks
    Remove-Traces
    Write-Host "AssetFlow cleanup completed."
  }
  "Status" {
    Show-Status
  }
}
