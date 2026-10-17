# ===============================================================================
#       AI-Based Knowledge Retrieval Platform with Query Resolution
#                       Autonomous Multi-Agent System
# ===============================================================================

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  AI Knowledge Retrieval Platform - Launching Local Services" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# 1. Python Dependencies
Write-Host "`n[1/3] Verifying Python dependencies..." -ForegroundColor Yellow
python -m pip install -r backend/requirements.txt

# 2. Frontend Dependencies
Write-Host "`n[2/3] Verifying Node.js dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "frontend/node_modules")) {
    Set-Location "frontend"
    npm install
    Set-Location $root
}

# 3. Launch Backend & Frontend
Write-Host "`n[3/3] Starting Backend and Frontend..." -ForegroundColor Yellow
$backendProcess = Start-Process -FilePath "python" -ArgumentList "backend/run_backend.py" -WorkingDirectory $root -PassThru -NoNewWindow
Start-Sleep -Seconds 3

Write-Host "Starting Vite frontend dev server..." -ForegroundColor Green
Set-Location "frontend"
Start-Process -FilePath "npm" -ArgumentList "run dev" -WorkingDirectory "$root/frontend"

Write-Host "`n=================================================================" -ForegroundColor Green
Write-Host "  Application is ready!" -ForegroundColor Green
Write-Host "  Frontend URL:     http://localhost:5173" -ForegroundColor Cyan
Write-Host "  Backend API:      http://localhost:8000" -ForegroundColor Cyan
Write-Host "  API Swagger Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "=================================================================`n" -ForegroundColor Green
