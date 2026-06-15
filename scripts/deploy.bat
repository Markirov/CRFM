@echo off
setlocal EnableExtensions EnableDelayedExpansion
title CRFM -- Deploy

set "ROOT=%~dp0.."
cd /d "%ROOT%"

for /f "delims=" %%i in ('powershell -NoProfile -Command "Add-Type -AssemblyName Microsoft.VisualBasic; [Microsoft.VisualBasic.Interaction]::InputBox(''Describe la actualizacion:'', ''CRFM Deploy'', '''')"') do set COMMIT_MSG=%%i
if "%COMMIT_MSG%"=="" (
  echo Cancelado.
  exit /b 1
)

echo.
echo [0/2] Incrementando version...
for /f "delims=" %%v in ('node bump-version.cjs') do set NEW_VERSION=%%v
if "!NEW_VERSION!"=="" (
  echo [ERROR] No se pudo incrementar version.
  exit /b 1
)

set "FULL_COMMIT=!COMMIT_MSG! (v!NEW_VERSION!)"

echo [1/2] Git push (GitHub Action desplegara Firebase Hosting)...
git add -A
git commit -m "!FULL_COMMIT!"
git push -u origin HEAD
if errorlevel 1 (
  echo [ERROR] Fallo git push.
  exit /b 1
)

echo.
echo [2/2] Mira GitHub Actions: https://github.com/Markirov/CRFM/actions
echo [OK] Push v!NEW_VERSION! enviado. Action desplegara en ~1-2 min.
exit /b 0
