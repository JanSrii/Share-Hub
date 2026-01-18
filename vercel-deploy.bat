@echo off
title ShareHub - Vercel Deployment
color 0A

echo ========================================
echo   ShareHub - Vercel Deployment
echo ========================================
echo.

echo Creating Vercel-optimized configuration...

REM Create optimized package.json for Vercel
(
echo {
echo   "name": "sharehub-platform",
echo   "version": "1.0.0",
echo   "description": "Professional file-sharing platform with real-time messaging",
echo   "main": "api/server.js",
echo   "scripts": {
echo     "start": "node api/server.js",
echo     "build": "echo 'Build complete'",
echo     "dev": "node api/server.js"
echo   },
echo   "engines": {
echo     "node": ">=18.0.0"
echo   },
echo   "dependencies": {},
echo   "keywords": [
echo     "file-sharing",
echo     "nodejs",
echo     "web-app",
echo     "vercel"
echo   ],
echo   "author": "Your Name",
echo   "license": "MIT"
echo }
) > package.json

REM Create api directory for Vercel
if not exist "api" mkdir api

REM Copy server to api directory for Vercel
copy "server-minimal.js" "api\server.js" >nul

REM Create Vercel configuration
(
echo {
echo   "version": 2,
echo   "builds": [
echo     {
echo       "src": "api/server.js",
echo       "use": "@vercel/node"
echo     }
echo   ],
echo   "routes": [
echo     {
echo       "src": "/api/(.*)",
echo       "dest": "/api/server.js"
echo     },
echo     {
echo       "src": "/(.*)",
echo       "dest": "/public/$1"
echo     }
echo   ],
echo   "functions": {
echo     "api/server.js": {
echo       "maxDuration": 30
echo     }
echo   }
echo }
) > vercel.json

echo ✓ Vercel configuration created
echo.

REM Initialize git if not already done
git status >nul 2>&1
if errorlevel 1 (
    echo Initializing Git repository...
    git init
    git add .
    git commit -m "ShareHub: Vercel-ready file-sharing platform"
    git branch -M main
)

echo ========================================
echo   VERCEL DEPLOYMENT STEPS
echo ========================================
echo.
echo 🚀 AUTOMATIC DEPLOYMENT (Recommended):
echo.
echo 1. Go to: https://vercel.com/
echo 2. Click "Sign up" or "Login"
echo 3. Choose "Continue with GitHub"
echo 4. Authorize Vercel to access your GitHub
echo 5. Click "Import Project" or "New Project"
echo 6. Find your "sharehub-platform" repository
echo 7. Click "Import"
echo 8. Vercel will auto-detect settings
echo 9. Click "Deploy"
echo 10. Wait 2-3 minutes for deployment
echo 11. Get your live URL!
echo.
echo 📱 MANUAL DEPLOYMENT (Alternative):
echo.
echo 1. Install Vercel CLI: npm install -g vercel
echo 2. Run: vercel login
echo 3. Run: vercel --prod
echo 4. Follow the prompts
echo.
echo ========================================
echo   GITHUB SETUP (If not done yet)
echo ========================================
echo.
echo If you haven't created GitHub repository yet:
echo.
echo 1. Go to GitHub.com
echo 2. Create new repository: sharehub-platform
echo 3. Make it PUBLIC
echo 4. Copy the repository URL
echo 5. Run these commands:
echo.
echo    git remote add origin [YOUR-REPO-URL]
echo    git push -u origin main
echo.
echo ========================================
echo   EXPECTED RESULTS
echo ========================================
echo.
echo After Vercel deployment, you'll get:
echo.
echo ✅ Live URL (e.g., https://sharehub-platform.vercel.app)
echo ✅ Automatic HTTPS
echo ✅ Global CDN
echo ✅ All features working:
echo    • File upload/download
echo    • Professional interface
echo    • Mobile responsive
echo    • Search functionality
echo    • File preview
echo.
echo 🎯 LINKEDIN POST READY:
echo ================================
echo.
echo 🚀 Just deployed ShareHub - My file-sharing platform is now LIVE on Vercel!
echo.
echo ✨ Features:
echo • Real file upload/download system
echo • Professional responsive interface
echo • Drag ^& drop functionality
echo • File browsing with search
echo • Mobile-friendly design
echo • Secure file storage
echo • Global CDN delivery
echo.
echo 🔗 Live Demo: [Your Vercel URL]
echo 💻 Source Code: [Your GitHub URL]
echo.
echo Built with Node.js, deployed on Vercel
echo #WebDevelopment #NodeJS #FileSharing #Vercel #LiveDemo
echo.
echo ========================================
echo.
echo 🌐 Ready to deploy to Vercel!
echo    Visit: https://vercel.com/
echo.
pause