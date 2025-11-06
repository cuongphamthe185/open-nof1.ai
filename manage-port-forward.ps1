# WSL2 Port Forwarding Manager
param(
    [switch]$Clean,
    [switch]$Help
)

function Write-Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Write-Success($msg) { Write-Host "    OK $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "    ! $msg" -ForegroundColor Yellow }
function Write-Err($msg) { Write-Host "    X $msg" -ForegroundColor Red }
function Write-Info($msg) { Write-Host "    $msg" -ForegroundColor White }

if ($Help) {
    Write-Host ""
    Write-Host "WSL2 Port Forwarding Manager"
    Write-Host "Usage: .\manage-port-forward.ps1 [-Clean] [-Help]"
    Write-Host ""
    exit 0
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "    WSL2 Port 3000 Forwarding Manager" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Err "Must run as Administrator!"
    exit 1
}

Write-Step "Step 1: Check existing rules"
$existing = netsh interface portproxy show all | Select-String "3000"
if ($existing) {
    Write-Warn "Found existing port 3000 rules"
} else {
    Write-Info "No existing rules"
}

if ($Clean) {
    Write-Step "Step 2: Removing port 3000 rules"
    netsh interface portproxy delete v4tov4 listenport=3000 listenaddress=0.0.0.0 2>&1 | Out-Null
    netsh interface portproxy delete v4tov4 listenport=3000 listenaddress=127.0.0.1 2>&1 | Out-Null
    Write-Success "Rules removed"
    Write-Host ""
    netsh interface portproxy show all
    Write-Host ""
    Write-Host "Cleanup complete!" -ForegroundColor Green
    exit 0
}

Write-Step "Step 2: Remove old rules"
netsh interface portproxy delete v4tov4 listenport=3000 listenaddress=0.0.0.0 2>&1 | Out-Null
netsh interface portproxy delete v4tov4 listenport=3000 listenaddress=127.0.0.1 2>&1 | Out-Null
Write-Success "Old rules removed"

Write-Step "Step 3: Get network info"
try {
    $wslIp = (wsl hostname -I).Trim().Split()[0]
    if (-not $wslIp) { throw "No WSL IP" }
    Write-Success "WSL IP: $wslIp"
} catch {
    Write-Err "Cannot get WSL IP"
    exit 1
}

Write-Info "Analyzing adapters..."
$adapters = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.IPAddress -ne '127.0.0.1'
}

Write-Host ""
Write-Info "Available adapters:"
$adapters | ForEach-Object {
    $a = Get-NetAdapter -InterfaceIndex $_.InterfaceIndex
    Write-Host "    [$($_.InterfaceIndex)] $($a.InterfaceDescription) - $($_.IPAddress)"
}

$primary = $adapters | Where-Object {
    $a = Get-NetAdapter -InterfaceIndex $_.InterfaceIndex
    $a.Status -eq 'Up' -and
    $a.InterfaceDescription -notmatch 'WSL|Tailscale|Virtual|Hyper-V|VPN|Bluetooth'
} | Select-Object -First 1

if (-not $primary) {
    $primary = $adapters | Where-Object {
        $a = Get-NetAdapter -InterfaceIndex $_.InterfaceIndex
        $a.Status -eq 'Up'
    } | Select-Object -First 1
}

if (-not $primary) {
    Write-Err "No adapter found"
    exit 1
}

$primaryIp = $primary.IPAddress
$primaryName = (Get-NetAdapter -InterfaceIndex $primary.InterfaceIndex).InterfaceDescription
Write-Success "Primary: $primaryName"
Write-Info "IP: $primaryIp"

$tailscale = $adapters | Where-Object {
    $a = Get-NetAdapter -InterfaceIndex $_.InterfaceIndex
    $a.InterfaceDescription -match 'Tailscale'
}
$tailscaleIp = if ($tailscale) { $tailscale.IPAddress } else { $null }
if ($tailscaleIp) {
    Write-Success "Tailscale: $tailscaleIp"
}

Write-Step "Step 4: Create port forwarding"
Write-Info "Rule: 0.0.0.0:3000 -> $wslIp:3000"

$result = netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=$wslIp

if ($LASTEXITCODE -eq 0) {
    Write-Success "Port forwarding created"
} else {
    Write-Err "Failed to create rule"
    exit 1
}

Write-Step "Step 5: Configure firewall"
$ruleName = "WSL2-NOF1-Port-3000"
Remove-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue 2>&1 | Out-Null

try {
    New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow -Profile Any -ErrorAction Stop | Out-Null
    Write-Success "Firewall rule created"
} catch {
    Write-Warn "Firewall rule may exist"
}

Write-Step "Verification"
Write-Info "Current rules:"
netsh interface portproxy show all | Where-Object { $_ -match "3000" } | ForEach-Object {
    Write-Host "    $_" -ForegroundColor Green
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "    Setup Complete!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Access URLs:" -ForegroundColor Yellow
Write-Host "  Localhost:  http://localhost:3000"
Write-Host "  LAN:        http://$primaryIp:3000"
if ($tailscaleIp) {
    Write-Host "  Tailscale:  http://$tailscaleIp:3000"
}
Write-Host "  WSL Direct: http://$wslIp:3000"
Write-Host ""
Write-Host "Management:" -ForegroundColor Yellow
Write-Host "  View rules:   netsh interface portproxy show all"
Write-Host "  Remove rules: .\manage-port-forward.ps1 -Clean"
Write-Host ""
Write-Host "Done!" -ForegroundColor Green
Write-Host ""
