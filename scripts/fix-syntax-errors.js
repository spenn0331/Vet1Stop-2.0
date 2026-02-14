/**
 * Fix Syntax Errors Script
 * 
 * This script fixes common syntax errors in the codebase,
 * particularly focusing on the "Unexpected token ')'" error.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Function to fix the API route files
function fixApiRouteFiles() {
  console.log('Fixing API route files...');
  
  // List of files to check and fix
  const filesToFix = [
    path.join(__dirname, '..', 'src', 'app', 'api', 'resources', '[id]', 'route.ts'),
    path.join(__dirname, '..', 'src', 'app', 'api', 'resources', 'route.ts'),
    path.join(__dirname, '..', 'src', 'app', 'api', 'health', 'resources', 'route.ts')
  ];
  
  filesToFix.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      console.log(`Checking ${filePath}...`);
      
      // Read the file content
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Fix common syntax errors
      
      // 1. Fix missing parentheses in async function declarations
      content = content.replace(/export async function ([A-Za-z]+)\s*\(\s*([^)]*)\s*\)\s*{/g, 'export async function $1($2) {');
      
      // 2. Fix missing commas in object literals
      content = content.replace(/}\s*\n\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '},\n  $1:');
      
      // 3. Fix missing semicolons
      content = content.replace(/}\s*\n/g, '};\n');
      
      // 4. Fix parameter destructuring syntax
      content = content.replace(/context: { params: { ([a-zA-Z_$][a-zA-Z0-9_$]*): ([a-zA-Z_$][a-zA-Z0-9_$]*) } }/g, '{ params }: { params: { $1: $2 } }');
      
      // Write the fixed content back to the file
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed ${filePath}`);
    } else {
      console.log(`File not found: ${filePath}`);
    }
  });
}

// Function to restart the development server
function restartDevServer() {
  console.log('Restarting development server...');
  
  try {
    // Kill any existing process on port 3006
    execSync('npx kill-port 3006', { stdio: 'inherit' });
    console.log('Killed existing process on port 3006');
    
    // Start the development server in a new process
    const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const child = require('child_process').spawn(npm, ['run', 'dev'], {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
      detached: true
    });
    
    // Unref the child process so it can run independently
    child.unref();
    
    console.log('Development server restarted');
  } catch (error) {
    console.error('Error restarting development server:', error);
  }
}

// Main function
(async function main() {
  console.log('Starting syntax error fix script...');
  
  // Fix API route files
  fixApiRouteFiles();
  
  // Restart the development server
  restartDevServer();
  
  console.log('Syntax error fix script completed');
})();
