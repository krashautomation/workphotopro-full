/**
 * Test Appwrite Connection
 * 
 * This script tests if Appwrite is accessible and responding.
 * Run with: node scripts/test-appwrite-connection.js
 */

require('dotenv').config();
const https = require('https');
const http = require('http');

const APPWRITE_ENDPOINT = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://sfo.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;

console.log('🔍 Testing Appwrite Connection...\n');
console.log('📍 Endpoint:', APPWRITE_ENDPOINT);
console.log('📍 Project ID:', APPWRITE_PROJECT_ID || 'Not set');
console.log('');

// Extract hostname and path from endpoint
const url = new URL(APPWRITE_ENDPOINT);
const isHttps = url.protocol === 'https:';
const client = isHttps ? https : http;

// Test 1: Basic connectivity (health check endpoint)
function testHealthCheck() {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: '/health',
      method: 'GET',
      timeout: 10000,
    };

    const req = client.request(options, (res) => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          success: res.statusCode === 200,
          statusCode: res.statusCode,
          duration: duration,
          response: data,
        });
      });
    });

    req.on('error', (error) => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      reject({
        success: false,
        error: error.message,
        duration: duration,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject({
        success: false,
        error: 'Request timeout after 10 seconds',
        duration: 10000,
      });
    });

    req.end();
  });
}

// Test 2: Account API endpoint (requires project ID)
function testAccountEndpoint() {
  if (!APPWRITE_PROJECT_ID) {
    return Promise.resolve({
      success: false,
      error: 'Project ID not set - cannot test account endpoint',
    });
  }

  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: '/account',
      method: 'GET',
      timeout: 10000,
      headers: {
        'X-Appwrite-Project': APPWRITE_PROJECT_ID,
      },
    };

    const req = client.request(options, (res) => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        // 401 is expected if not authenticated, which means the endpoint is working
        const isWorking = res.statusCode === 401 || res.statusCode === 200;
        resolve({
          success: isWorking,
          statusCode: res.statusCode,
          duration: duration,
          message: res.statusCode === 401 
            ? 'Endpoint is accessible (401 = not authenticated, which is expected)'
            : res.statusCode === 200
            ? 'Endpoint is accessible and authenticated'
            : `Unexpected status: ${res.statusCode}`,
        });
      });
    });

    req.on('error', (error) => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      reject({
        success: false,
        error: error.message,
        duration: duration,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject({
        success: false,
        error: 'Request timeout after 10 seconds',
        duration: 10000,
      });
    });

    req.end();
  });
}

// Run tests
async function runTests() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Test 1: Health Check Endpoint');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    const healthResult = await testHealthCheck();
    if (healthResult.success) {
      console.log('✅ Health check PASSED');
      console.log(`   Status: ${healthResult.statusCode}`);
      console.log(`   Response time: ${healthResult.duration}ms`);
      console.log(`   Response: ${healthResult.response.substring(0, 100)}...`);
    } else {
      console.log('❌ Health check FAILED');
      console.log(`   Status: ${healthResult.statusCode}`);
    }
  } catch (error) {
    console.log('❌ Health check FAILED');
    console.log(`   Error: ${error.error || error.message}`);
    console.log(`   Duration: ${error.duration}ms`);
    console.log('\n⚠️  Appwrite appears to be DOWN or unreachable!');
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Test 2: Account API Endpoint');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    const accountResult = await testAccountEndpoint();
    if (accountResult.success) {
      console.log('✅ Account endpoint PASSED');
      console.log(`   Status: ${accountResult.statusCode}`);
      console.log(`   Response time: ${accountResult.duration}ms`);
      console.log(`   ${accountResult.message}`);
    } else {
      console.log('❌ Account endpoint FAILED');
      console.log(`   Error: ${accountResult.error}`);
    }
  } catch (error) {
    console.log('❌ Account endpoint FAILED');
    console.log(`   Error: ${error.error || error.message}`);
    console.log(`   Duration: ${error.duration}ms`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Summary');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('If both tests failed, Appwrite may be down.');
  console.log('Check status at: https://status.appwrite.io');
  console.log('Or try accessing:', APPWRITE_ENDPOINT);
}

runTests().catch(console.error);
