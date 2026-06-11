@echo off
title TP9 - Iniciando...

if not exist "%~dp0backend\.env" (
    echo.
    echo  [ERROR] No se encontro backend\.env
    echo.
    pause
    exit /b 1
)

echo Instalando dependencias del backend...
pushd "%~dp0backend"
call npm install
popd

echo Instalando dependencias del frontend...
pushd "%~dp0frontend"
call npm install
popd

set NGROK_EXE=C:\Users\Acel\Downloads\ngrok-v3-stable-windows-amd64\ngrok.exe

echo Iniciando ngrok...
start "TP9 - Ngrok" cmd /k "%NGROK_EXE% http 5173"

echo Esperando que ngrok levante...
timeout /t 6 /nobreak >nul

echo Obteniendo URL de ngrok...
for /f "delims=" %%i in ('powershell -NoProfile -Command "(Invoke-RestMethod http://localhost:4040/api/tunnels).tunnels | Where-Object { $_.proto -eq \"https\" } | Select-Object -ExpandProperty public_url"') do set NGROK_URL=%%i

if "%NGROK_URL%"=="" (
    echo  [WARN] No se obtuvo URL de ngrok, usando localhost
    set NGROK_URL=http://localhost:5173
) else (
    echo  Ngrok URL: %NGROK_URL%
    powershell -NoProfile -Command "(Get-Content '%~dp0backend\.env') -replace 'FRONTEND_URL=.*', 'FRONTEND_URL=%NGROK_URL%' | Set-Content '%~dp0backend\.env'"
    echo  FRONTEND_URL actualizado en .env
)

echo Iniciando backend...
start "TP9 - Backend" /D "%~dp0backend" cmd /k "npm run dev"

echo Iniciando frontend...
start "TP9 - Frontend" /D "%~dp0frontend" cmd /k "npm run dev"

echo Esperando que todo levante...
timeout /t 6 /nobreak >nul

echo Abriendo navegador...
start %NGROK_URL%

echo.
echo  Backend  ^>  http://localhost:3000
echo  Frontend ^>  %NGROK_URL%
echo.
