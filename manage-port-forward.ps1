# ============================================
# WSL2 Port Forwarding Manager for Port 3000
# Automatically detects and configures port forwarding
# ============================================

param(
    [switch]$Clean,
    [switch]$Help
)

# Colors for output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Step($message) {
    Write-ColorOutput Cyan "`n==> $message"
}

function Write-Success($message) {
    Write-ColorOutput Green "    ✓ $message"
}

function Write-Warning($message) {
    Write-ColorOutput Yellow "    ! $message"
}

function Write-Error($message) {
    Write-ColorOutput Red "    ✗ $message"
}

function Write-Info($message) {
    Write-ColorOutput White "    $message"
}

# Help
if ($Help) {
    Write-Host @"
WSL2 Port Forwarding Manager

Usage:
    .\manage-port-forward.ps1           - Setup port forwarding
    .\manage-port-forward.ps1 -Clean    - Remove all port 3000 forwarding
    .\manage-port-forward.ps1 -Help     - Show this help

Description:
    This script manages port forwarding for WSL2 applications running on port 3000.
    It automatically detects the main network adapter and WSL IP, then configures
    Windows port forwarding to make the app accessible from other machines.

Examples:
    # Setup port forwarding
    .\manage-port-forward.ps1

    # Clean up (remove all port 3000 rules)
    .\manage-port-forward.ps1 -Clean

"@
    exit 0
}

Write-Host ""
Write-ColorOutput Cyan "=================================================="
Write-ColorOutput Cyan "    WSL2 Port 3000 Forwarding Manager"
Write-ColorOutput Cyan "=================================================="
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Error "This script must be run as Administrator!"
    Write-Info "Right-click PowerShell and select 'Run as Administrator'"
    exit 1
}

# ============================================
# Step 1: Check existing port forwarding
# ============================================
Write-Step "Step 1: Checking existing port forwarding rules..."

$existingRules = netsh interface portproxy show all | Select-String "3000"

if ($existingRules) {
    Write-Warning "Found existing port 3000 forwarding rules:"
    $existingRules | ForEach-Object { Write-Info $_ }
} else {
    Write-Info "No existing port 3000 forwarding rules found"
}

# ============================================
# Step 2: Remove existing port 3000 forwarding
# ============================================
if ($Clean) {
    Write-Step "Step 2: Removing all port 3000 forwarding rules..."
    
    # Remove IPv4
    $result = netsh interface portproxy delete v4tov4 listenport=3000 listenaddress=0.0.0.0 2>&1
    
    # Try all common listen addresses
    @("0.0.0.0", "127.0.0.1", "*") | ForEach-Object {
        netsh interface portproxy delete v4tov4 listenport=3000 listenaddress=$_ 2>&1 | Out-Null
    }
    
    Write-Success "Port forwarding rules removed"
    
    # Show remaining rules
    Write-Step "Verification: Current port forwarding rules:"
    netsh interface portproxy show all
    
    Write-Host ""
    Write-ColorOutput Green "✓ Cleanup complete!"
    Write-Host ""
    exit 0
}

Write-Step "Step 2: Removing old port 3000 forwarding rules..."

# Remove all possible combinations
@("0.0.0.0", "127.0.0.1") | ForEach-Object {
    netsh interface portproxy delete v4tov4 listenport=3000 listenaddress=$_ 2>&1 | Out-Null
}

Write-Success "Old rules removed"

# ============================================
# Step 3: Get network information
# ============================================
Write-Step "Step 3: Detecting network configuration..."

# Get WSL IP address
try {
    $wslIp = (wsl hostname -I).Trim().Split()[0]
    if (-not $wslIp) {
        throw "Could not get WSL IP"
    }
    Write-Success "WSL IP detected: $wslIp"
} catch {
    Write-Error "Failed to get WSL IP address"
    Write-Info "Make sure WSL is running: wsl --status"
    exit 1
}

# Get all network adapters with IPv4
Write-Info "Analyzing network adapters..."
$adapters = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.IPAddress -ne '127.0.0.1' -and 
    $_.PrefixOrigin -eq 'Manual' -or $_.PrefixOrigin -eq 'Dhcp'
}

Write-Host ""
Write-Info "Available network adapters:"
$adapters | ForEach-Object {
    $adapter = Get-NetAdapter -InterfaceIndex $_.InterfaceIndex
    Write-Host ("    [{0}] {1,-30} IP: {2}" -f $_.InterfaceIndex, $adapter.InterfaceDescription, $_.IPAddress)
}
Write-Host ""

# Determine primary adapter (exclude WSL, Tailscale, virtual adapters)
$primaryAdapter = $adapters | Where-Object {
    $adapter = Get-NetAdapter -InterfaceIndex $_.InterfaceIndex
    $adapter.Status -eq 'Up' -and
    $adapter.InterfaceDescription -notmatch 'WSL|Tailscale|Virtual|Hyper-V|VPN|Bluetooth|Loopback' -and
    $_.IPAddress -match '^\d+\.\d+\.\d+\.\d+$' -and
    -not ($_.IPAddress -match '^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.16\.|169\.254\.)')
} | Select-Object -First 1

if (-not $primaryAdapter) {
    Write-Warning "Could not auto-detect primary adapter, using first available adapter"
    $primaryAdapter = $adapters | Where-Object {
        $adapter = Get-NetAdapter -InterfaceIndex $_.InterfaceIndex
        $adapter.Status -eq 'Up'
    } | Select-Object -First 1
}

if (-not $primaryAdapter) {
    Write-Error "No suitable network adapter found!"
    Write-Info "Available adapters listed above. Exiting..."
    exit 1
}

$primaryInterface = Get-NetAdapter -InterfaceIndex $primaryAdapter.InterfaceIndex
$primaryIP = $primaryAdapter.IPAddress

Write-Success "Selected primary adapter:"
Write-Info "Interface: $($primaryInterface.InterfaceDescription)"
Write-Info "IP Address: $primaryIP"
Write-Info "Status: $($primaryInterface.Status)"

# Get Tailscale IP (if available)
$tailscaleAdapter = $adapters | Where-Object {
    $adapter = Get-NetAdapter -InterfaceIndex $_.InterfaceIndex
    $adapter.InterfaceDescription -match 'Tailscale'
}

if ($tailscaleAdapter) {
    $tailscaleIP = $tailscaleAdapter.IPAddress
    Write-Success "Tailscale IP detected: $tailscaleIP"
} else {
    Write-Info "Tailscale not detected (optional)"
}

# ============================================
# Step 4: Configure port forwarding
# ============================================
Write-Step "Step 4: Configuring port forwarding..."

Write-Info "Creating port forwarding rule:"
Write-Info "Listen on all interfaces (0.0.0.0:3000)"
Write-Info "Forward to WSL: $wslIp:3000"
Write-Host ""

# Add port forwarding rule
$result = netsh interface portproxy add v4tov4 `
    listenport=3000 `
    listenaddress=0.0.0.0 `
    connectport=3000 `
    connectaddress=$wslIp

if ($LASTEXITCODE -eq 0) {
    Write-Success "Port forwarding rule created successfully!"
} else {
    Write-Error "Failed to create port forwarding rule"
    Write-Info "Error: $result"
    exit 1
}

# ============================================
# Step 5: Configure Windows Firewall
# ============================================
Write-Step "Step 5: Configuring Windows Firewall..."

$firewallRuleName = "WSL2-NOF1-Trading-Bot-Port-3000"

# Remove existing rule
Remove-NetFirewallRule -DisplayName $firewallRuleName -ErrorAction SilentlyContinue 2>&1 | Out-Null

# Add new firewall rule
try {
    New-NetFirewallRule -DisplayName $firewallRuleName `
        -Direction Inbound `
        -LocalPort 3000 `
        -Protocol TCP `
        -Action Allow `
        -Profile Any `
        -ErrorAction Stop | Out-Null
    
    Write-Success "Firewall rule created: $firewallRuleName"
} catch {
    Write-Warning "Failed to create firewall rule (may already exist)"
}

# ============================================
# Verification
# ============================================
Write-Step "Verification: Current configuration"
Write-Host ""

# Show port forwarding rules
Write-Info "Port forwarding rules:"
netsh interface portproxy show all | ForEach-Object {
    if ($_ -match "3000") {
        Write-ColorOutput Green "    $_"
    }
}

Write-Host ""

# ============================================
# Summary
# ============================================
Write-Host ""
Write-ColorOutput Cyan "=================================================="
Write-ColorOutput Green "    ✓ Port Forwarding Setup Complete!"
Write-ColorOutput Cyan "=================================================="
Write-Host ""

Write-ColorOutput Yellow "📡 Access Information:"
Write-Host ""
Write-Info "From localhost:"
Write-Info "    http://localhost:3000"
Write-Host ""

Write-Info "From LAN (Primary network):"
Write-Info "    http://${primaryIP}:3000"
Write-Host ""

if ($tailscaleIP) {
    Write-Info "From Tailscale network:"
    Write-Info "    http://${tailscaleIP}:3000"
    Write-Host ""
}

Write-Info "From WSL IP (direct):"
Write-Info "    http://${wslIp}:3000"
Write-Host ""

Write-ColorOutput Yellow "🔧 Management Commands:"
Write-Host ""
Write-Info "View all port forwarding rules:"
Write-Info "    netsh interface portproxy show all"
Write-Host ""
Write-Info "Remove port 3000 forwarding:"
Write-Info "    .\manage-port-forward.ps1 -Clean"
Write-Host ""
Write-Info "View firewall rules:"
Write-Info "    Get-NetFirewallRule -DisplayName '*3000*'"
Write-Host ""

Write-ColorOutput Yellow "⚠️  Important Notes:"
Write-Host ""
Write-Info "• Port forwarding persists after Windows restart"
Write-Info "• WSL IP may change after 'wsl --shutdown'"
Write-Info "• Re-run this script if WSL IP changes"
Write-Info "• Make sure your app in WSL listens on 0.0.0.0:3000"
Write-Host ""

Write-ColorOutput Green "✓ All done! Your WSL app should now be accessible from the network."
Write-Host ""
