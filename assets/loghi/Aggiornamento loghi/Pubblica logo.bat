@echo off
cd /d "%~dp0"
node "publish-logo-server.js"
echo.
echo Il server si e' fermato. Premi un tasto per chiudere questa finestra.
pause >nul
