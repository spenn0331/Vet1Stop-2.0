# PowerShell script to move health page backup files to backup directory

# Create backup directories
$backupDir = "C:\Users\penny\Desktop\Vet1Stop\backup\health-backup-files"
$bakDir = "$backupDir\bak-files"
$fixedDir = "$backupDir\fixed-files"
$newDir = "$backupDir\new-files"
$testDir = "$backupDir\test-dirs"

# Create directories if they don't exist
if (-not (Test-Path $bakDir)) { New-Item -ItemType Directory -Path $bakDir -Force }
if (-not (Test-Path $fixedDir)) { New-Item -ItemType Directory -Path $fixedDir -Force }
if (-not (Test-Path $newDir)) { New-Item -ItemType Directory -Path $newDir -Force }
if (-not (Test-Path $testDir)) { New-Item -ItemType Directory -Path $testDir -Force }

# Move .bak and .bak2 files
Write-Host "Moving .bak and .bak2 files..."
$bakFiles = Get-ChildItem -Path "C:\Users\penny\Desktop\Vet1Stop\src\app\health" -Recurse -Include "*.bak", "*.bak2"
foreach ($file in $bakFiles) {
    $relativePath = $file.FullName.Replace("C:\Users\penny\Desktop\Vet1Stop\src\app\health\", "")
    $targetPath = Join-Path -Path $bakDir -ChildPath $relativePath
    $targetDir = Split-Path -Path $targetPath -Parent
    
    # Create target directory if it doesn't exist
    if (-not (Test-Path $targetDir)) { New-Item -ItemType Directory -Path $targetDir -Force }
    
    # Copy file to backup and remove original
    Copy-Item -Path $file.FullName -Destination $targetPath -Force
    Remove-Item -Path $file.FullName -Force
    
    Write-Host "Moved: $($file.FullName) -> $targetPath"
}

# Move .fixed and .new files
Write-Host "Moving .fixed and .new files..."
$fixedFiles = Get-ChildItem -Path "C:\Users\penny\Desktop\Vet1Stop\src\app\health" -Recurse -Include "*.fixed*", "*.new*"
foreach ($file in $fixedFiles) {
    $relativePath = $file.FullName.Replace("C:\Users\penny\Desktop\Vet1Stop\src\app\health\", "")
    $targetPath = Join-Path -Path $fixedDir -ChildPath $relativePath
    $targetDir = Split-Path -Path $targetPath -Parent
    
    # Create target directory if it doesn't exist
    if (-not (Test-Path $targetDir)) { New-Item -ItemType Directory -Path $targetDir -Force }
    
    # Copy file to backup and remove original
    Copy-Item -Path $file.FullName -Destination $targetPath -Force
    Remove-Item -Path $file.FullName -Force
    
    Write-Host "Moved: $($file.FullName) -> $targetPath"
}

# Move test directories
Write-Host "Moving test directories..."
$testDirs = @(
    "C:\Users\penny\Desktop\Vet1Stop\src\app\health\filter-test-simple",
    "C:\Users\penny\Desktop\Vet1Stop\src\app\health\fixed-test",
    "C:\Users\penny\Desktop\Vet1Stop\src\app\health\refactored-test"
)

foreach ($dir in $testDirs) {
    if (Test-Path $dir) {
        $dirName = Split-Path -Path $dir -Leaf
        $targetDir = Join-Path -Path $testDir -ChildPath $dirName
        
        # Create target directory if it doesn't exist
        if (-not (Test-Path $targetDir)) { New-Item -ItemType Directory -Path $targetDir -Force }
        
        # Copy directory contents to backup
        Copy-Item -Path "$dir\*" -Destination $targetDir -Recurse -Force
        
        # Remove original directory
        Remove-Item -Path $dir -Recurse -Force
        
        Write-Host "Moved: $dir -> $targetDir"
    }
}

Write-Host "Health page cleanup completed successfully!"
