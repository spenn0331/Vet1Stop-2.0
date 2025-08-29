# Vet1Stop Safe Automated Commit & Push System
# Uses SSH authentication and prevents large file issues
# Designed for AI assistant automated commits

param(
    [string]$CommitMessage = "",
    [switch]$DryRun = $false,
    [switch]$Force = $false
)

# Set working directory
Set-Location "C:\Users\penny\Desktop\Vet1Stop"

Write-Host "VET1STOP SAFE AUTOMATED GIT OPERATIONS" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "Using SSH Authentication (Secure & Passwordless)" -ForegroundColor Green
Write-Host ""

# Function to ensure proper .gitignore
function Ensure-GitIgnore {
    Write-Host "Ensuring .gitignore is properly configured..." -ForegroundColor Yellow
    
    $gitignoreContent = @"
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Next.js
.next/
out/

# Production
build/
dist/

# TypeScript
*.tsbuildinfo

# Environment variables
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Logs
*.log
logs/

# Temporary files
*.tmp
*.temp

# Large files
*.zip
*.tar.gz
*.rar
*.7z

# Database
*.db
*.sqlite
*.sqlite3
"@
    
    $gitignoreContent | Out-File -FilePath ".gitignore" -Encoding UTF8 -Force
    Write-Host "   .gitignore updated" -ForegroundColor Green
}

# Function to clean repository safely
function Clean-Repository-Safe {
    Write-Host "Cleaning repository safely..." -ForegroundColor Yellow
    
    # Ensure .gitignore exists first
    Ensure-GitIgnore
    
    # Remove any accidentally tracked files
    Write-Host "   Removing large files from git tracking..." -ForegroundColor Gray
    git rm -r --cached node_modules/ -q 2>$null
    git rm -r --cached .next/ -q 2>$null
    git rm --cached *.tsbuildinfo -q 2>$null
    git rm --cached *.log -q 2>$null
    
    # Clean up any backup or temporary files
    git rm --cached **/logs/ -q 2>$null
    git rm --cached **/*.backup -q 2>$null
    git rm --cached **/*.bak -q 2>$null
    
    Write-Host "   Repository cleaned" -ForegroundColor Green
}

# Function to add only safe files
function Add-Safe-Files {
    Write-Host "Adding only safe, essential files..." -ForegroundColor Yellow
    
    # Define safe file patterns to add
    $safePatterns = @(
        "src/",
        "public/",
        "*.md",
        "*.json",
        "*.js",
        "*.ts",
        "*.tsx",
        "*.css",
        "*.scss",
        "*.yml",
        "*.yaml",
        "*.toml",
        "*.config.*",
        ".env.example",
        ".gitignore",
        "AUTOMATED-*.ps1",
        "ONE-CLICK-*.bat"
    )
    
    foreach ($pattern in $safePatterns) {
        Write-Host "   Adding: $pattern" -ForegroundColor Gray
        git add $pattern 2>$null
    }
    
    Write-Host "   Safe files added to staging" -ForegroundColor Green
}

# Function to check git status and determine if commit is needed
function Test-GitChanges {
    $status = git status --porcelain 2>$null
    return -not [string]::IsNullOrEmpty($status)
}

# Function to get current branch
function Get-CurrentBranch {
    return (git branch --show-current 2>$null).Trim()
}

# Function to generate smart commit message
function Get-SmartCommitMessage {
    param([string]$customMessage)
    
    if (-not [string]::IsNullOrEmpty($customMessage)) {
        return $customMessage
    }
    
    # Analyze changes to create intelligent commit message
    $status = git status --porcelain
    $addedFiles = ($status | Where-Object { $_ -match "^A" }).Count
    $modifiedFiles = ($status | Where-Object { $_ -match "^M" }).Count
    $deletedFiles = ($status | Where-Object { $_ -match "^D" }).Count
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
    
    # Determine primary change type
    $changeType = "update"
    if ($addedFiles -gt $modifiedFiles) { $changeType = "feat" }
    if ($deletedFiles -gt 0) { $changeType = "refactor" }
    
    $message = "$changeType`: Safe automated commit - $timestamp`n`n"
    
    if ($addedFiles -gt 0) { $message += "Added: $addedFiles files`n" }
    if ($modifiedFiles -gt 0) { $message += "Modified: $modifiedFiles files`n" }
    if ($deletedFiles -gt 0) { $message += "Deleted: $deletedFiles files`n" }
    
    $message += "`nSafe commit - no large files included`nAutomated by AI assistant"
    
    return $message
}

# Main execution
try {
    # Clean repository safely first
    Clean-Repository-Safe
    
    # Add only safe files
    Add-Safe-Files
    
    # Check if there are changes to commit after safe adding
    if (-not (Test-GitChanges)) {
        Write-Host "No safe changes detected - repository is clean" -ForegroundColor Blue
        Write-Host "All large files properly ignored!" -ForegroundColor Green
        exit 0
    }
    
    # Get current branch
    $currentBranch = Get-CurrentBranch
    if ([string]::IsNullOrEmpty($currentBranch)) {
        $currentBranch = "main"
    }
    
    Write-Host "Repository Status:" -ForegroundColor Cyan
    Write-Host "   Branch: $currentBranch" -ForegroundColor White
    Write-Host "   Remote: $(git remote get-url origin)" -ForegroundColor White
    Write-Host ""
    
    # Show what will be committed
    Write-Host "Safe changes to be committed:" -ForegroundColor Yellow
    git status --short
    Write-Host ""
    
    # Check for any large files that might slip through
    $largeFiles = git ls-files | ForEach-Object { 
        if (Test-Path $_) {
            $size = (Get-Item $_).Length
            if ($size -gt 50MB) {
                Write-Host "WARNING: Large file detected: $_ ($([math]::Round($size/1MB, 2)) MB)" -ForegroundColor Red
                return $_
            }
        }
    }
    
    if ($largeFiles) {
        Write-Host "Removing large files from staging..." -ForegroundColor Yellow
        foreach ($file in $largeFiles) {
            git reset HEAD $file 2>$null
        }
    }
    
    if ($DryRun) {
        Write-Host "DRY RUN MODE - No actual changes will be made" -ForegroundColor Magenta
        Write-Host "   Would commit safe files only" -ForegroundColor Yellow
        Write-Host "   Would push to origin/$currentBranch via SSH" -ForegroundColor Yellow
        exit 0
    }
    
    # Generate and display commit message
    $finalCommitMessage = Get-SmartCommitMessage -customMessage $CommitMessage
    Write-Host "Commit Message:" -ForegroundColor Cyan
    Write-Host $finalCommitMessage -ForegroundColor Gray
    Write-Host ""
    
    # Commit changes
    Write-Host "Committing safe changes..." -ForegroundColor Green
    git commit -m $finalCommitMessage
    
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to commit changes"
    }
    
    Write-Host "Commit successful!" -ForegroundColor Green
    
    # Push to remote
    Write-Host "Pushing to GitHub via SSH..." -ForegroundColor Green
    Write-Host "   Target: origin/$currentBranch" -ForegroundColor White
    
    git push origin $currentBranch
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "SUCCESS! Safe automated commit and push completed!" -ForegroundColor Green
        Write-Host "Repository updated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
        Write-Host "View at: https://github.com/spenn0331/Vet1Stop-2.0" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Only safe, essential files were committed - no large files!" -ForegroundColor Green
    } else {
        # Try alternative push strategies
        Write-Host "Standard push failed, trying with upstream..." -ForegroundColor Yellow
        
        git push --set-upstream origin $currentBranch
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Push successful with upstream set!" -ForegroundColor Green
        } else {
            throw "Failed to push to remote repository"
        }
    }
    
} catch {
    Write-Host ""
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "   1. Check SSH connection: ssh -T git@github.com" -ForegroundColor White
    Write-Host "   2. Verify remote URL: git remote -v" -ForegroundColor White
    Write-Host "   3. Check git status: git status" -ForegroundColor White
    Write-Host "   4. Try manual push: git push origin $currentBranch" -ForegroundColor White
    exit 1
}

Write-Host "Safe automated git operations completed successfully!" -ForegroundColor Magenta
