@echo off
echo Starting Inventra Backend Server...
cd /d "%~dp0"
echo Current directory: %CD%
echo.
node server.js
pause