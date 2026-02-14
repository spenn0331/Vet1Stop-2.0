/**
 * Health Components Test Script
 * 
 * This script provides a way to test the refactored health page components
 * to ensure they function correctly with the new StandaloneRequestModal implementation.
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Configuration
const COMPONENTS_DIR = path.join(__dirname, '../src/app/health/components');
const TYPES_DIR = path.join(__dirname, '../src/app/health/types');
const LOG_DIR = path.join(__dirname, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'health-components-test.log');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Initialize log file
fs.writeFileSync(LOG_FILE, `Health Components Test - ${new Date().toISOString()}\n\n`);

// Logger function
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  let formattedMessage;
  
  switch (type) {
    case 'error':
      formattedMessage = chalk.red(`[ERROR] ${message}`);
      console.error(formattedMessage);
      break;
    case 'success':
      formattedMessage = chalk.green(`[SUCCESS] ${message}`);
      console.log(formattedMessage);
      break;
    case 'warning':
      formattedMessage = chalk.yellow(`[WARNING] ${message}`);
      console.warn(formattedMessage);
      break;
    default:
      formattedMessage = chalk.blue(`[INFO] ${message}`);
      console.log(formattedMessage);
  }
  
  fs.appendFileSync(LOG_FILE, `[${timestamp}] [${type.toUpperCase()}] ${message}\n`);
}

// Test functions
async function testComponentImports() {
  log('Testing component imports...');
  
  const componentsToTest = [
    'StateResourcesSection.tsx',
    'ResourceFinderSection.tsx',
    'shared/ResourceGrid.tsx',
    'shared/ResourceCard.tsx',
    'StandaloneRequestModal.tsx'
  ];
  
  let importErrors = 0;
  
  for (const component of componentsToTest) {
    const componentPath = path.join(COMPONENTS_DIR, component);
    
    try {
      if (fs.existsSync(componentPath)) {
        const content = fs.readFileSync(componentPath, 'utf8');
        
        // Check for import statements
        const hasOldImport = content.includes("import RequestInfoModal from './shared/RequestInfoModal'");
        const hasNewImport = content.includes("import StandaloneRequestModal from './StandaloneRequestModal'");
        
        if (hasOldImport) {
          log(`Component ${component} still imports the old RequestInfoModal`, 'warning');
          importErrors++;
        } else if (component !== 'StandaloneRequestModal.tsx' && !hasNewImport && component.includes('Section')) {
          log(`Component ${component} does not import StandaloneRequestModal`, 'warning');
          importErrors++;
        } else {
          log(`Component ${component} has correct imports`, 'success');
        }
      } else {
        log(`Component ${component} not found`, 'error');
        importErrors++;
      }
    } catch (error) {
      log(`Error testing ${component}: ${error.message}`, 'error');
      importErrors++;
    }
  }
  
  return importErrors === 0;
}

async function testTypeConsistency() {
  log('Testing type consistency...');
  
  const typesFiles = [
    'health-types.ts',
    'HealthResourceTypes.ts',
    'consolidated-health-types.ts'
  ];
  
  let typeErrors = 0;
  
  for (const typeFile of typesFiles) {
    const typePath = path.join(TYPES_DIR, typeFile);
    
    try {
      if (fs.existsSync(typePath)) {
        const content = fs.readFileSync(typePath, 'utf8');
        
        // Check for key interfaces
        const hasHealthResource = content.includes('export interface HealthResource');
        const hasRequestInfoFormData = content.includes('export interface RequestInfoFormData');
        
        if (!hasHealthResource) {
          log(`Type file ${typeFile} does not define HealthResource interface`, 'warning');
          typeErrors++;
        }
        
        if (typeFile === 'consolidated-health-types.ts' && !hasRequestInfoFormData) {
          log(`Consolidated type file does not define RequestInfoFormData interface`, 'warning');
          typeErrors++;
        }
        
        log(`Type file ${typeFile} checked`, 'success');
      } else {
        log(`Type file ${typeFile} not found`, 'error');
        typeErrors++;
      }
    } catch (error) {
      log(`Error testing ${typeFile}: ${error.message}`, 'error');
      typeErrors++;
    }
  }
  
  return typeErrors === 0;
}

async function testModalUsage() {
  log('Testing modal usage in components...');
  
  const componentsToTest = [
    'StateResourcesSection.tsx',
    'ResourceFinderSection.tsx'
  ];
  
  let modalErrors = 0;
  
  for (const component of componentsToTest) {
    const componentPath = path.join(COMPONENTS_DIR, component);
    
    try {
      if (fs.existsSync(componentPath)) {
        const content = fs.readFileSync(componentPath, 'utf8');
        
        // Check for modal usage
        const hasOldModal = content.includes('<RequestInfoModal');
        const hasNewModal = content.includes('<StandaloneRequestModal');
        const hasSubmitHandler = content.includes('handleRequestSubmit');
        
        if (hasOldModal) {
          log(`Component ${component} still uses the old RequestInfoModal`, 'warning');
          modalErrors++;
        }
        
        if (!hasNewModal) {
          log(`Component ${component} does not use StandaloneRequestModal`, 'warning');
          modalErrors++;
        }
        
        if (!hasSubmitHandler) {
          log(`Component ${component} does not have a handleRequestSubmit function`, 'warning');
          modalErrors++;
        }
        
        if (!hasOldModal && hasNewModal && hasSubmitHandler) {
          log(`Component ${component} correctly uses StandaloneRequestModal`, 'success');
        }
      } else {
        log(`Component ${component} not found`, 'error');
        modalErrors++;
      }
    } catch (error) {
      log(`Error testing ${component}: ${error.message}`, 'error');
      modalErrors++;
    }
  }
  
  return modalErrors === 0;
}

// Main test function
async function runTests() {
  log('Starting health components tests...');
  
  const importTestPassed = await testComponentImports();
  const typeTestPassed = await testTypeConsistency();
  const modalTestPassed = await testModalUsage();
  
  if (importTestPassed && typeTestPassed && modalTestPassed) {
    log('All tests passed successfully!', 'success');
  } else {
    log('Some tests failed. Check the logs for details.', 'error');
  }
  
  log('Tests completed.');
}

// Run the tests
runTests().catch(error => {
  log(`Unhandled error during tests: ${error.message}`, 'error');
});
