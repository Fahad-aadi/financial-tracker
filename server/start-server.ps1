# Start-Server.ps1 - Script to start the Financial Tracker server with proper configuration

# Set environment variables
$env:NODE_ENV = "development"
$env:DEBUG = "*"

# Print configuration
Write-Host "=== Starting Financial Tracker Server ===" -ForegroundColor Cyan
Write-Host "Environment: $($env:NODE_ENV)"
Write-Host "Node.js Version: $(node -v)"
Write-Host "Current directory: $(Get-Location)"

# Check if node_modules exists
if (-not (Test-Path "./node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Check if data directory exists
if (-not (Test-Path "./data")) {
    Write-Host "Creating data directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path "./data" | Out-Null
}

# Check if database file exists
$dbPath = "./data/financial_tracker.db"
if (-not (Test-Path $dbPath)) {
    Write-Host "Initializing database..." -ForegroundColor Yellow
    # Create an empty database file
    $null = New-Item -ItemType File -Path $dbPath -Force
    Write-Host "Database file created at: $((Resolve-Path $dbPath))"
}

# Start the server
Write-Host "`nStarting server..." -ForegroundColor Green
node sqlite-server.js
