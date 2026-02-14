/**
 * Fix Build Script for Vet1Stop
 * 
 * This script helps fix common build issues:
 * 1. Cleans the Next.js build cache
 * 2. Fixes type compatibility issues in API routes
 * 3. Validates environment variables
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

console.log(`${colors.bright}${colors.cyan}Vet1Stop Build Fix Utility${colors.reset}\n`);

// Step 1: Clean the Next.js build cache
console.log(`${colors.bright}Step 1: Cleaning Next.js build cache...${colors.reset}`);
try {
  if (fs.existsSync(path.join(__dirname, '.next'))) {
    fs.rmSync(path.join(__dirname, '.next'), { recursive: true, force: true });
    console.log(`${colors.green}✓ Successfully removed .next directory${colors.reset}`);
  } else {
    console.log(`${colors.yellow}! .next directory doesn't exist, skipping cleanup${colors.reset}`);
  }
} catch (error) {
  console.error(`${colors.red}✗ Failed to remove .next directory: ${error.message}${colors.reset}`);
}

// Step 2: Fix API route parameter typing
console.log(`\n${colors.bright}Step 2: Fixing API route parameter typing...${colors.reset}`);

const apiDir = path.join(__dirname, 'src', 'app', 'api');
let fixedFiles = 0;

function fixApiRouteFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check for the problematic pattern
    const contextParamsPattern = /export\s+async\s+function\s+\w+\(\s*[^,\)]+,\s*context\s*:\s*{\s*params\s*:/g;
    if (contextParamsPattern.test(content)) {
      // Replace the problematic pattern
      const fixedContent = content.replace(
        /export\s+async\s+function\s+(\w+)\(\s*([^,\)]+),\s*context\s*:\s*{\s*params\s*:\s*([^}]+)}\s*\)/g,
        'export async function $1(\n  $2,\n  { params }: { params: $3 }\n)'
      );
      
      // Replace context.params with params
      const fixedContent2 = fixedContent.replace(/context\.params/g, 'params');
      
      // Write the fixed content back to the file
      fs.writeFileSync(filePath, fixedContent2, 'utf8');
      console.log(`${colors.green}✓ Fixed API route parameter typing in: ${path.relative(__dirname, filePath)}${colors.reset}`);
      fixedFiles++;
      return true;
    }
    return false;
  } catch (error) {
    console.error(`${colors.red}✗ Error processing file ${filePath}: ${error.message}${colors.reset}`);
    return false;
  }
}

function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else if (entry.name.endsWith('route.ts')) {
      fixApiRouteFile(fullPath);
    }
  }
}

try {
  scanDirectory(apiDir);
  console.log(`${colors.green}✓ Fixed ${fixedFiles} API route files${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}✗ Error scanning API directory: ${error.message}${colors.reset}`);
}

// Step 3: Validate environment variables
console.log(`\n${colors.bright}Step 3: Validating environment variables...${colors.reset}`);

const envFile = path.join(__dirname, '.env');
const envLocalFile = path.join(__dirname, '.env.local');

function checkEnvFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      console.log(`${colors.green}✓ Found environment file: ${path.basename(filePath)}${colors.reset}`);
      return true;
    } else {
      console.log(`${colors.yellow}! Missing environment file: ${path.basename(filePath)}${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.error(`${colors.red}✗ Error checking environment file: ${error.message}${colors.reset}`);
    return false;
  }
}

checkEnvFile(envFile);
checkEnvFile(envLocalFile);

// Step 4: Check for type errors in the generated files
console.log(`\n${colors.bright}Step 4: Checking for type errors...${colors.reset}`);

try {
  console.log(`${colors.yellow}Running TypeScript compiler to check for errors...${colors.reset}`);
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log(`${colors.green}✓ No TypeScript errors found${colors.reset}`);
} catch (error) {
  console.error(`${colors.yellow}! TypeScript errors found. These may need to be fixed manually.${colors.reset}`);
}

console.log(`\n${colors.bright}${colors.green}Build fix process completed!${colors.reset}`);
console.log(`${colors.cyan}Try running 'npm run dev' to start the development server.${colors.reset}`);
