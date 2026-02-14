/**
 * Fix Health TypeScript Errors Script
 * 
 * This script identifies and fixes common TypeScript errors in the health page components.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Base directory for health components
const healthDir = path.join(__dirname, '..', 'src', 'app', 'health');
const componentsDir = path.join(healthDir, 'components');

// Function to fix common TypeScript errors
function fixTypeScriptErrors() {
  console.log('Fixing TypeScript errors in health components...');
  
  // Fix 1: Update imports in NGOResourcesSection.tsx
  const ngoResourcesSectionPath = path.join(componentsDir, 'NGOResourcesSection.tsx');
  if (fs.existsSync(ngoResourcesSectionPath)) {
    let content = fs.readFileSync(ngoResourcesSectionPath, 'utf8');
    
    // Ensure proper imports
    if (!content.includes("import { NGOResource } from '../types/health-types';")) {
      content = content.replace(
        "// Import types, utils and constants",
        "// Import types, utils and constants\nimport { NGOResource, HealthResource } from '../types/health-types';"
      );
    }
    
    // Fix handleToggleFavorite function
    content = content.replace(
      /const handleToggleFavorite = useCallback\(\(.*?\) => {/,
      "const handleToggleFavorite = useCallback((resource: NGOResource | string) => {"
    );
    
    // Fix onSave prop in ResourceDetailView
    content = content.replace(
      /onSave={handleToggleFavorite}/g,
      "onSave={(resource) => handleToggleFavorite(resource)}"
    );
    
    fs.writeFileSync(ngoResourcesSectionPath, content);
    console.log('Fixed NGOResourcesSection.tsx');
  }
  
  // Fix 2: Update VirtualizedResourceGrid.tsx
  const virtualizedGridPath = path.join(componentsDir, 'VirtualizedResourceGrid.tsx');
  if (fs.existsSync(virtualizedGridPath)) {
    let content = fs.readFileSync(virtualizedGridPath, 'utf8');
    
    // Fix resourceId type conversion
    content = content.replace(
      /const resourceId = .*?;/,
      "const resourceId = (typeof resource._id === 'object' ? JSON.stringify(resource._id) : resource._id?.toString()) || resource.id || '';"
    );
    
    fs.writeFileSync(virtualizedGridPath, content);
    console.log('Fixed VirtualizedResourceGrid.tsx');
  }
  
  // Fix 3: Update EnhancedNGOResourcesSection.tsx
  const enhancedNGOPath = path.join(componentsDir, 'EnhancedNGOResourcesSection.tsx');
  if (fs.existsSync(enhancedNGOPath)) {
    try {
      let content = fs.readFileSync(enhancedNGOPath, 'utf8');
      
      // Fix syntax errors
      content = content.replace(/\}\}/g, "}");
      content = content.replace(/\{\{/g, "{");
      
      fs.writeFileSync(enhancedNGOPath, content);
      console.log('Fixed EnhancedNGOResourcesSection.tsx');
    } catch (error) {
      console.error(`Error fixing EnhancedNGOResourcesSection.tsx: ${error.message}`);
    }
  }
  
  // Fix 4: Update ResourceDetailView.backup.tsx
  const resourceDetailBackupPath = path.join(componentsDir, 'ResourceDetailView.backup.tsx');
  if (fs.existsSync(resourceDetailBackupPath)) {
    try {
      // Just rename the file to .bak to avoid TypeScript errors
      fs.renameSync(resourceDetailBackupPath, `${resourceDetailBackupPath}.bak`);
      console.log('Renamed ResourceDetailView.backup.tsx to .bak to avoid errors');
    } catch (error) {
      console.error(`Error renaming ResourceDetailView.backup.tsx: ${error.message}`);
    }
  }
  
  console.log('Finished fixing TypeScript errors');
}

// Run the TypeScript compiler to check for errors
function checkTypeScriptErrors() {
  console.log('Checking TypeScript errors...');
  
  try {
    execSync('npx tsc --noEmit', { stdio: 'inherit' });
    console.log('TypeScript check completed successfully!');
    return true;
  } catch (error) {
    console.error('TypeScript errors found. See above for details.');
    return false;
  }
}

// Main function
(async function main() {
  console.log('Starting TypeScript error fix process...');
  
  // Fix TypeScript errors
  fixTypeScriptErrors();
  
  // Check if errors are fixed
  const errorsFixed = checkTypeScriptErrors();
  
  if (errorsFixed) {
    console.log('\n✅ All TypeScript errors fixed successfully!');
  } else {
    console.log('\n⚠️ Some TypeScript errors remain. You may need to fix them manually.');
  }
})();
