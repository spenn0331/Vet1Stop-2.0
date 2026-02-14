/**
 * Cleanup script for the health page
 * 
 * This script identifies and lists files that are no longer needed
 * after the health page rebuild.
 */

const fs = require('fs');
const path = require('path');

// Define the health components directory
const healthComponentsDir = path.join(__dirname, '..', 'src', 'app', 'health', 'components');

// Define files that are still needed in the new implementation
const requiredFiles = [
  'CrisisBanner.tsx',
  'HeroSection.tsx',
  'NGOResourcesSection.tsx',
  'ResourceFinderSection.tsx',
  'ResourcePathwaysSection.tsx',
  'StateResourcesSection.tsx',
  'UnifiedResourceFinder.tsx',
  'VAHealthcareBenefitsSection.tsx',
  // Shared components
  'shared/FilterPanel.tsx',
  'shared/Pagination.tsx',
  'shared/ResourceCard.tsx',
  'shared/ResourceDetailView.tsx',
  'shared/ResourceGrid.tsx',
  'shared/RequestInfoModal.tsx',
  'shared/StandaloneModal.tsx'
];

// Function to check if a file is required
function isRequired(filePath) {
  const relativePath = path.relative(healthComponentsDir, filePath).replace(/\\/g, '/');
  return requiredFiles.some(file => relativePath === file || relativePath.startsWith('shared/'));
}

// Function to list all files in a directory recursively
function listFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      listFiles(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Get all files in the health components directory
const allFiles = listFiles(healthComponentsDir);

// Filter out required files to get the list of files to delete
const filesToDelete = allFiles.filter(file => !isRequired(file));

// Print the list of files to delete
console.log('Files that can be deleted:');
filesToDelete.forEach(file => {
  console.log(`- ${path.relative(path.join(__dirname, '..'), file)}`);
});

console.log(`\nTotal: ${filesToDelete.length} files can be deleted.`);
console.log('\nTo delete these files, run this script with the --delete flag:');
console.log('node scripts/cleanup-health-page.js --delete');

// If --delete flag is provided, delete the files
if (process.argv.includes('--delete')) {
  console.log('\nDeleting files...');
  
  filesToDelete.forEach(file => {
    try {
      fs.unlinkSync(file);
      console.log(`Deleted: ${path.relative(path.join(__dirname, '..'), file)}`);
    } catch (err) {
      console.error(`Error deleting ${file}: ${err.message}`);
    }
  });
  
  console.log(`\nDeleted ${filesToDelete.length} files.`);
}
