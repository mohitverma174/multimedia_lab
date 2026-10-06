@echo off
title EchoMorph Voice Cloning Studio Launcher
echo =====================================================================
echo           EchoMorph - AI Voice Cloning & Speech-to-Speech Studio
echo                 Multimedia Lab Capstone Project
echo =====================================================================
echo.

cd /d "%~dp0"

echo [1/3] Starting Python FastAPI Backend on port 8000...
start "EchoMorph Backend" cmd /k "cd /d %~dp0backend && python run_backend.py"

echo [2/3] Starting Vite React Frontend on port 3000...
start "EchoMorph Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo [3/3] Waiting for servers to initialize...
timeout /t 3 /nobreak >nul

echo Opening browser at http://localhost:3000...
start http://localhost:3000

echo.
echo =====================================================================
echo EchoMorph is now running!
echo - Frontend: http://localhost:3000
echo - Backend:  http://localhost:8000
echo - API Docs: http://localhost:8000/docs
echo.
echo Leave the terminal windows open while using the application.
echo =====================================================================
pause
