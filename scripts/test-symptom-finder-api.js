/**
 * Script to test the symptom-finder API endpoint
 * 
 * This script:
 * 1. Makes a GET request to the symptom-finder API endpoint with test parameters
 * 2. Logs the response to verify it's working correctly
 */

const fetch = require('node-fetch');

// Test parameters
const testParams = [
  {
    name: 'Basic symptoms test',
    params: {
      symptoms: 'anxiety,depression,stress',
      severity: 3,
      supportType: 'any'
    }
  },
  {
    name: 'VA resources test',
    params: {
      symptoms: 'ptsd',
      severity: 4,
      supportType: 'va'
    }
  },
  {
    name: 'NGO resources test',
    params: {
      symptoms: 'substance-use',
      severity: 3,
      supportType: 'ngo'
    }
  },
  {
    name: 'No symptoms test (should return featured resources)',
    params: {
      severity: 3,
      supportType: 'any'
    }
  }
];

// Function to build query string from params
function buildQueryString(params) {
  return Object.entries(params)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
}

// Function to test the API
async function testSymptomFinderAPI() {
  console.log('Testing symptom-finder API endpoint...\n');
  
  // Base URL - assuming the app is running locally
  const baseUrl = 'http://localhost:3000/api/health/symptom-finder';
  
  for (const test of testParams) {
    console.log(`\n--- ${test.name} ---`);
    const queryString = buildQueryString(test.params);
    const url = `${baseUrl}?${queryString}`;
    
    console.log(`Request URL: ${url}`);
    
    try {
      console.log('Sending request...');
      const response = await fetch(url);
      
      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`Results: ${data.length} resources found`);
        
        if (data.length > 0) {
          console.log('\nSample resource:');
          console.log(JSON.stringify(data[0], null, 2));
        } else {
          console.log('No resources found for this query');
        }
      } else {
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Request failed:', error.message);
    }
  }
  
  console.log('\nAPI testing complete');
}

// Run the test
testSymptomFinderAPI().catch(console.error);
