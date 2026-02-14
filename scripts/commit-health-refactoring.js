/**
 * Commit Health Refactoring Script
 * 
 * This script commits the health page refactoring changes to the repository.
 */

const { execSync } = require('child_process');
const path = require('path');

// Function to commit changes to the repository
function commitChanges() {
  console.log('Committing health page refactoring changes to the repository...');
  
  try {
    // Add all changes
    execSync('git add .', { stdio: 'inherit' });
    
    // Commit changes
    execSync('git commit -m "Fix Health page: Restore original functionality and fix component syntax errors"', { stdio: 'inherit' });
    
    console.log('Successfully committed health page refactoring changes to the repository!');
    return true;
  } catch (error) {
    console.error(`Error committing changes: ${error.message}`);
    return false;
  }
}

// Main function
(async function main() {
  console.log('Starting commit process for health page refactoring...');
  
  // Commit changes
  const committed = commitChanges();
  
  if (committed) {
    console.log('\n✅ Health page refactoring changes committed successfully!');
    console.log('\nNext steps:');
    console.log('1. Test the Health page thoroughly, especially the EnhancedResourceFinderSection');
    console.log('2. Verify that resource filtering, searching, and pagination work correctly');
    console.log('3. Ensure the resource detail view displays correctly with all action buttons');
    console.log('4. Check that the patriotic color scheme is properly applied');
    console.log('5. Update the .workflow directory files to reflect current project status');
  } else {
    console.log('\n⚠️ Failed to commit health page refactoring changes.');
    console.log('Please commit the changes manually using git commands.');
  }
})();
