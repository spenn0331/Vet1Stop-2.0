/**
 * Update Health Imports Script
 * 
 * This script updates the imports in the refactored health components
 * to use the correct paths and fix TypeScript errors.
 */

const fs = require('fs');
const path = require('path');

// Base directory for health components
const healthDir = path.join(__dirname, '..', 'src', 'app', 'health');

// Function to update imports in a file
function updateImportsInFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }

  console.log(`Updating imports in: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Update import paths
  content = content.replace(
    /from ['"]\.\.\/types\/health-types['"]/g,
    `from '../types/health-types'`
  );
  
  content = content.replace(
    /from ['"]\.\.\/utils\/health-constants['"]/g,
    `from '../utils/health-constants'`
  );
  
  content = content.replace(
    /from ['"]\.\.\/utils\/health-utils['"]/g,
    `from '../utils/health-utils'`
  );
  
  content = content.replace(
    /from ['"]\.\.\/utils\/local-storage-utils['"]/g,
    `from '../utils/local-storage-utils'`
  );
  
  // Write the updated content back to the file
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated: ${filePath}`);
}

// Function to process all refactored components
function processRefactoredComponents() {
  // Get all refactored component files
  const componentsDir = path.join(healthDir, 'components');
  const utilsDir = path.join(healthDir, 'utils');
  const typesDir = path.join(healthDir, 'types');
  
  // Create directories if they don't exist
  [componentsDir, utilsDir, typesDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
  
  // Process all .refactored.tsx files in the components directory
  processDirectory(componentsDir);
  
  // Process utils and types directories
  updateImportsInFile(path.join(utilsDir, 'health-utils.ts'));
  updateImportsInFile(path.join(utilsDir, 'health-constants.ts'));
  updateImportsInFile(path.join(utilsDir, 'local-storage-utils.ts'));
  updateImportsInFile(path.join(typesDir, 'health-types.ts'));
  
  console.log('Import updates completed successfully!');
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
    } else if (file.endsWith('.refactored.tsx') || file.endsWith('.tsx')) {
      // Update imports in refactored component files
      updateImportsInFile(filePath);
    }
  }
}

// Run the script
processRefactoredComponents();
