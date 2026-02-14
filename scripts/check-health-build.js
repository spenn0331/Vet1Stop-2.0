/**
 * Check Health Build Script
 * 
 * This script checks if the health page builds correctly after refactoring.
 * It runs the TypeScript compiler to check for any type errors.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Base directory for health components
const healthDir = path.join(__dirname, '..', 'src', 'app', 'health');

// Function to check TypeScript errors
function checkTypeScriptErrors() {
  console.log('Checking TypeScript errors...');
  
  try {
    // Run TypeScript compiler to check for errors
    const result = execSync('npx tsc --noEmit', { encoding: 'utf8' });
    console.log('TypeScript check completed successfully!');
    return true;
  } catch (error) {
    console.error('TypeScript errors found:');
    console.error(error.stdout);
    
    // Extract health-related errors
    const healthErrors = error.stdout
      .split('\n')
      .filter(line => line.includes('health'))
      .join('\n');
    
    console.log('\nHealth-related errors:');
    console.log(healthErrors);
    
    return false;
  }
}

// Function to check if all required files exist
function checkRequiredFiles() {
  console.log('Checking required files...');
  
  const requiredFiles = [
    path.join(healthDir, 'page.tsx'),
    path.join(healthDir, 'types', 'health-types.ts'),
    path.join(healthDir, 'utils', 'health-constants.ts'),
    path.join(healthDir, 'utils', 'health-utils.ts'),
    path.join(healthDir, 'utils', 'local-storage-utils.ts'),
    path.join(healthDir, 'components', 'CrisisBanner.tsx'),
    path.join(healthDir, 'components', 'HeroSection.tsx'),
    path.join(healthDir, 'components', 'SimplifiedTabNavigation.tsx'),
    path.join(healthDir, 'components', 'NGOResourcesSection.tsx'),
    path.join(healthDir, 'components', 'EnhancedResourceFinderSection.tsx'),
    path.join(healthDir, 'components', 'EnhancedVABenefitsSection.tsx'),
    path.join(healthDir, 'components', 'HealthResourceExplorer.tsx'),
    path.join(healthDir, 'components', 'ResourceDetailView.tsx'),
    path.join(healthDir, 'components', 'ResourceFinderSection.tsx')
  ];
  
  const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
  
  if (missingFiles.length > 0) {
    console.error('Missing required files:');
    missingFiles.forEach(file => console.error(`- ${file}`));
    return false;
  }
  
  console.log('All required files exist!');
  return true;
}

// Function to check shared components
function checkSharedComponents() {
  console.log('Checking shared components...');
  
  const sharedComponentsDir = path.join(healthDir, 'components', 'shared');
  
  if (!fs.existsSync(sharedComponentsDir)) {
    console.error('Shared components directory not found!');
    return false;
  }
  
  const requiredSharedComponents = [
    'FilterPanel.tsx',
    'Pagination.tsx',
    'RequestInfoModal.tsx',
    'ResourceCard.tsx',
    'ResourceDetailView.tsx',
    'ResourceGrid.tsx',
    'StandaloneModal.tsx'
  ];
  
  const missingComponents = requiredSharedComponents.filter(
    component => !fs.existsSync(path.join(sharedComponentsDir, component))
  );
  
  if (missingComponents.length > 0) {
    console.error('Missing shared components:');
    missingComponents.forEach(component => console.error(`- ${component}`));
    return false;
  }
  
  console.log('All shared components exist!');
  return true;
}

// Run the checks
console.log('Running health page build checks...');

const filesExist = checkRequiredFiles();
const sharedComponentsExist = checkSharedComponents();
const typeScriptPasses = checkTypeScriptErrors();

if (filesExist && sharedComponentsExist && typeScriptPasses) {
  console.log('\n✅ Health page refactoring completed successfully!');
} else {
  console.log('\n❌ Health page refactoring has issues that need to be fixed.');
  
  if (!filesExist) {
    console.log('- Some required files are missing.');
  }
  
  if (!sharedComponentsExist) {
    console.log('- Some shared components are missing.');
  }
  
  if (!typeScriptPasses) {
    console.log('- TypeScript errors need to be fixed.');
  }
}
