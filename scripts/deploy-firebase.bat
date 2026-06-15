@echo off
setlocal EnableExtensions EnableDelayedExpansion
title CRFM -- Firebase Deploy directo

set "ROOT=%~dp0.."
cd /d "%ROOT%"

echo ==========================================
echo  Firebase Deploy directo (skip GitHub Action)
echo ==========================================
echo.

echo [1/2] npm run build...
call npm run build
if errorlevel 1 (
  echo [ERROR] Fallo build.
  exit /b 1
)

echo [2/2] firebase deploy --only hosting...
call firebase deploy --only hosting
if errorlevel 1 (
  echo [ERROR] Fallo firebase deploy.
  exit /b 1
)

echo.
echo [OK] App live en https://crfm-dc873.web.app
exit /b 0
