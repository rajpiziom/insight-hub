@echo off
echo ========================================
echo  News Intelligence Hub - Quick Sync
echo ========================================
echo.
echo Running sync (Edge stays open!)...
cd /d "%~dp0"
call npx tsx src/index.ts sync
echo.
echo Done! Press any key to close.
pause >nul
