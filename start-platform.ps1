# ShareHub Platform Startup Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   ShareHub Platform - Starting Up" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Try to find Node.js
$nodePaths = @(
    "C:\Program Files\nodejs\node.exe",
    "C:\Program Files (x86)\nodejs\node.exe",
    "$env:APPDATA\npm\node.exe",
    "node"
)

$nodeFound = $false
$nodePath = ""

foreach ($path in $nodePaths) {
    try {
        if ($path -eq "node") {
            $result = & node --version 2>$null
        } else {
            $result = & $path --version 2>$null
        }
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Found Node.js: $path" -ForegroundColor Green
            Write-Host "  Version: $result" -ForegroundColor Green
            $nodePath = $path
            $nodeFound = $true
            break
        }
    } catch {
        # Continue to next path
    }
}

if (-not $nodeFound) {
    Write-Host "❌ Node.js not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please try one of these solutions:" -ForegroundColor Yellow
    Write-Host "1. Restart your PowerShell/Command Prompt" -ForegroundColor White
    Write-Host "2. Restart your computer" -ForegroundColor White
    Write-Host "3. Reinstall Node.js from https://nodejs.org/" -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Try to find npm
$npmPaths = @(
    "C:\Program Files\nodejs\npm.cmd",
    "C:\Program Files (x86)\nodejs\npm.cmd",
    "$env:APPDATA\npm\npm.cmd",
    "npm"
)

$npmFound = $false
$npmPath = ""

foreach ($path in $npmPaths) {
    try {
        if ($path -eq "npm") {
            $result = & npm --version 2>$null
        } else {
            $result = & $path --version 2>$null
        }
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Found npm: $path" -ForegroundColor Green
            Write-Host "  Version: $result" -ForegroundColor Green
            $npmPath = $path
            $npmFound = $true
            break
        }
    } catch {
        # Continue to next path
    }
}

if (-not $npmFound) {
    Write-Host "❌ npm not found!" -ForegroundColor Red
    Write-Host "npm should come with Node.js. Please reinstall Node.js." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Yellow

# Install dependencies
try {
    if ($npmPath -eq "npm") {
        & npm install
    } else {
        & $npmPath install
    }
    
    if ($LASTEXITCODE -ne 0) {
        throw "npm install failed"
    }
    
    Write-Host "✓ Dependencies installed successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    Write-Host "Trying alternative installation..." -ForegroundColor Yellow
    
    try {
        if ($npmPath -eq "npm") {
            & npm install --legacy-peer-deps
        } else {
            & $npmPath install --legacy-peer-deps
        }
        
        if ($LASTEXITCODE -ne 0) {
            throw "Alternative installation failed"
        }
        
        Write-Host "✓ Dependencies installed with legacy mode!" -ForegroundColor Green
    } catch {
        Write-Host "❌ Installation failed completely" -ForegroundColor Red
        Write-Host "Please check your internet connection and try again." -ForegroundColor Yellow
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Create directories
Write-Host ""
Write-Host "Setting up directories..." -ForegroundColor Yellow

$directories = @("uploads", "uploads\files", "uploads\images", "uploads\temp")
foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
}

# Create .env file
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "✓ Environment configuration created" -ForegroundColor Green
    }
}

Write-Host "✓ Setup complete!" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Starting ShareHub Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 Your platform will be available at:" -ForegroundColor White
Write-Host "   http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "📁 Features ready:" -ForegroundColor White
Write-Host "   • File upload/download (up to 100MB)" -ForegroundColor White
Write-Host "   • Real-time chat with file sharing" -ForegroundColor White
Write-Host "   • Drag & drop interface" -ForegroundColor White
Write-Host "   • Mobile responsive design" -ForegroundColor White
Write-Host ""
Write-Host "Starting server..." -ForegroundColor Yellow
Write-Host ""

# Start the server
try {
    if ($nodePath -eq "node") {
        & node server.js
    } else {
        & $nodePath server.js
    }
} catch {
    Write-Host ""
    Write-Host "❌ Server failed to start" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Server stopped." -ForegroundColor Yellow
Read-Host "Press Enter to exit"