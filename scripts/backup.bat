@echo off
setlocal EnableExtensions
set "ROOT=%~dp0.."
cd /d "%ROOT%"

echo ==========================================
echo  Backup Firestore (todas las colecciones)
echo ==========================================
echo.

if "%GOOGLE_APPLICATION_CREDENTIALS%"=="" (
  echo [ERROR] Falta GOOGLE_APPLICATION_CREDENTIALS.
  echo.
  echo Set permanente con:
  echo   setx GOOGLE_APPLICATION_CREDENTIALS "C:\path\service-account.json"
  echo.
  echo O temporal en esta sesion:
  echo   set GOOGLE_APPLICATION_CREDENTIALS=C:\path\service-account.json
  pause
  exit /b 1
)

call npx tsx scripts/backup-firestore.ts
set "RC=%ERRORLEVEL%"
if not "%RC%"=="0" (
  echo [ERROR] Fallo backup. Codigo: %RC%
  pause
  exit /b %RC%
)

echo.
echo [OK] Backup completado en carpeta backups\
pause
exit /b 0
