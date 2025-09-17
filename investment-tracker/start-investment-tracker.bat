@echo off

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    start cmd /c "echo Node.js not found. Please install from https://nodejs.org && pause"
    exit /b 1
)

REM Check npm dependencies
if not exist "node_modules" (
    start cmd /c "echo Installing dependencies... && npm install && echo Installation complete && timeout /t 2 >nul"
)

REM Start service silently and open browser
start /min cmd /c "npm start" >nul 2>&1

REM Wait for service to start
ping 127.0.0.1 -n 4 >nul

REM Open browser
start http://localhost:3000

REM Exit immediately without showing any window
exit /b 0
