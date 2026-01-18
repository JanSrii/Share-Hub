@echo off
title ShareHub - Full-Stack File Sharing Platform
color 0A

echo.
echo  ███████╗██╗  ██╗ █████╗ ██████╗ ███████╗██╗  ██╗██╗   ██╗██████╗ 
echo  ██╔════╝██║  ██║██╔══██╗██╔══██╗██╔════╝██║  ██║██║   ██║██╔══██╗
echo  ███████╗███████║███████║██████╔╝█████╗  ███████║██║   ██║██████╔╝
echo  ╚════██║██╔══██║██╔══██║██╔══██╗██╔══╝  ██╔══██║██║   ██║██╔══██╗
echo  ███████║██║  ██║██║  ██║██║  ██║███████╗██║  ██║╚██████╔╝██████╔╝
echo  ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═════╝ 
echo.
echo                    FULL-STACK PLATFORM STARTUP
echo                   ================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo.
    echo Please install Node.js from https://nodejs.org/
    echo Recommended version: Node.js 18 or higher
    echo.
    pause
    exit /b 1
)

echo ✓ Node.js detected: 
node --version

REM Check if npm is available
npm --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm is not available!
    pause
    exit /b 1
)

echo ✓ npm detected: 
npm --version
echo.

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo [1/3] Installing dependencies...
    echo This may take a few minutes on first run...
    echo.
    npm install
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies!
        pause
        exit /b 1
    )
    echo ✓ Dependencies installed successfully!
    echo.
) else (
    echo ✓ Dependencies already installed
    echo.
)

REM Create .env file if it doesn't exist
if not exist ".env" (
    echo [2/3] Creating environment configuration...
    copy ".env.example" ".env" >nul
    echo ✓ Environment file created (.env)
    echo   You can customize settings in the .env file
    echo.
) else (
    echo ✓ Environment configuration exists
    echo.
)

REM Create upload directories
if not exist "uploads" mkdir uploads
if not exist "uploads\files" mkdir uploads\files
if not exist "uploads\images" mkdir uploads\images
if not exist "uploads\temp" mkdir uploads\temp

echo ✓ Upload directories ready
echo.

echo [3/3] Starting ShareHub server...
echo.
echo ========================================
echo   SERVER STARTING...
echo ========================================
echo.
echo 🚀 ShareHub will be available at:
echo    http://localhost:3000
echo.
echo 📁 Features available:
echo    • Real-time file sharing
echo    • Live chat with file attachments
echo    • Drag & drop uploads
echo    • File preview and download
echo    • Mobile responsive design
echo.
echo 💡 Tips:
echo    • Press Ctrl+C to stop the server
echo    • Check the console for real-time logs
echo    • Files are stored in the 'uploads' folder
echo.
echo ========================================

REM Start the server
npm start

echo.
echo Server stopped. Press any key to exit...
pause >nul