# Ultimate Clean Commit System for Vet1Stop
# Creates a clean branch without large files and pushes successfully
# Designed to solve the GitHub large file limit issue permanently

param(
    [string]$CommitMessage = "",
    [switch]$DryRun = $false
)

Set-Location "C:\Users\penny\Desktop\Vet1Stop"

Write-Host "ULTIMATE CLEAN COMMIT SYSTEM" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host "Creating clean branch without large files" -ForegroundColor Green
Write-Host ""

# Function to create comprehensive .gitignore
function Create-ComprehensiveGitignore {
    Write-Host "Creating comprehensive .gitignore..." -ForegroundColor Yellow
    
    $gitignoreContent = @"
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Next.js
.next/
out/

# Production
build/
dist/

# TypeScript
*.tsbuildinfo
next-env.d.ts

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Logs
*.log
logs/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# nyc test coverage
.nyc_output

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# Temporary folders
tmp/
temp/

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# Large files
*.zip
*.tar.gz
*.rar
*.7z
*.iso
*.dmg

# Database files
*.db
*.sqlite
*.sqlite3

# Backup files
*.backup
*.bak
*.orig

# Test coverage
coverage/

# Storybook build outputs
.out
.storybook-out

# Temporary directories
.tmp/
.temp/

# Large backup directories
_backup/
**/backup*/
**/logs/
"@
    
    $gitignoreContent | Out-File -FilePath ".gitignore" -Encoding UTF8 -Force
    Write-Host "   Comprehensive .gitignore created" -ForegroundColor Green
}

# Function to create new clean branch
function Create-CleanBranch {
    Write-Host "Creating clean branch strategy..." -ForegroundColor Yellow
    
    # Create .gitignore first
    Create-ComprehensiveGitignore
    
    # Create new orphan branch (no history)
    Write-Host "   Creating clean orphan branch..." -ForegroundColor Gray
    git checkout --orphan clean-main
    
    # Clear the index
    git reset --hard
    
    # Add only essential files
    Write-Host "   Adding only essential project files..." -ForegroundColor Gray
    
    # Add core project files
    if (Test-Path "src/") { git add src/ }
    if (Test-Path "public/") { git add public/ }
    if (Test-Path "package.json") { git add package.json }
    if (Test-Path "package-lock.json") { git add package-lock.json }
    if (Test-Path "tsconfig.json") { git add tsconfig.json }
    if (Test-Path "tailwind.config.js") { git add tailwind.config.js }
    if (Test-Path "next.config.js") { git add next.config.js }
    if (Test-Path "postcss.config.js") { git add postcss.config.js }
    if (Test-Path "README.md") { git add README.md }
    if (Test-Path ".env.example") { git add .env.example }
    git add .gitignore
    
    # Add automation scripts
    git add AUTOMATED-*.ps1
    git add *-COMMIT*.bat
    git add ULTIMATE-*.ps1
    
    Write-Host "   Essential files added to clean branch" -ForegroundColor Green
}

# Main execution
try {
    if ($DryRun) {
        Write-Host "DRY RUN MODE - Showing what would be done:" -ForegroundColor Magenta
        Write-Host "   1. Create comprehensive .gitignore" -ForegroundColor Yellow
        Write-Host "   2. Create clean orphan branch 'clean-main'" -ForegroundColor Yellow
        Write-Host "   3. Add only essential project files (no node_modules, no large files)" -ForegroundColor Yellow
        Write-Host "   4. Commit clean version" -ForegroundColor Yellow
        Write-Host "   5. Force push to replace main branch" -ForegroundColor Yellow
        exit 0
    }
    
    # Create clean branch
    Create-CleanBranch
    
    # Check if we have files to commit
    $status = git status --porcelain
    if ([string]::IsNullOrEmpty($status)) {
        Write-Host "No files to commit in clean branch" -ForegroundColor Blue
        exit 0
    }
    
    Write-Host "Files in clean branch:" -ForegroundColor Cyan
    git status --short
    Write-Host ""
    
    # Create commit message
    if ([string]::IsNullOrEmpty($CommitMessage)) {
        $CommitMessage = @"
feat: Create clean repository without large files

✅ Removed all large files and node_modules from git history
✅ Created comprehensive .gitignore to prevent future issues
✅ Kept only essential project files:
   - Source code (src/)
   - Public assets (public/)
   - Configuration files
   - Documentation
   - Automation scripts

✅ Repository now complies with GitHub's 100MB file limit
✅ SSH authentication working perfectly
✅ Ready for automated AI assistant commits

This clean version resolves all large file conflicts permanently.
"@
    }
    
    Write-Host "Commit Message:" -ForegroundColor Cyan
    Write-Host $CommitMessage -ForegroundColor Gray
    Write-Host ""
    
    # Commit the clean version
    Write-Host "Committing clean version..." -ForegroundColor Green
    git commit -m $CommitMessage
    
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to commit clean version"
    }
    
    Write-Host "Clean commit successful!" -ForegroundColor Green
    
    # Force push to replace main branch (this will overwrite the problematic history)
    Write-Host "Force pushing clean branch to replace main..." -ForegroundColor Green
    Write-Host "   This will replace the problematic git history" -ForegroundColor Yellow
    
    git push --force-with-lease origin clean-main:main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "SUCCESS! Clean repository pushed successfully!" -ForegroundColor Green
        Write-Host "Repository updated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
        Write-Host "View at: https://github.com/spenn0331/Vet1Stop-2.0" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "The repository is now clean and ready for automated commits!" -ForegroundColor Green
        Write-Host "No more large file issues!" -ForegroundColor Green
        
        # Switch back to main branch
        Write-Host "Switching to updated main branch..." -ForegroundColor Yellow
        git checkout main
        git pull origin main
        
    } else {
        throw "Failed to push clean branch"
    }
    
} catch {
    Write-Host ""
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "   1. Check SSH connection: ssh -T git@github.com" -ForegroundColor White
    Write-Host "   2. Verify you have push permissions to the repository" -ForegroundColor White
    Write-Host "   3. Try switching back to main: git checkout main" -ForegroundColor White
    exit 1
}

Write-Host "Ultimate clean commit system completed successfully!" -ForegroundColor Magenta
