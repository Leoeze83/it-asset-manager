AssetFlow Agent MSI package contents

- assetflow-agent.ps1: secure installer script

Release process:
1) Replace assetflow-agent.ps1 with the latest production script.
2) Run tools/msi/build-agent-msi.ps1.
3) Publish dist/msi/AssetFlow-Agent-Installer.msi.
