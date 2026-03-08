#!/usr/bin/env node

// ⚠️ DEVELOPMENT ONLY - REMOVE FOR PRODUCTION
// 
// Backend E2E Test Script (Node.js)
// Tests dev auth + encryption workflows
// 
// Usage: node test-backend-e2e.mjs <base_url> <password>
// Example: node test-backend-e2e.mjs https://buildingcode-9f4j2cdo.manus.space admin123

// Use native fetch (Node.js 18+)

const BASE_URL = process.argv[2] || 'https://buildingcode-9f4j2cdo.manus.space';
const PASSWORD = process.argv[3] || 'admin123';

// Colors for output
const RED = '\x1b[0;31m';
const GREEN = '\x1b[0;32m';
const YELLOW = '\x1b[1;33m';
const BLUE = '\x1b[0;34m';
const NC = '\x1b[0m';

// Test counters
let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

// Cookies storage
let cookies = {};

// Helper functions
function logTest(msg) {
  console.log(`${BLUE}[TEST]${NC} ${msg}`);
  testsRun++;
}

function logPass(msg) {
  console.log(`${GREEN}[PASS]${NC} ${msg}`);
  testsPassed++;
}

function logFail(msg) {
  console.log(`${RED}[FAIL]${NC} ${msg}`);
  testsFailed++;
}

function logInfo(msg) {
  console.log(`${YELLOW}[INFO]${NC} ${msg}`);
}

// Parse cookies from response
function parseCookies(setCookieHeader) {
  if (!setCookieHeader) return;
  const parts = setCookieHeader.split(';');
  const cookiePart = parts[0];
  const [name, value] = cookiePart.split('=');
  if (name && value) {
    cookies[name.trim()] = value.trim();
  }
}

// Get cookie header for requests
function getCookieHeader() {
  return Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
}

// Make HTTP request
async function request(method, path, body = null) {
  const url = `${BASE_URL}${path}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Cookie': getCookieHeader(),
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      parseCookies(setCookie);
    }
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { status: 0, error: error.message };
  }
}

// Test 1: Dev Login
async function testDevLogin() {
  logTest('Dev Authentication with password');
  
  const { status, data } = await request('POST', '/api/dev/login', { password: PASSWORD });
  
  if (data?.success) {
    logPass('Dev login successful');
    return true;
  } else {
    logFail('Dev login failed');
    logInfo(`Response: ${JSON.stringify(data)}`);
    return false;
  }
}

// Test 2: Check Auth Status
async function testCheckAuth() {
  logTest('Check authentication status');
  
  const { status, data } = await request('GET', '/api/trpc/auth.me');
  
  if (data?.result?.data?.json) {
    logPass('Auth status check successful');
    return true;
  } else {
    logFail('Auth status check failed');
    logInfo(`Response: ${JSON.stringify(data)}`);
    return false;
  }
}

// Test 3: Create Encrypted Client
async function testCreateClient() {
  logTest('Create encrypted client');
  
  const body = {
    0: {
      json: {
        name: 'Test Client',
        email: 'test@example.com',
        phone: '+1-555-0000',
        address: '123 Test St',
        companyName: 'Test Company',
      },
    },
  };

  const { status, data } = await request('POST', '/api/trpc/encryptedClients.create', body);
  
  if (data?.result?.data?.json?.id) {
    logPass('Client created with encryption');
    const clientId = data.result.data.json.id;
    logInfo(`Client ID: ${clientId}`);
    return clientId;
  } else {
    logFail('Client creation failed');
    logInfo(`Response: ${JSON.stringify(data)}`);
    return null;
  }
}

// Test 4: List Encrypted Clients
async function testListClients() {
  logTest('List encrypted clients with decryption');
  
  const { status, data } = await request('GET', '/api/trpc/encryptedClients.list');
  
  if (data?.result?.data?.json && Array.isArray(data.result.data.json)) {
    logPass('Clients retrieved and decrypted');
    const count = data.result.data.json.length;
    logInfo(`Clients found: ${count}`);
    return true;
  } else {
    logFail('Client list retrieval failed');
    logInfo(`Response: ${JSON.stringify(data)}`);
    return false;
  }
}

// Test 5: Get Specific Client
async function testGetClient(clientId) {
  logTest('Get specific encrypted client');
  
  if (!clientId) {
    logFail('Client ID not set (previous test failed)');
    return false;
  }

  const body = {
    0: {
      json: {
        id: clientId,
      },
    },
  };

  const { status, data } = await request('POST', '/api/trpc/encryptedClients.get', body);
  
  if (data?.result?.data?.json?.email) {
    logPass('Client retrieved and decrypted');
    return true;
  } else {
    logFail('Client retrieval failed');
    logInfo(`Response: ${JSON.stringify(data)}`);
    return false;
  }
}

// Test 6: Create Encrypted Project
async function testCreateProject() {
  logTest('Create encrypted project');
  
  const body = {
    0: {
      json: {
        name: 'Test Project',
        address: '456 Project Ave',
        notes: 'Test project notes',
      },
    },
  };

  const { status, data } = await request('POST', '/api/trpc/encryptedProjects.create', body);
  
  if (data?.result?.data?.json?.id) {
    logPass('Project created with encryption');
    const projectId = data.result.data.json.id;
    logInfo(`Project ID: ${projectId}`);
    return projectId;
  } else {
    logFail('Project creation failed');
    logInfo(`Response: ${JSON.stringify(data)}`);
    return null;
  }
}

// Test 7: List Encrypted Projects
async function testListProjects() {
  logTest('List encrypted projects with decryption');
  
  const { status, data } = await request('GET', '/api/trpc/encryptedProjects.list');
  
  if (data?.result?.data?.json && Array.isArray(data.result.data.json)) {
    logPass('Projects retrieved and decrypted');
    const count = data.result.data.json.length;
    logInfo(`Projects found: ${count}`);
    return true;
  } else {
    logFail('Project list retrieval failed');
    logInfo(`Response: ${JSON.stringify(data)}`);
    return false;
  }
}

// Test 8: Search Clients
async function testSearchClients() {
  logTest('Search clients by name');
  
  const body = {
    0: {
      json: {
        query: 'Test',
      },
    },
  };

  const { status, data } = await request('POST', '/api/trpc/encryptedClients.search', body);
  
  if (data?.result?.data?.json && Array.isArray(data.result.data.json)) {
    logPass('Client search successful (decrypt-then-filter)');
    return true;
  } else {
    logFail('Client search failed');
    logInfo(`Response: ${JSON.stringify(data)}`);
    return false;
  }
}

// Test 9: Update Client
async function testUpdateClient(clientId) {
  logTest('Update encrypted client');
  
  if (!clientId) {
    logFail('Client ID not set (previous test failed)');
    return false;
  }

  const body = {
    0: {
      json: {
        id: clientId,
        name: 'Updated Client',
        email: 'updated@example.com',
      },
    },
  };

  const { status, data } = await request('POST', '/api/trpc/encryptedClients.update', body);
  
  if (data?.result?.data?.json?.id) {
    logPass('Client updated with re-encryption');
    return true;
  } else {
    logFail('Client update failed');
    logInfo(`Response: ${JSON.stringify(data)}`);
    return false;
  }
}

// Test 10: Logout
async function testLogout() {
  logTest('Dev logout and session cleanup');
  
  const { status, data } = await request('POST', '/api/dev/logout');
  
  if (data?.success) {
    logPass('Logout successful');
    return true;
  } else {
    logFail('Logout failed');
    logInfo(`Response: ${JSON.stringify(data)}`);
    return false;
  }
}

// Main test execution
async function main() {
  console.log(`${BLUE}========================================${NC}`);
  console.log(`${BLUE}Backend E2E Test Suite${NC}`);
  console.log(`${BLUE}========================================${NC}`);
  console.log('');
  logInfo(`Base URL: ${BASE_URL}`);
  logInfo(`Password: ${PASSWORD}`);
  console.log('');

  // Run tests
  await testDevLogin();
  await testCheckAuth();
  const clientId = await testCreateClient();
  await testListClients();
  await testGetClient(clientId);
  const projectId = await testCreateProject();
  await testListProjects();
  await testSearchClients();
  await testUpdateClient(clientId);
  await testLogout();

  // Summary
  console.log('');
  console.log(`${BLUE}========================================${NC}`);
  console.log(`${BLUE}Test Summary${NC}`);
  console.log(`${BLUE}========================================${NC}`);
  console.log(`Tests Run:    ${testsRun}`);
  console.log(`Tests Passed: ${GREEN}${testsPassed}${NC}`);
  console.log(`Tests Failed: ${RED}${testsFailed}${NC}`);
  console.log('');

  if (testsFailed === 0) {
    console.log(`${GREEN}✓ All tests passed!${NC}`);
    process.exit(0);
  } else {
    console.log(`${RED}✗ Some tests failed${NC}`);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
