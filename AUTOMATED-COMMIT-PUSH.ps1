# Vet1Stop Automated Commit & Push System
# Uses SSH authentication (no passwords/tokens required)
# Designed for AI assistant automated commits

param(
    [string]$CommitMessage = "",
    [switch]$DryRun = $false,
    [switch]$Force = $false
)

# Set working directory
Set-Location "C:\Users\penny\Desktop\Vet1Stop"

Write-Host "VET1STOP AUTOMATED GIT OPERATIONS" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Using SSH Authentication (Secure & Passwordless)" -ForegroundColor Green
Write-Host ""

# Function to clean up large/unnecessary files
function Clean-Repository {
    Write-Host "Cleaning repository..." -ForegroundColor Yellow
    
    # Remove large files from git cache (but keep them locally)
    Write-Host "   Removing node_modules from git tracking..." -ForegroundColor Gray
    git rm -r --cached node_modules/ -q 2>$null
    git rm -r --cached .next/ -q 2>$null
    git rm --cached *.tsbuildinfo -q 2>$null
    git rm --cached *.log -q 2>$null
    
    # Force remove any tracked large files
    Write-Host "   Ensuring large files are not tracked..." -ForegroundColor Gray
    git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch node_modules/*' --prune-empty --tag-name-filter cat -- --all 2>$null
    
    # Add .gitignore rules if not present
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
"@
    
    if (-not (Test-Path ".gitignore")) {
        $gitignoreContent | Out-File -FilePath ".gitignore" -Encoding UTF8
        Write-Host "   Created .gitignore file" -ForegroundColor Green
    }
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
    $renamedFiles = ($status | Where-Object { $_ -match "^R" }).Count
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
    
    # Determine primary change type
    $changeType = "update"
    if ($addedFiles -gt $modifiedFiles) { $changeType = "feat" }
    if ($deletedFiles -gt 0) { $changeType = "refactor" }
    
    $message = "$changeType`: Automated commit - $timestamp`n`n"
    
    if ($addedFiles -gt 0) { $message += "Added: $addedFiles files`n" }
    if ($modifiedFiles -gt 0) { $message += "Modified: $modifiedFiles files`n" }
    if ($deletedFiles -gt 0) { $message += "Deleted: $deletedFiles files`n" }
    if ($renamedFiles -gt 0) { $message += "Renamed: $renamedFiles files`n" }
    
    $message += "`nAutomated by AI assistant - Vet1Stop development"
    
    return $message
}

# Main execution
try {
    # Clean repository first
    Clean-Repository
    
    # Check if there are changes to commit
    if (-not (Test-GitChanges)) {
        Write-Host "No changes detected - repository is clean" -ForegroundColor Blue
        Write-Host "Nothing to commit!" -ForegroundColor Green
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
    Write-Host "Changes to be committed:" -ForegroundColor Yellow
    git status --short
    Write-Host ""
    
    if ($DryRun) {
        Write-Host "DRY RUN MODE - No actual changes will be made" -ForegroundColor Magenta
        Write-Host "   Would add all changes and commit with smart message" -ForegroundColor Yellow
        Write-Host "   Would push to origin/$currentBranch via SSH" -ForegroundColor Yellow
        exit 0
    }
    
    # Add all changes
    Write-Host "Adding changes to staging..." -ForegroundColor Yellow
    git add -A
    
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to add changes to staging area"
    }
    
    # Generate and display commit message
    $finalCommitMessage = Get-SmartCommitMessage -customMessage $CommitMessage
    Write-Host "Commit Message:" -ForegroundColor Cyan
    Write-Host $finalCommitMessage -ForegroundColor Gray
    Write-Host ""
    
    # Commit changes
    Write-Host "Committing changes..." -ForegroundColor Green
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
        Write-Host "SUCCESS! Automated commit and push completed!" -ForegroundColor Green
        Write-Host "Repository updated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
        Write-Host "View at: https://github.com/spenn0331/Vet1Stop-2.0" -ForegroundColor Yellow
        Write-Host ""
    } else {
        # Try alternative push strategies
        Write-Host "Standard push failed, trying alternative..." -ForegroundColor Yellow
        
        # Try with upstream
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

Write-Host "Automated git operations completed successfully!" -ForegroundColor Magenta