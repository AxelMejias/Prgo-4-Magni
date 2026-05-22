@echo off
title TP7 - Iniciando...

if not exist "%~dp0backend\.env" (
    echo.
    echo  [ERROR] No se encontro backend\.env
    echo  Copia backend\env.example a backend\.env y completa DATABASE_URL
    echo.
    pause
    exit /b 1
)

echo Iniciando backend...
start "TP7 - Backend" /D "%~dp0backend" cmd /k "npm run dev"

echo Iniciando frontend...
start "TP7 - Frontend" /D "%~dp0frontend" cmd /k "npm run dev"

echo Esperando que Vite levante...
timeout /t 5 /nobreak >nul

echo Abriendo navegador...
start http://localhost:5173

echo.
echo  Backend  ^>  http://localhost:3000
echo  Frontend ^>  http://localhost:5173
echo.
