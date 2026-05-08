@echo off
title Iniciar Proyecto Parcial

:: Levantar el Backend en una ventana nueva
start "Backend FastAPI" cmd /k "cd /d backend && .venv\Scripts\activate && uvicorn main:app --reload"

:: Levantar el Frontend en la ventana actual (o en otra si preferís)
start "Frontend React" cmd /k "cd /d frontend && npm run dev"

echo Aplicacion levantandose...
pause