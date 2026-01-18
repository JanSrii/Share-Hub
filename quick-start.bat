@echo off
title ShareHub - Quick Start
color 0A

echo.
echo ========================================
echo   ShareHub Platform - Quick Start
echo ========================================
echo.

REM Try different Node.js paths
set NODE_PATHS="C:\Program Files\nodejs\node.exe" "C:\Program Files (x86)\nodejs\node.exe" "%APPDATA%\npm\node.exe" "node"

for %%i in (%NODE_PATHS%) do (
    %%i --version >nul 2>&1
    if not errorlevel 1 (
        echo ✓ Found Node.js: %%i
        set NODE_CMD=%%i
        goto :FOUND_NODE
    )
)

echo ❌ Node.js not found in PATH
echo.
echo Please restart your command prompt/PowerShell after installing Node.js
echo Or try running this from a new terminal window
echo.
echo If Node.js is installed, try:
echo 1. Close this window
echo 2. Open a new Command Prompt or PowerShell
echo 3. Navigate to this folder
echo 4. Run: npm install
echo 5. Run: npm start
echo.
pause
exit /b 1

:FOUND_NODE
echo.
echo Installing dependencies...
%NODE_CMD% -e "console.log('Node.js is working!')"

REM Try npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm not found, trying alternative paths...
    set NPM_PATHS="C:\Program Files\nodejs\npm.cmd" "C:\Program Files (x86)\nodejs\npm.cmd" "%APPDATA%\npm\npm.cmd"
    
    for %%i in (%NPM_PATHS%) do (
        %%i --version >nul 2>&1
        if not errorlevel 1 (
            echo ✓ Found npm: %%i
            set NPM_CMD=%%i
            goto :FOUND_NPM
        )
    )
    
    echo ❌ npm not found
    echo Please restart your terminal and try again
    pause
    exit /b 1
) else (
    set NPM_CMD=npm
)

:FOUND_NPM
echo ✓ npm is available

REM Install dependencies
echo.
echo Installing packages...
%NPM_CMD% install
if errorlevel 1 (
    echo ❌ Installation failed, trying alternative...
    %NPM_CMD% install --legacy-peer-deps
    if errorlevel 1 (
        echo ❌ Installation failed. Please check your internet connection.
        pause
        exit /b 1
    )
)

echo ✓ Dependencies installed!

REM Create directories
echo.
echo Setting up directories...
if not exist "uploads" mkdir uploads
if not exist "uploads\files" mkdir uploads\files
if not exist "uploads\images" mkdir uploads\images
if not exist "uploads\temp" mkdir uploads\temp

REM Create .env file
if not exist ".env" (
    echo Creating configuration...
    copy ".env.example" ".env" >nul 2>&1
)

echo ✓ Setup complete!

echo.
echo ========================================
echo   Starting ShareHub Platform
echo ========================================
echo.
echo 🚀 Your platform will be available at:
echo    http://localhost:3000
echo.
echo 📁 Features ready:
echo    • File upload/download (up to 100MB)
echo    • Real-time chat with file sharing
echo    • Drag & drop interface
echo    • Mobile responsive design
echo.
echo Starting server...
echo.

%NODE_CMD% server.js

echo.
echo Server stopped. Press any key to exit...
pause >nul