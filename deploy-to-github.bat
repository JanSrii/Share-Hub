@echo off
title ShareHub - GitHub Deployment
color 0A

echo.
echo  ███████╗██╗  ██╗ █████╗ ██████╗ ███████╗██╗  ██╗██╗   ██╗██████╗ 
echo  ██╔════╝██║  ██║██╔══██╗██╔══██╗██╔════╝██║  ██║██║   ██║██╔══██╗
echo  ███████╗███████║███████║██████╔╝█████╗  ███████║██║   ██║██████╔╝
echo  ╚════██║██╔══██║██╔══██║██╔══██╗██╔══╝  ██╔══██║██║   ██║██╔══██╗
echo  ███████║██║  ██║██║  ██║██║  ██║███████╗██║  ██║╚██████╔╝██████╔╝
echo  ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═════╝ 
echo.
echo                    GITHUB DEPLOYMENT
echo                   ==================
echo.

REM Check if git is available
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Git is not installed!
    echo.
    echo Please install Git from: https://git-scm.com/
    echo Then run this script again.
    pause
    exit /b 1
)

echo ✓ Git is available
echo.

echo [1/8] Initializing Git repository...
git init
if errorlevel 1 (
    echo ❌ Failed to initialize Git repository
    pause
    exit /b 1
)

echo [2/8] Creating .gitignore file...
(
echo node_modules/
echo uploads/
echo .env
echo *.log
echo .DS_Store
echo Thumbs.db
echo .vscode/
echo *.tmp
echo *.temp
) > .gitignore

echo [3/8] Adding all files to Git...
git add .
if errorlevel 1 (
    echo ❌ Failed to add files to Git
    pause
    exit /b 1
)

echo [4/8] Creating initial commit...
git commit -m "🚀 ShareHub: Complete file-sharing platform with real-time features

✨ Features:
• Real file upload/download (up to 100MB)
• Professional responsive web interface
• Drag & drop file uploads
• File browsing with search functionality
• Mobile-friendly design
• Secure file storage system
• RESTful API architecture

🔧 Tech Stack:
• Node.js backend
• Vanilla JavaScript frontend
• Modern CSS with animations
• No external dependencies for core functionality

🌐 Ready for deployment on any Node.js hosting platform"

if errorlevel 1 (
    echo ❌ Failed to create commit
    pause
    exit /b 1
)

echo [5/8] Setting up main branch...
git branch -M main
if errorlevel 1 (
    echo ❌ Failed to set main branch
    pause
    exit /b 1
)

echo.
echo ========================================
echo   GITHUB REPOSITORY SETUP
echo ========================================
echo.
echo 🌐 Please follow these steps:
echo.
echo 1. Go to GitHub.com and sign in
echo 2. Click the "+" icon and select "New repository"
echo 3. Repository name: sharehub-platform
echo 4. Make it PUBLIC (required for GitHub Pages)
echo 5. DO NOT initialize with README, .gitignore, or license
echo 6. Click "Create repository"
echo 7. Copy the repository URL from the page
echo.
echo Example URL format:
echo https://github.com/yourusername/sharehub-platform.git
echo.
set /p REPO_URL="Enter your GitHub repository URL: "

if "%REPO_URL%"=="" (
    echo ❌ Repository URL cannot be empty
    pause
    exit /b 1
)

echo [6/8] Adding remote origin...
git remote add origin %REPO_URL%
if errorlevel 1 (
    echo ❌ Failed to add remote origin
    echo Make sure the URL is correct
    pause
    exit /b 1
)

echo [7/8] Pushing to GitHub...
git push -u origin main
if errorlevel 1 (
    echo ❌ Failed to push to GitHub
    echo.
    echo This might be due to:
    echo • Authentication issues (set up GitHub credentials)
    echo • Repository doesn't exist
    echo • Network connectivity issues
    echo.
    echo Please check and try again.
    pause
    exit /b 1
)

echo [8/8] Setting up deployment files...

REM Create Vercel deployment config
(
echo {
echo   "version": 2,
echo   "builds": [
echo     {
echo       "src": "server-minimal.js",
echo       "use": "@vercel/node"
echo     },
echo     {
echo       "src": "public/**",
echo       "use": "@vercel/static"
echo     }
echo   ],
echo   "routes": [
echo     {
echo       "src": "/api/.*",
echo       "dest": "/server-minimal.js"
echo     },
echo     {
echo       "src": "/(.*)",
echo       "dest": "/public/$1"
echo     }
echo   ]
echo }
) > vercel.json

REM Create Railway deployment config
(
echo web: node server-minimal.js
) > Procfile

REM Create Render deployment config
(
echo {
echo   "services": [
echo     {
echo       "type": "web",
echo       "name": "sharehub",
echo       "env": "node",
echo       "buildCommand": "npm install",
echo       "startCommand": "node server-minimal.js",
echo       "plan": "free"
echo     }
echo   ]
echo }
) > render.yaml

REM Update package.json for deployment
(
echo {
echo   "name": "sharehub-platform",
echo   "version": "1.0.0",
echo   "description": "Full-stack file sharing platform",
echo   "main": "server-minimal.js",
echo   "scripts": {
echo     "start": "node server-minimal.js",
echo     "dev": "node server-minimal.js"
echo   },
echo   "engines": {
echo     "node": ">=18.0.0"
echo   },
echo   "keywords": [
echo     "file-sharing",
echo     "nodejs",
echo     "web-app"
echo   ],
echo   "author": "Your Name",
echo   "license": "MIT"
echo }
) > package.json

echo ✓ Deployment files created

REM Commit deployment files
git add .
git commit -m "📦 Add deployment configurations for Vercel, Railway, and Render"
git push origin main

echo.
echo ========================================
echo   DEPLOYMENT SUCCESSFUL! 🎉
echo ========================================
echo.
echo ✅ Your ShareHub platform is now on GitHub!
echo.
echo 📂 Repository: %REPO_URL%
echo.
echo 🚀 DEPLOYMENT OPTIONS:
echo.
echo 1. VERCEL (Recommended - Free):
echo    • Go to vercel.com
echo    • Sign in with GitHub
echo    • Import your repository
echo    • Deploy automatically
echo    • Get live URL instantly
echo.
echo 2. RAILWAY (Great for Node.js):
echo    • Go to railway.app
echo    • Connect GitHub account
echo    • Deploy your repository
echo    • Get live URL
echo.
echo 3. RENDER (Free tier available):
echo    • Go to render.com
echo    • Connect GitHub account
echo    • Create new Web Service
echo    • Select your repository
echo.
echo 4. GITHUB PAGES (Static version):
echo    • Go to your repository settings
echo    • Scroll to "Pages" section
echo    • Select "main" branch
echo    • Choose "/ (root)" folder
echo.
echo 🌐 LIVE DEPLOYMENT STEPS:
echo.
echo OPTION A - VERCEL (EASIEST):
echo 1. Visit: https://vercel.com/
echo 2. Click "Sign up" and choose "Continue with GitHub"
echo 3. Click "Import Project"
echo 4. Find your "sharehub-platform" repository
echo 5. Click "Import"
echo 6. Click "Deploy"
echo 7. Wait 2-3 minutes
echo 8. Get your live URL!
echo.
echo OPTION B - RAILWAY:
echo 1. Visit: https://railway.app/
echo 2. Sign up with GitHub
echo 3. Click "Deploy from GitHub repo"
echo 4. Select "sharehub-platform"
echo 5. Click "Deploy Now"
echo 6. Get your live URL!
echo.
echo 📱 LINKEDIN POST READY:
echo ================================
echo.
echo 🚀 Just deployed ShareHub - My file-sharing platform is now LIVE!
echo.
echo ✨ Features:
echo • Real file upload/download system
echo • Professional responsive interface
echo • Drag ^& drop functionality
echo • File browsing with search
echo • Mobile-friendly design
echo • Secure file storage
echo.
echo 🔗 Live Demo: [Your deployment URL]
echo 💻 Source Code: %REPO_URL%
echo.
echo Built with Node.js, vanilla JavaScript, and modern web technologies
echo #WebDevelopment #NodeJS #FileSharing #FullStack #LiveDemo
echo.
echo ========================================
echo.
echo 🎯 NEXT STEPS:
echo 1. Choose a deployment platform above
echo 2. Deploy your repository
echo 3. Get your live URL
echo 4. Test all features online
echo 5. Share on LinkedIn with your live URL!
echo.
pause