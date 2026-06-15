@echo off
setlocal EnableExtensions
set "ROOT=%~dp0.."
cd /d "%ROOT%"

echo ==========================================
echo  Sync Solaris -> assets + Rebuild Indexes
echo ==========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js no esta disponible en PATH.
  pause
  exit /b 1
)

if not exist "scripts\sync-solaris.cjs" (
  echo [ERROR] No se encontro scripts\sync-solaris.cjs
  pause
  exit /b 1
)

node "scripts\sync-solaris.cjs"
set "RC=%ERRORLEVEL%"
if not "%RC%"=="0" (
  echo [ERROR] Sync fallo. Codigo: %RC%
  pause
  exit /b %RC%
)

echo.
echo [OK] Sync + indices completados.
exit /b 0
