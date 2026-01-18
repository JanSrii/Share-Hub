@echo off
title ShareHub - Simple GitHub Deployment
color 0A

echo ========================================
echo   ShareHub - GitHub Deployment
echo ========================================
echo.

REM Check if git is available
git --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Git is not installed!
    echo Please install Git from: https://git-scm.com/
    pause
    exit /b 1
)

echo [1/6] Initializing Git repository...
git init

echo [2/6] Creating .gitignore file...
(
echo node_modules/
echo uploads/
echo .env
echo *.log
echo .DS_Store
echo Thumbs.db
) > .gitignore

echo [3/6] Adding all files to Git...
git add .

echo [4/6] Creating initial commit...
git commit -m "ShareHub: Complete file-sharing platform

Features:
- Real file upload/download system
- Professional responsive web interface
- Drag and drop file uploads
- File browsing with search functionality
- Mobile-friendly design
- Secure file storage system
- RESTful API architecture

Tech Stack:
- Node.js backend
- Vanilla JavaScript frontend
- Modern CSS with animations
- Ready for deployment"

echo [5/6] Setting up main branch...
git branch -M main

echo.
echo ========================================
echo   GITHUB REPOSITORY SETUP
echo ========================================
echo.
echo Please follow these steps:
echo.
echo 1. Go to GitHub.com and sign in
echo 2. Click the + icon and select "New repository"
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
    echo ERROR: Repository URL cannot be empty
    pause
    exit /b 1
)

echo [6/6] Adding remote and pushing to GitHub...
git remote add origin %REPO_URL%
git push -u origin main

if errorlevel 1 (
    echo.
    echo Push failed. This might be due to:
    echo - Authentication issues
    echo - Repository doesn't exist
    echo - Network connectivity
    echo.
    echo Please check and try: git push -u origin main
    pause
    exit /b 1
)

echo.
echo ========================================
echo   DEPLOYMENT SUCCESSFUL!
echo ========================================
echo.
echo Your ShareHub platform is now on GitHub!
echo Repository: %REPO_URL%
echo.
echo NEXT STEPS - MAKE IT LIVE:
echo.
echo OPTION 1 - GITHUB PAGES (Free Static Demo):
echo 1. Go to your repository on GitHub
echo 2. Click "Settings" tab
echo 3. Scroll to "Pages" section
echo 4. Under "Source" select "Deploy from a branch"
echo 5. Select "main" branch and "/ (root)" folder
echo 6. Click "Save"
echo 7. Wait 5-10 minutes
echo 8. Your demo will be live at:
echo    https://yourusername.github.io/sharehub-platform
echo.
echo OPTION 2 - VERCEL (Full Node.js App):
echo 1. Go to vercel.com
echo 2. Sign in with GitHub
echo 3. Click "Import Project"
echo 4. Select your sharehub-platform repository
echo 5. Click "Deploy"
echo 6. Get your live URL instantly!
echo.
echo OPTION 3 - RAILWAY (Node.js Hosting):
echo 1. Go to railway.app
echo 2. Connect GitHub account
echo 3. Deploy your repository
echo 4. Get live URL
echo.
echo LINKEDIN POST TEMPLATE:
echo ========================
echo.
echo Just deployed ShareHub - My file-sharing platform is now LIVE!
echo.
echo Features:
echo - Real file upload/download system
echo - Professional responsive interface
echo - Drag and drop functionality
echo - File browsing with search
echo - Mobile-friendly design
echo - Secure file storage
echo.
echo Live Demo: [Your deployment URL]
echo Source Code: %REPO_URL%
echo.
echo Built with Node.js and modern web technologies
echo #WebDevelopment #NodeJS #FileSharing #FullStack
echo.
pause