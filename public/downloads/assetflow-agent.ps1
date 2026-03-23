param(
	[ValidateSet("Install", "Run", "Status", "Uninstall", "RefreshNow")]
	[string]$Mode = "Install",
	[string]$BootstrapToken,
	[string]$BaseUrl = "http://localhost:3000"
)

$ErrorActionPreference = "Stop"
$installRoot = Join-Path $env:ProgramData "AssetFlow"
$statePath = Join-Path $installRoot "agent-state.json"
$logPath = Join-Path $installRoot "agent.log"
$taskName = "AssetFlowSecureAgent"
$installedScriptPath = Join-Path $installRoot "assetflow-agent.ps1"
$agentVersion = "3.0.0"
$defaultHeartbeatSeconds = 14400
$commandPollSeconds = 60

function Prompt-AgentConfiguration {
	try {
		Add-Type -AssemblyName System.Windows.Forms | Out-Null
		Add-Type -AssemblyName System.Drawing | Out-Null
	} catch {
		return $null
	}

	$form = New-Object System.Windows.Forms.Form
	$form.Text = "AssetFlow Agent - Configuracion"
	$form.Size = New-Object System.Drawing.Size(560, 240)
	$form.StartPosition = "CenterScreen"
	$form.TopMost = $true

	$label = New-Object System.Windows.Forms.Label
	$label.Location = New-Object System.Drawing.Point(16, 12)
	$label.Size = New-Object System.Drawing.Size(520, 30)
	$label.Text = "Ingresá Base URL y Bootstrap Token para registrar el equipo"
	$form.Controls.Add($label)

	$baseUrlLabel = New-Object System.Windows.Forms.Label
	$baseUrlLabel.Location = New-Object System.Drawing.Point(16, 52)
	$baseUrlLabel.Size = New-Object System.Drawing.Size(180, 20)
	$baseUrlLabel.Text = "Base URL"
	$form.Controls.Add($baseUrlLabel)

	$baseUrlText = New-Object System.Windows.Forms.TextBox
	$baseUrlText.Location = New-Object System.Drawing.Point(16, 72)
	$baseUrlText.Size = New-Object System.Drawing.Size(520, 24)
	$baseUrlText.Text = $BaseUrl
	$form.Controls.Add($baseUrlText)

	$tokenLabel = New-Object System.Windows.Forms.Label
	$tokenLabel.Location = New-Object System.Drawing.Point(16, 104)
	$tokenLabel.Size = New-Object System.Drawing.Size(220, 20)
	$tokenLabel.Text = "Bootstrap Token"
	$form.Controls.Add($tokenLabel)

	$tokenText = New-Object System.Windows.Forms.TextBox
	$tokenText.Location = New-Object System.Drawing.Point(16, 124)
	$tokenText.Size = New-Object System.Drawing.Size(520, 24)
	$tokenText.UseSystemPasswordChar = $true
	$form.Controls.Add($tokenText)

	$okButton = New-Object System.Windows.Forms.Button
	$okButton.Location = New-Object System.Drawing.Point(360, 162)
	$okButton.Size = New-Object System.Drawing.Size(80, 28)
	$okButton.Text = "Aceptar"
	$okButton.DialogResult = [System.Windows.Forms.DialogResult]::OK
	$form.Controls.Add($okButton)

	$cancelButton = New-Object System.Windows.Forms.Button
	$cancelButton.Location = New-Object System.Drawing.Point(456, 162)
	$cancelButton.Size = New-Object System.Drawing.Size(80, 28)
	$cancelButton.Text = "Cancelar"
	$cancelButton.DialogResult = [System.Windows.Forms.DialogResult]::Cancel
	$form.Controls.Add($cancelButton)

	$form.AcceptButton = $okButton
	$form.CancelButton = $cancelButton

	$result = $form.ShowDialog()
	if ($result -ne [System.Windows.Forms.DialogResult]::OK) {
		throw "Instalacion cancelada por el usuario."
	}

	$newBaseUrl = $baseUrlText.Text.Trim()
	$newToken = $tokenText.Text.Trim()

	if ([string]::IsNullOrWhiteSpace($newBaseUrl)) {
		throw "Base URL is required."
	}

	if ([string]::IsNullOrWhiteSpace($newToken)) {
		throw "Bootstrap token is required."
	}

	return @{ BaseUrl = $newBaseUrl; BootstrapToken = $newToken }
}

function Write-Log([string]$message) {
	if (-not (Test-Path $installRoot)) {
		New-Item -ItemType Directory -Path $installRoot -Force | Out-Null
	}

	$line = "$(Get-Date -Format o) $message"
	Write-Host $line
	Add-Content -Path $logPath -Value $line -Encoding UTF8
}

function Assert-Administrator {
	$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
	$principal = New-Object Security.Principal.WindowsPrincipal($identity)
	if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
		throw "Run PowerShell as Administrator for this operation."
	}
}

function Get-AgentState {
	if (-not (Test-Path $statePath)) {
		return $null
	}

	try {
		return Get-Content $statePath -Raw | ConvertFrom-Json
	} catch {
		Write-Log "Invalid agent state file detected, removing it."
		Remove-Item $statePath -Force -ErrorAction SilentlyContinue
		return $null
	}
}

function Save-AgentState($state) {
	if (-not (Test-Path $installRoot)) {
		New-Item -ItemType Directory -Path $installRoot -Force | Out-Null
	}

	$state | ConvertTo-Json -Depth 6 | Set-Content -Path $statePath -Encoding UTF8
}

function Get-PrimaryIPv4 {
	try {
		$candidate = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction Stop |
			Where-Object { $_.IPAddress -ne "127.0.0.1" -and $_.PrefixOrigin -ne "WellKnown" } |
			Select-Object -First 1 -ExpandProperty IPAddress
		return $candidate
	} catch {
		return $null
	}
}

function Get-RdpEnabled {
	try {
		$denyTs = Get-ItemPropertyValue -Path "HKLM:\SYSTEM\CurrentControlSet\Control\Terminal Server" -Name "fDenyTSConnections" -ErrorAction Stop
		return ($denyTs -eq 0)
	} catch {
		return $false
	}
}

function Register-Agent([string]$token) {
	if ([string]::IsNullOrWhiteSpace($token)) {
		throw "Bootstrap token is required for registration."
	}

	$hostname = $env:COMPUTERNAME
	$os = (Get-CimInstance Win32_OperatingSystem).Caption
	$serial = (Get-CimInstance Win32_Bios).SerialNumber
	$cpuName = (Get-CimInstance Win32_Processor | Select-Object -First 1 -ExpandProperty Name)
	$ramGb = [Math]::Round(((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB), 2)

	$body = @{
		hostname = $hostname
		os = $os
		serialNumber = $serial
		type = "Laptop"
		specs = "CPU: $cpuName; RAM: $ramGb GB"
		agentVersion = $agentVersion
	} | ConvertTo-Json

	$headers = @{ "x-agent-bootstrap-token" = $token }
	$response = Invoke-RestMethod -Uri "$BaseUrl/api/agent/register" -Method Post -Headers $headers -Body $body -ContentType "application/json"

	$state = @{
		id = $response.id
		key = $response.agentKey
		registeredAt = (Get-Date -Format o)
		heartbeatIntervalSeconds = [Math]::Max([int]$response.intervalSeconds, 300)
		nextHeartbeatAt = (Get-Date).AddSeconds(10).ToString("o")
		serverBaseUrl = $BaseUrl
	}

	Save-AgentState $state
	Write-Log "Agent registered successfully with id $($state.id)."
	return $state
}

function Send-Heartbeat($state) {
	$cpu = (Get-CimInstance Win32_Processor | Measure-Object -Property LoadPercentage -Average).Average
	$totalMemory = [double](Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory
	$freeMemory = [double](Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory * 1KB
	$ramUsed = if ($totalMemory -gt 0) { 100 - (($freeMemory / $totalMemory) * 100) } else { 0 }
	$disk = Get-CimInstance Win32_LogicalDisk | Where-Object { $_.DeviceID -eq "C:" } | Select-Object -First 1
	$diskUsed = if ($disk -and $disk.Size -gt 0) { 100 - (($disk.FreeSpace / $disk.Size) * 100) } else { 0 }
	$uptimeHours = [Math]::Round(((Get-Date) - (Get-CimInstance Win32_OperatingSystem).LastBootUpTime).TotalHours, 2)

	$body = @{
		id = $state.id
		hostname = $env:COMPUTERNAME
		os = (Get-CimInstance Win32_OperatingSystem).Caption
		ipv4 = Get-PrimaryIPv4
		cpu = [Math]::Round($cpu, 2)
		ram = [Math]::Round($ramUsed, 2)
		disk = [Math]::Round($diskUsed, 2)
		uptimeHours = $uptimeHours
		rdpEnabled = (Get-RdpEnabled)
	} | ConvertTo-Json

	$headers = @{
		"x-agent-id" = $state.id
		"x-agent-key" = $state.key
	}

	$response = Invoke-RestMethod -Uri "$BaseUrl/api/agent/heartbeat" -Method Post -Headers $headers -Body $body -ContentType "application/json"
	return $response
}

function Poll-ServerCommand($state) {
	$body = @{ id = $state.id } | ConvertTo-Json
	$headers = @{
		"x-agent-id" = $state.id
		"x-agent-key" = $state.key
	}

	return Invoke-RestMethod -Uri "$BaseUrl/api/agent/command" -Method Post -Headers $headers -Body $body -ContentType "application/json"
}

function Install-Agent {
	Assert-Administrator

	Write-Progress -Activity "AssetFlow Agent" -Status "Validando requisitos" -PercentComplete 10

	if ([string]::IsNullOrWhiteSpace($BootstrapToken)) {
		if ([Environment]::UserInteractive) {
			$wizardData = Prompt-AgentConfiguration
			if ($wizardData) {
				$script:BaseUrl = $wizardData.BaseUrl
				$script:BootstrapToken = $wizardData.BootstrapToken
			}
		} else {
			$script:BootstrapToken = Read-Host "Bootstrap token"
		}
	}

	$state = Get-AgentState
	if (-not $state) {
		Write-Progress -Activity "AssetFlow Agent" -Status "Registrando equipo en servidor" -PercentComplete 35
		$state = Register-Agent $script:BootstrapToken
	}

	Write-Progress -Activity "AssetFlow Agent" -Status "Preparando archivos locales" -PercentComplete 55
	if (-not (Test-Path $installRoot)) {
		New-Item -ItemType Directory -Path $installRoot -Force | Out-Null
	}
	Copy-Item -Path $PSCommandPath -Destination $installedScriptPath -Force

	Write-Progress -Activity "AssetFlow Agent" -Status "Configurando servicio en segundo plano" -PercentComplete 80
	$actionArgs = '-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "' + $installedScriptPath + '" -Mode Run -BaseUrl "' + $BaseUrl + '"'
	$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument $actionArgs
	$triggerStartup = New-ScheduledTaskTrigger -AtStartup
	$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
	$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1)

	Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $triggerStartup -Principal $principal -Settings $settings -Force | Out-Null
	Start-ScheduledTask -TaskName $taskName

	Write-Progress -Activity "AssetFlow Agent" -Status "Instalacion completada" -PercentComplete 100
	Write-Progress -Activity "AssetFlow Agent" -Completed

	Write-Host "Agent installed successfully."
	Write-Host "Task name: $taskName"
	Write-Host "State file: $statePath"
	Write-Host "Log file: $logPath"
	Write-Host "Registered asset id: $($state.id)"
}

function Run-Agent {
	$state = Get-AgentState
	if (-not $state) {
		if ([string]::IsNullOrWhiteSpace($BootstrapToken)) {
			Write-Log "No registration state found and no bootstrap token provided. Exiting."
			exit 1
		}
		$state = Register-Agent $BootstrapToken
	}

	if (-not $state.heartbeatIntervalSeconds) {
		$state.heartbeatIntervalSeconds = $defaultHeartbeatSeconds
	}

	Write-Log "Agent worker started. Heartbeat each $($state.heartbeatIntervalSeconds)s, command poll each $commandPollSeconds s."

	while ($true) {
		try {
			$now = Get-Date
			$nextHeartbeatAt = if ($state.nextHeartbeatAt) { [datetime]$state.nextHeartbeatAt } else { $now }

			if ($now -ge $nextHeartbeatAt) {
				$heartbeatResponse = Send-Heartbeat $state
				$state.nextHeartbeatAt = $now.AddSeconds([Math]::Max([int]$state.heartbeatIntervalSeconds, 300)).ToString("o")
				Save-AgentState $state
				Write-Log "Heartbeat sent for asset $($state.id)."

				if ($heartbeatResponse.refreshRequested -eq $true) {
					Write-Log "Server requested immediate refresh. Sending extra heartbeat now."
					Send-Heartbeat $state | Out-Null
					Write-Log "Refresh heartbeat completed."
				}
			}

			$cmd = Poll-ServerCommand $state
			if ($cmd.heartbeatIntervalSeconds) {
				$state.heartbeatIntervalSeconds = [Math]::Max([int]$cmd.heartbeatIntervalSeconds, 300)
			}

			if ($cmd.refreshRequested -eq $true) {
				Write-Log "Received manual refresh command from console."
				Send-Heartbeat $state | Out-Null
				$state.nextHeartbeatAt = (Get-Date).AddSeconds([Math]::Max([int]$state.heartbeatIntervalSeconds, 300)).ToString("o")
			}

			Save-AgentState $state
		} catch {
			$message = $_.Exception.Message
			Write-Log "Worker cycle failed: $message"
			if ($message -match "401|403") {
				Write-Log "Credentials rejected by server. Reinstall the agent to rotate credentials."
			}
		}

		Start-Sleep -Seconds $commandPollSeconds
	}
}

function Show-AgentStatus {
	$task = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
	$state = Get-AgentState

	if ($task) {
		$taskInfo = Get-ScheduledTaskInfo -TaskName $taskName
		Write-Host "Task: Installed ($($task.State))"
		Write-Host "LastRunTime: $($taskInfo.LastRunTime)"
		Write-Host "LastTaskResult: $($taskInfo.LastTaskResult)"
	} else {
		Write-Host "Task: Not installed"
	}

	if ($state) {
		Write-Host "Asset ID: $($state.id)"
		Write-Host "Heartbeat interval: $([Math]::Max([int]$state.heartbeatIntervalSeconds, 300)) seconds"
		Write-Host "RegisteredAt: $($state.registeredAt)"
		Write-Host "NextHeartbeatAt: $($state.nextHeartbeatAt)"
	} else {
		Write-Host "State: Not registered"
	}

	if (Test-Path $logPath) {
		Write-Host "Log: $logPath"
	}
}

function Uninstall-Agent {
	Assert-Administrator

	$taskNames = @(
		$taskName,
		"AssetFlowAgent",
		"AssetFlowSecureAgentLegacy"
	)

	foreach ($name in $taskNames) {
		$task = Get-ScheduledTask -TaskName $name -ErrorAction SilentlyContinue
		if ($task) {
			try {
				Stop-ScheduledTask -TaskName $name -ErrorAction SilentlyContinue
			} catch {
			}
			Unregister-ScheduledTask -TaskName $name -Confirm:$false -ErrorAction SilentlyContinue
		}
	}

	if (Test-Path $installRoot) {
		Remove-Item $installRoot -Recurse -Force -ErrorAction SilentlyContinue
	}

	Remove-Item -Path "HKLM:\SOFTWARE\AssetFlow" -Recurse -Force -ErrorAction SilentlyContinue
	Remove-Item -Path "HKLM:\SOFTWARE\WOW6432Node\AssetFlow" -Recurse -Force -ErrorAction SilentlyContinue

	Write-Host "Agent and local traces removed."
}

function Refresh-Now {
	$state = Get-AgentState
	if (-not $state) {
		throw "Agent state not found. Install first."
	}

	Send-Heartbeat $state | Out-Null
	$state.nextHeartbeatAt = (Get-Date).AddSeconds([Math]::Max([int]$state.heartbeatIntervalSeconds, 300)).ToString("o")
	Save-AgentState $state
	Write-Host "Refresh completed successfully."
}

switch ($Mode) {
	"Install" { Install-Agent }
	"Run" { Run-Agent }
	"Status" { Show-AgentStatus }
	"Uninstall" { Uninstall-Agent }
	"RefreshNow" { Refresh-Now }
}
