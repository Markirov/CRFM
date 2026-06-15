@echo off
setlocal EnableExtensions EnableDelayedExpansion
title CRFM -- Launcher
set "ROOT=%~dp0"
cd /d "%ROOT%"

:menu
cls
echo ==========================================
echo  CRFM - TASK LAUNCHER
echo ==========================================
echo.
echo Elige una secuencia (varias opciones y orden libre)
echo Ejemplo: 2 1 3
echo.
echo   1^) Local dev server
echo   2^) Rebuild indexes
echo   3^) Deploy ^(bump + commit + push - Action despliega^)
echo   4^) Firebase deploy directo ^(skip Action^)
echo   5^) Backup Firestore ^(JSON local^)
echo   0^) Salir
echo.
set /p RUNSEQ="Secuencia: "
if "%RUNSEQ%"=="" goto menu
if "%RUNSEQ%"=="0" exit /b 0

echo.
echo Ejecutando: %RUNSEQ%
echo.
for %%A in (%RUNSEQ%) do (
  call :runOption %%A
  if errorlevel 1 (
    echo.
    echo [ERROR] Secuencia detenida en opcion %%A.
    echo.
    pause
    goto menu
  )
)

echo.
echo [OK] Secuencia completada.
echo.
pause
goto menu

:runOption
set "OPT=%~1"
if "%OPT%"=="1" (
  echo --- [1] Local ---
  call "%ROOT%scripts\local.bat"
  exit /b %ERRORLEVEL%
)
if "%OPT%"=="2" (
  echo --- [2] Index ---
  call "%ROOT%scripts\index.bat"
  exit /b %ERRORLEVEL%
)
if "%OPT%"=="3" (
  echo --- [3] Deploy ---
  call "%ROOT%scripts\deploy.bat"
  exit /b %ERRORLEVEL%
)
if "%OPT%"=="4" (
  echo --- [4] Firebase deploy directo ---
  call "%ROOT%scripts\deploy-firebase.bat"
  exit /b %ERRORLEVEL%
)
if "%OPT%"=="5" (
  echo --- [5] Backup Firestore ---
  call "%ROOT%scripts\backup.bat"
  exit /b %ERRORLEVEL%
)

echo [ERROR] Opcion no valida: %OPT%
exit /b 1
