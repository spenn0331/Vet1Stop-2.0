/**
 * Enhanced Development Server Starter for Vet1Stop
 * 
 * This script starts the Next.js development server with additional debugging options
 * and provides more detailed error reporting.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

console.log(`${colors.bright}${colors.cyan}Vet1Stop Enhanced Development Server${colors.reset}\n`);

// Check if the .next directory exists and delete it if it does
const nextDir = path.join(__dirname, '.next');
if (fs.existsSync(nextDir)) {
  console.log(`${colors.yellow}Cleaning existing .next directory...${colors.reset}`);
  try {
    fs.rmSync(nextDir, { recursive: true, force: true });
    console.log(`${colors.green}Successfully removed .next directory${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Failed to remove .next directory: ${error.message}${colors.reset}`);
  }
}

// Set environment variables for better debugging
process.env.NODE_OPTIONS = '--trace-warnings --trace-deprecation';

console.log(`${colors.bright}Starting Next.js development server with enhanced debugging...${colors.reset}`);
console.log(`${colors.yellow}This may take a moment. Please be patient.${colors.reset}\n`);

// Start the Next.js development server with additional flags
const devServer = spawn('npx', ['next', 'dev', '--port', '3000', '--hostname', 'localhost'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    NEXT_TELEMETRY_DISABLED: '1', // Disable telemetry for faster startup
    NODE_ENV: 'development'
  }
});

// Handle server process events
devServer.on('error', (error) => {
  console.error(`${colors.red}Failed to start development server: ${error.message}${colors.reset}`);
});

// Log when the process exits
devServer.on('close', (code) => {
  if (code === 0) {
    console.log(`${colors.green}Development server has been stopped gracefully.${colors.reset}`);
  } else {
    console.error(`${colors.red}Development server exited with code ${code}${colors.reset}`);
  }
});

// Display helpful information
console.log(`${colors.bright}${colors.cyan}Server Information:${colors.reset}`);
console.log(`- URL: ${colors.green}http://localhost:3000${colors.reset}`);
console.log(`- Press ${colors.yellow}Ctrl+C${colors.reset} to stop the server`);
console.log(`- Next.js logs will appear below\n`);

// Keep the process running
process.on('SIGINT', () => {
  console.log(`\n${colors.yellow}Shutting down development server...${colors.reset}`);
  devServer.kill('SIGINT');
  process.exit(0);
});
