@echo off
title AI-Based Knowledge Retrieval Platform
color 0b

echo ===============================================================================
echo       AI-Based Knowledge Retrieval Platform with Query Resolution
echo                       Autonomous Multi-Agent System
echo ===============================================================================
echo.

cd /d "%~dp0"

echo [1/3] Checking Python dependencies...
python -m pip install -r backend/requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install Python dependencies. Ensure Python 3.10+ is installed.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/3] Checking Node.js dependencies for Frontend...
cd frontend
if not exist node_modules (
    echo Installing frontend npm packages...
    call npm install
)
cd ..

echo.
echo [3/3] Launching Backend & Frontend Servers...
echo Starting FastAPI Backend on http://localhost:8000 ...
start "AetherRAG Backend" cmd /k "set PYTHONPATH=backend && python backend/run_backend.py"

timeout /t 3 /nobreak >nul

echo Starting Vite Frontend on http://localhost:5173 ...
start "AetherRAG Frontend" cmd /k "cd frontend && npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo ===============================================================================
echo   System launched successfully!
echo   Frontend UI: http://localhost:5173 (Dev) or http://localhost:8000 (Production)
echo   FastAPI API Docs: http://localhost:8000/docs
echo ===============================================================================
echo.
pause
