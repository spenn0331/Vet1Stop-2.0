/**
 * Rename Health Components Script
 * 
 * This script renames the refactored health components to replace the original components.
 * It creates backups of the original files with a .bak extension.
 */

const fs = require('fs');
const path = require('path');

// Base directory for health components
const healthDir = path.join(__dirname, '..', 'src', 'app', 'health');

// Function to rename a file
function renameFile(sourcePath, targetPath) {
  if (!fs.existsSync(sourcePath)) {
    console.error(`Source file not found: ${sourcePath}`);
    return;
  }

  // Create backup of the original file if it exists
  if (fs.existsSync(targetPath)) {
    const backupPath = `${targetPath}.bak`;
    console.log(`Creating backup: ${backupPath}`);
    fs.copyFileSync(targetPath, backupPath);
  }

  // Rename the refactored file to replace the original
  console.log(`Renaming: ${sourcePath} -> ${targetPath}`);
  fs.copyFileSync(sourcePath, targetPath);
  
  // Delete the refactored file
  fs.unlinkSync(sourcePath);
}

// Function to process all refactored components
function processRefactoredComponents() {
  // Get all refactored component files
  const componentsDir = path.join(healthDir, 'components');
  
  // Process all .refactored.tsx files in the components directory
  processDirectory(componentsDir);
  
  // Rename the refactored page
  const refactoredPage = path.join(healthDir, 'page.refactored.tsx');
  const originalPage = path.join(healthDir, 'page.tsx');
  
  if (fs.existsSync(refactoredPage)) {
    renameFile(refactoredPage, originalPage);
  }
  
  console.log('Component renaming completed successfully!');
}

// Function to process all files in a directory recursively
function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Recursively process subdirectories
      processDirectory(filePath);
    } else if (file.endsWith('.refactored.tsx')) {
      // Rename refactored component files
      const originalPath = filePath.replace('.refactored.tsx', '.tsx');
      renameFile(filePath, originalPath);
    }
  }
}

// Run the script
processRefactoredComponents();
