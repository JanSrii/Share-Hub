@echo off
echo ========================================
echo   ShareHub - Install and Run
echo ========================================
echo.

REM Refresh environment variables
call refreshenv 2>nul

REM Try multiple ways to run Node.js
echo Attempting to install dependencies...

REM Method 1: Try npm directly
npm install >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Dependencies installed successfully!
    goto :START_SERVER
)

REM Method 2: Try with full path
"C:\Program Files\nodejs\npm.cmd" install >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Dependencies installed successfully!
    set NPM_CMD="C:\Program Files\nodejs\npm.cmd"
    set NODE_CMD="C:\Program Files\nodejs\node.exe"
    goto :START_SERVER
)

REM Method 3: Try alternative path
"C:\Program Files (x86)\nodejs\npm.cmd" install >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Dependencies installed successfully!
    set NPM_CMD="C:\Program Files (x86)\nodejs\npm.cmd"
    set NODE_CMD="C:\Program Files (x86)\nodejs\node.exe"
    goto :START_SERVER
)

echo ❌ Could not install dependencies
echo.
echo Please try manually:
echo 1. Open a new Command Prompt or PowerShell
echo 2. Navigate to this folder
echo 3. Run: npm install
echo 4. Run: npm start
echo.
pause
exit /b 1

:START_SERVER
echo.
echo Creating directories...
if not exist "uploads" mkdir uploads
if not exist "uploads\files" mkdir uploads\files
if not exist "uploads\images" mkdir uploads\images
if not exist "uploads\temp" mkdir uploads\temp

if not exist ".env" (
    copy ".env.example" ".env" >nul 2>&1
)

echo.
echo ========================================
echo   Starting ShareHub Platform
echo ========================================
echo.
echo 🚀 Platform will be available at:
echo    http://localhost:3000
echo.
echo 📁 Features:
echo    • File upload/download (100MB max)
echo    • Real-time chat with file sharing
echo    • Drag and drop interface
echo    • Mobile responsive design
echo.

REM Start server
if defined NODE_CMD (
    echo Starting with: %NODE_CMD%
    %NODE_CMD% server.js
) else (
    echo Starting with: node
    node server.js
)

echo.
echo Server stopped.
pause