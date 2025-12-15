#!/usr/bin/env node

/**
 * Script to check if .env variables are loaded
 * Usage: npm run check-env
 */

const fs = require('fs');
const path = require('path');

console.log('Checking environment variables...\n');

const envPath = path.join(process.cwd(), '.env');

// Check if .env file exists
if (!fs.existsSync(envPath)) {
  console.log('✗ .env file not found\n');
  console.log('Please create a .env file in the project root.');
  process.exit(1);
}

console.log('✓ .env file found\n');

// Read .env file
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach((line) => {
  // Skip empty lines and comments
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;

  const match = trimmed.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim();
    envVars[key] = value;
  }
});

console.log(`Variables in .env file (${Object.keys(envVars).length} found):`);
Object.entries(envVars).forEach(([key, value]) => {
  // Hide sensitive values
  const displayValue = 
    key.includes('KEY') || key.includes('SECRET') || key.includes('PASSWORD')
      ? '***hidden***'
      : value;
  console.log(`  ${key} = ${displayValue}`);
});

console.log('\nVariables loaded in environment:');
let loadedCount = 0;
Object.keys(envVars).forEach((key) => {
  const envValue = process.env[key];
  if (envValue) {
    const displayValue = 
      key.includes('KEY') || key.includes('SECRET') || key.includes('PASSWORD')
        ? '***hidden***'
        : envValue;
    console.log(`  ✓ ${key} = ${displayValue}`);
    loadedCount++;
  } else {
    console.log(`  ✗ ${key} = (not loaded)`);
  }
});

console.log(
  `\nSummary: ${loadedCount} of ${Object.keys(envVars).length} variables are loaded in environment`
);

