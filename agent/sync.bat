@echo off
echo ========================================
echo  News Intelligence Hub - Quick Sync
echo ========================================
echo.
echo Closing Microsoft Edge...
taskkill /F /IM msedge.exe >nul 2>&1
timeout /t 3 /nobreak >nul

echo Running sync...
cd /d "%~dp0"
call npx tsx src/index.ts sync

echo.
echo Reopening Microsoft Edge...
start msedge
echo.
echo Done! Press any key to close.
pause >nul
