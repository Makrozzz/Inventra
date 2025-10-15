# Inventra Backend Server Starter
Write-Host "Starting Inventra Backend Server..." -ForegroundColor Green
Write-Host "Current Directory: $(Get-Location)" -ForegroundColor Yellow

# Ensure we are in the backend directory
$backendPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $backendPath
Write-Host "Changed to: $(Get-Location)" -ForegroundColor Yellow

# Check if server.js exists
if (Test-Path "server.js") {
    Write-Host "Found server.js, starting server..." -ForegroundColor Green
    Write-Host "Server will be available at: http://localhost:5000" -ForegroundColor Cyan
    Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Red
    Write-Host ""
    
    # Start the server
    node server.js
} else {
    Write-Host "server.js not found in current directory!" -ForegroundColor Red
    Write-Host "Current files:" -ForegroundColor Yellow
    Get-ChildItem -Name
    pause
}