// Simple script to force TypeScript to rebuild its configuration
// This helps resolve issues with missing files in the TypeScript program
const fs = require('fs');
const path = require('path');

// Path to the problematic temporary file
const tempFilePath = path.join(__dirname, 'src', 'components', 'shared', 'AdvancedFilterPanel.temp.tsx');

// Check if the file exists and delete it
if (fs.existsSync(tempFilePath)) {
  console.log(`Deleting temporary file: ${tempFilePath}`);
  fs.unlinkSync(tempFilePath);
} else {
  console.log(`File not found: ${tempFilePath}`);
}

// Create a temporary tsconfig file
const tsconfigTempPath = path.join(__dirname, 'tsconfig.temp.json');
const tsconfigPath = path.join(__dirname, 'tsconfig.json');

// Read the current tsconfig
const tsconfig = require(tsconfigPath);

// Add the problematic file to explicit exclude list
if (!tsconfig.exclude) {
  tsconfig.exclude = [];
}

// Make sure we exclude temp files
if (!tsconfig.exclude.includes('**/*.temp.ts')) {
  tsconfig.exclude.push('**/*.temp.ts');
}

if (!tsconfig.exclude.includes('**/*.temp.tsx')) {
  tsconfig.exclude.push('**/*.temp.tsx');
}

// Explicitly exclude the specific problematic file
const specificExclude = 'src/components/shared/AdvancedFilterPanel.temp.tsx';
if (!tsconfig.exclude.includes(specificExclude)) {
  tsconfig.exclude.push(specificExclude);
}

// Write the updated config to a temp file
fs.writeFileSync(tsconfigTempPath, JSON.stringify(tsconfig, null, 2));
console.log(`Updated TypeScript configuration written to: ${tsconfigTempPath}`);

// Replace the original config with the updated one
fs.copyFileSync(tsconfigTempPath, tsconfigPath);
console.log(`Original TypeScript configuration updated.`);

// Clean up the temp config file
fs.unlinkSync(tsconfigTempPath);
console.log('Cleanup completed successfully.');

console.log('\nNext steps:');
console.log('1. Restart your development server');
console.log('2. If the error persists, close and reopen your editor');
