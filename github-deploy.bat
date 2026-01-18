@echo off
title ShareHub - GitHub Repository Setup
color 0A

echo ========================================
echo   ShareHub - GitHub Repository Setup
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

echo Git is available
echo.

echo [1/5] Preparing repository...

REM Create .gitignore if it doesn't exist
if not exist ".gitignore" (
    echo Creating .gitignore...
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
)

REM Initialize git if not already done
if not exist ".git" (
    echo Initializing Git repository...
    git init
) else (
    echo Git repository already exists
)

echo [2/5] Adding files to Git...
git add .

echo [3/5] Creating commit...
git commit -m "ShareHub: Complete file-sharing platform ready for deployment"

echo [4/5] Setting up main branch...
git branch -M main

echo.
echo ========================================
echo   CREATE GITHUB REPOSITORY
echo ========================================
echo.
echo Please follow these steps to create your GitHub repository:
echo.
echo 1. Open a new browser tab and go to: https://github.com/
echo 2. Sign in to your GitHub account
echo 3. Click the "+" icon in the top right corner
echo 4. Select "New repository"
echo 5. Repository name: sharehub-platform
echo 6. Description: Professional file-sharing platform with real-time features
echo 7. Make sure it's set to PUBLIC (required for GitHub Pages)
echo 8. DO NOT check any boxes (README, .gitignore, license)
echo 9. Click "Create repository"
echo.
echo After creating the repository, GitHub will show you a page with commands.
echo Copy the HTTPS URL that looks like:
echo https://github.com/YOUR-USERNAME/sharehub-platform.git
echo.

REM Open GitHub in browser
start https://github.com/new

echo.
echo Waiting for you to create the repository...
echo.
set /p REPO_URL="Paste your GitHub repository URL here: "

if "%REPO_URL%"=="" (
    echo ERROR: Repository URL cannot be empty
    pause
    exit /b 1
)

echo.
echo [5/5] Pushing to GitHub...
echo Adding remote origin: %REPO_URL%

git remote remove origin 2>nul
git remote add origin %REPO_URL%

echo Pushing to GitHub...
git push -u origin main

if errorlevel 1 (
    echo.
    echo ========================================
    echo   PUSH FAILED - TROUBLESHOOTING
    echo ========================================
    echo.
    echo This might be due to:
    echo 1. Authentication issues - Set up GitHub credentials
    echo 2. Repository doesn't exist - Make sure you created it
    echo 3. Network connectivity issues
    echo.
    echo SOLUTIONS:
    echo.
    echo Option 1 - GitHub CLI (Recommended):
    echo 1. Install GitHub CLI from: https://cli.github.com/
    echo 2. Run: gh auth login
    echo 3. Run: gh repo create sharehub-platform --public --push --source=.
    echo.
    echo Option 2 - Personal Access Token:
    echo 1. Go to GitHub Settings ^> Developer settings ^> Personal access tokens
    echo 2. Generate new token with repo permissions
    echo 3. Use token as password when prompted
    echo.
    echo Option 3 - Try again:
    echo Run: git push -u origin main
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   SUCCESS! REPOSITORY CREATED
echo ========================================
echo.
echo Your ShareHub platform is now on GitHub!
echo.
echo Repository URL: %REPO_URL%
echo.
echo What's been uploaded:
echo ✓ Complete ShareHub platform
echo ✓ Node.js backend server
echo ✓ Professional frontend
echo ✓ Vercel deployment configuration
echo ✓ Railway deployment configuration
echo ✓ Render deployment configuration
echo ✓ GitHub Pages support
echo ✓ Complete documentation
echo.
echo ========================================
echo   NEXT STEPS - MAKE IT LIVE
echo ========================================
echo.
echo Now you can deploy to any platform:
echo.
echo OPTION 1 - VERCEL (Recommended for full functionality):
echo 1. Go to: https://vercel.com/
echo 2. Sign in with GitHub
echo 3. Import your sharehub-platform repository
echo 4. Deploy automatically
echo 5. Get live URL instantly!
echo.
echo OPTION 2 - GITHUB PAGES (Static demo):
echo 1. Go to your repository: %REPO_URL%
echo 2. Click Settings tab
echo 3. Scroll to Pages section
echo 4. Select main branch as source
echo 5. Wait 5-10 minutes for deployment
echo 6. Access at: https://YOUR-USERNAME.github.io/sharehub-platform
echo.
echo OPTION 3 - RAILWAY:
echo 1. Go to: https://railway.app/
echo 2. Connect GitHub and deploy your repo
echo.
echo ========================================
echo   REPOSITORY READY FOR DEPLOYMENT!
echo ========================================
echo.
echo Your ShareHub platform is now ready to deploy to Vercel!
echo Repository: %REPO_URL%
echo.
pause