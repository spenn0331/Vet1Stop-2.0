/**
 * Health Page Files Cleanup Script
 * 
 * This script identifies and removes unnecessary files from the health page directory:
 * 1. Backup files (.bak, .bak2)
 * 2. Duplicate/alternate versions (.fixed, .new)
 * 3. Test directories that are no longer needed
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Base directory for health components
const healthDir = path.join(__dirname, '..', 'src', 'app', 'health');

// Function to remove backup files
function removeBackupFiles() {
  console.log('Removing backup files...');
  
  // Find all backup files recursively
  function findBackupFiles(dir) {
    let results = [];
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Skip the .workflow directory
        if (file === '.workflow') continue;
        
        // Recursively search subdirectories
        results = results.concat(findBackupFiles(filePath));
      } else if (file.endsWith('.bak') || file.endsWith('.bak2')) {
        results.push(filePath);
      }
    }
    
    return results;
  }
  
  const backupFiles = findBackupFiles(healthDir);
  
  // Create a backup directory
  const backupDir = path.join(__dirname, '..', 'backup', 'health-backup-' + new Date().toISOString().replace(/:/g, '-'));
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  // Move backup files to the backup directory
  for (const backupFile of backupFiles) {
    const relativePath = path.relative(path.join(__dirname, '..'), backupFile);
    const targetPath = path.join(backupDir, relativePath);
    
    // Create the target directory if it doesn't exist
    const targetDir = path.dirname(targetPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // Move the file
    fs.copyFileSync(backupFile, targetPath);
    fs.unlinkSync(backupFile);
    
    console.log(`Moved: ${backupFile} -> ${targetPath}`);
  }
  
  console.log(`Moved ${backupFiles.length} backup files to ${backupDir}`);
}

// Function to remove duplicate/alternate versions
function removeDuplicateVersions() {
  console.log('Removing duplicate/alternate versions...');
  
  // Find all duplicate/alternate versions recursively
  function findDuplicateVersions(dir) {
    let results = [];
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Skip the .workflow directory
        if (file === '.workflow') continue;
        
        // Recursively search subdirectories
        results = results.concat(findDuplicateVersions(filePath));
      } else if (
        file.endsWith('.fixed.tsx') || 
        file.endsWith('.new.tsx') || 
        file.includes('.tsx.fixed') || 
        file.includes('.tsx.new')
      ) {
        results.push(filePath);
      }
    }
    
    return results;
  }
  
  const duplicateFiles = findDuplicateVersions(healthDir);
  
  // Create a backup directory
  const backupDir = path.join(__dirname, '..', 'backup', 'health-duplicates-' + new Date().toISOString().replace(/:/g, '-'));
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  // Move duplicate files to the backup directory
  for (const duplicateFile of duplicateFiles) {
    const relativePath = path.relative(path.join(__dirname, '..'), duplicateFile);
    const targetPath = path.join(backupDir, relativePath);
    
    // Create the target directory if it doesn't exist
    const targetDir = path.dirname(targetPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // Move the file
    fs.copyFileSync(duplicateFile, targetPath);
    fs.unlinkSync(duplicateFile);
    
    console.log(`Moved: ${duplicateFile} -> ${targetPath}`);
  }
  
  console.log(`Moved ${duplicateFiles.length} duplicate files to ${backupDir}`);
}

// Function to remove test directories
function removeTestDirectories() {
  console.log('Removing test directories...');
  
  const testDirs = [
    path.join(healthDir, 'filter-test-simple'),
    path.join(healthDir, 'fixed-test'),
    path.join(healthDir, 'refactored-test')
  ];
  
  // Create a backup directory
  const backupDir = path.join(__dirname, '..', 'backup', 'health-tests-' + new Date().toISOString().replace(/:/g, '-'));
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  // Move test directories to the backup directory
  for (const testDir of testDirs) {
    if (fs.existsSync(testDir)) {
      const dirName = path.basename(testDir);
      const targetDir = path.join(backupDir, dirName);
      
      // Create the target directory
      fs.mkdirSync(targetDir, { recursive: true });
      
      // Copy all files in the test directory
      const files = fs.readdirSync(testDir);
      for (const file of files) {
        const sourcePath = path.join(testDir, file);
        const targetPath = path.join(targetDir, file);
        
        if (fs.statSync(sourcePath).isDirectory()) {
          // Recursively copy subdirectories
          fs.mkdirSync(targetPath, { recursive: true });
          const subFiles = fs.readdirSync(sourcePath);
          for (const subFile of subFiles) {
            const subSourcePath = path.join(sourcePath, subFile);
            const subTargetPath = path.join(targetPath, subFile);
            fs.copyFileSync(subSourcePath, subTargetPath);
          }
        } else {
          // Copy files
          fs.copyFileSync(sourcePath, targetPath);
        }
      }
      
      // Remove the original directory
      fs.rmSync(testDir, { recursive: true, force: true });
      
      console.log(`Moved: ${testDir} -> ${targetDir}`);
    }
  }
  
  console.log(`Moved test directories to ${backupDir}`);
}

// Function to check for TypeScript errors
function checkTypeScriptErrors() {
  console.log('Checking for TypeScript errors...');
  
  try {
    execSync('npx tsc --noEmit src/app/health/components/NGOResourcesSection.tsx', { stdio: 'inherit' });
    console.log('No TypeScript errors found in NGOResourcesSection.tsx!');
    return true;
  } catch (error) {
    console.error('TypeScript errors found in NGOResourcesSection.tsx');
    return false;
  }
}

// Function to commit changes to the repository
function commitChanges() {
  console.log('Committing changes to the repository...');
  
  try {
    // Add all changes
    execSync('git add .', { stdio: 'inherit' });
    
    // Commit changes
    execSync('git commit -m "Clean up health page files and fix TypeScript errors"', { stdio: 'inherit' });
    
    console.log('Successfully committed changes to the repository!');
    return true;
  } catch (error) {
    console.error(`Error committing changes: ${error.message}`);
    return false;
  }
}

// Main function
(async function main() {
  console.log('Starting health page files cleanup...');
  
  // Check for TypeScript errors first
  const noErrors = checkTypeScriptErrors();
  
  if (!noErrors) {
    console.log('\n⚠️ Please fix TypeScript errors before proceeding with cleanup.');
    return;
  }
  
  // Remove backup files
  removeBackupFiles();
  
  // Remove duplicate/alternate versions
  removeDuplicateVersions();
  
  // Remove test directories
  removeTestDirectories();
  
  // Commit changes to the repository
  const committed = commitChanges();
  
  if (committed) {
    console.log('\n✅ Health page files cleanup completed successfully!');
  } else {
    console.log('\n⚠️ Health page files cleanup completed, but changes could not be committed.');
    console.log('Please commit the changes manually using git commands.');
  }
  
  console.log('\nNext steps:');
  console.log('1. Test the health page thoroughly');
  console.log('2. Verify that all functionality works as expected');
  console.log('3. Continue with the next tasks in the project');
})();
