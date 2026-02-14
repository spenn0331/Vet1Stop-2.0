/**
 * Apply Filter Refactoring Script
 * 
 * This script applies the refactored filter components to the production codebase.
 * It backs up the original files, copies the new implementation, and updates imports.
 * 
 * Usage: 
 * - Run from the project root: node scripts/apply-filter-refactoring.js
 * - To revert: node scripts/apply-filter-refactoring.js --revert
 */

const fs = require('fs');
const path = require('path');

// Configuration
const BACKUP_FOLDER = '.backup';
const FILES_TO_UPDATE = {
  // Source file -> Target file
  'src/app/health/components/ResourceFinderSection.fixed.tsx': 'src/app/health/components/ResourceFinderSection.tsx',
};

// Create backup directory if it doesn't exist
if (!fs.existsSync(BACKUP_FOLDER)) {
  fs.mkdirSync(BACKUP_FOLDER, { recursive: true });
}

// Check if we're in revert mode
const isRevertMode = process.argv.includes('--revert');

if (isRevertMode) {
  console.log('🔄 REVERTING CHANGES...');
  
  // For each file, restore from backup if exists
  Object.values(FILES_TO_UPDATE).forEach(targetFile => {
    const backupFile = path.join(BACKUP_FOLDER, path.basename(targetFile));
    
    if (fs.existsSync(backupFile)) {
      console.log(`🔄 Restoring ${targetFile} from backup...`);
      
      try {
        // Copy backup back to original location
        fs.copyFileSync(backupFile, targetFile);
        console.log(`✅ Restored ${targetFile}`);
      } catch (error) {
        console.error(`❌ Error restoring ${targetFile}:`, error.message);
      }
    } else {
      console.warn(`⚠️ No backup found for ${targetFile}`);
    }
  });
  
  console.log('🔄 REVERT COMPLETE!');
  
} else {
  console.log('🚀 APPLYING FILTER REFACTORING...');
  
  // Process each file
  Object.entries(FILES_TO_UPDATE).forEach(([sourceFile, targetFile]) => {
    if (!fs.existsSync(sourceFile)) {
      console.error(`❌ Source file not found: ${sourceFile}`);
      return;
    }
    
    // Create backup of target file if it exists
    if (fs.existsSync(targetFile)) {
      const backupFile = path.join(BACKUP_FOLDER, path.basename(targetFile));
      console.log(`📦 Backing up ${targetFile} to ${backupFile}...`);
      
      try {
        fs.copyFileSync(targetFile, backupFile);
        console.log(`✅ Backup created`);
      } catch (error) {
        console.error(`❌ Error creating backup:`, error.message);
        return; // Skip this file if backup fails
      }
    }
    
    // Copy source file to target
    console.log(`📋 Copying ${sourceFile} to ${targetFile}...`);
    
    try {
      fs.copyFileSync(sourceFile, targetFile);
      console.log(`✅ Updated ${targetFile}`);
    } catch (error) {
      console.error(`❌ Error updating ${targetFile}:`, error.message);
    }
  });
  
  // Log completion message with next steps
  console.log('\n✅ FILTER REFACTORING APPLIED!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Test the application: npm run dev');
  console.log('2. Visit the health page to verify all filters work correctly');
  console.log('3. If there are any issues, revert with: node scripts/apply-filter-refactoring.js --revert');
  console.log('');
  console.log('See .workflow/filter-components-integration-plan.md for more details');
}
