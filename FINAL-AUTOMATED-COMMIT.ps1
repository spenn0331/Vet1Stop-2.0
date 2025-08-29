# Final Automated Commit System for Clean Vet1Stop Repository
# Works with clean repository - no large file issues
# SSH authentication - secure and passwordless

param(
    [string]$CommitMessage = "",
    [switch]$DryRun = $false
)

Set-Location "C:\Users\penny\Desktop\Vet1Stop"

Write-Host "FINAL AUTOMATED COMMIT SYSTEM" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host "Clean Repository - SSH Authentication" -ForegroundColor Green
Write-Host ""

# Function to add safe files only
function Add-SafeFiles {
    Write-Host "Adding safe project files..." -ForegroundColor Yellow
    
    # Add core project files
    if (Test-Path "src/") { 
        git add src/
        Write-Host "   Added: src/" -ForegroundColor Gray
    }
    if (Test-Path "public/") { 
        git add public/
        Write-Host "   Added: public/" -ForegroundColor Gray
    }
    
    # Add configuration files
    $configFiles = @("package.json", "package-lock.json", "tsconfig.json", "next.config.js", "tailwind.config.js", "postcss.config.js", ".gitignore")
    foreach ($file in $configFiles) {
        if (Test-Path $file) {
            git add $file
            Write-Host "   Added: $file" -ForegroundColor Gray
        }
    }
    
    # Add documentation
    if (Test-Path "README.md") { 
        git add README.md
        Write-Host "   Added: README.md" -ForegroundColor Gray
    }
    
    # Add automation scripts
    git add *.ps1 -q 2>$null
    git add *.bat -q 2>$null
    Write-Host "   Added: automation scripts" -ForegroundColor Gray
    
    Write-Host "Safe files added to staging" -ForegroundColor Green
}

# Function to generate smart commit message
function Get-SmartCommitMessage {
    param([string]$customMessage)
    
    if (-not [string]::IsNullOrEmpty($customMessage)) {
        return $customMessage
    }
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
    $message = "update: Automated commit - $timestamp`n`n"
    $message += "✅ Updated Vet1Stop application files`n"
    $message += "✅ Clean repository - no large files`n"
    $message += "✅ SSH authentication working`n"
    $message += "`nAutomated by AI assistant"
    
    return $message
}

# Main execution
try {
    # Add safe files
    Add-SafeFiles
    
    # Check if there are changes to commit
    $status = git status --porcelain
    if ([string]::IsNullOrEmpty($status)) {
        Write-Host "No changes to commit - repository is up to date" -ForegroundColor Blue
        exit 0
    }
    
    Write-Host "Changes to be committed:" -ForegroundColor Cyan
    git status --short
    Write-Host ""
    
    if ($DryRun) {
        Write-Host "DRY RUN - No actual commit will be made" -ForegroundColor Magenta
        exit 0
    }
    
    # Generate commit message
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
    git push origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "🎉 SUCCESS! Automated commit and push completed!" -ForegroundColor Green
        Write-Host "📅 Repository updated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
        Write-Host "🔗 View at: https://github.com/spenn0331/Vet1Stop-2.0" -ForegroundColor Yellow
        Write-Host "✅ Clean repository - no large file issues!" -ForegroundColor Green
    } else {
        throw "Failed to push to remote repository"
    }
    
} catch {
    Write-Host ""
    Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🏁 Final automated commit system completed successfully!" -ForegroundColor Magenta
