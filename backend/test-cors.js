const axios = require('axios');
const { exec } = require('child_process');

const API_BASE_URL = 'http://localhost:3000';
const TEST_ORIGINS = [
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'https://coinz-tcfm.onrender.com',
    'https://spinmycoin.netlify.app'
];

async function testCors() {
    console.log('=== Starting CORS Tests ===');
    
    // Test 1: Simple GET request to health endpoint
    try {
        console.log('\nTest 1: Simple GET to /health');
        const response = await axios.get(`${API_BASE_URL}/health`, {
            headers: {
                'Origin': 'http://localhost:5500',
                'Accept': 'application/json'
            }
        });
        console.log('✅ Success:', response.status, response.statusText);
        console.log('Response headers:', JSON.stringify(response.headers, null, 2));
        console.log('Data:', response.data);
    } catch (error) {
        console.error('❌ Test 1 failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response headers:', error.response.headers);
        }
    }
    
    // Test 2: OPTIONS preflight request
    try {
        console.log('\nTest 2: OPTIONS preflight request');
        const response = await axios.options(`${API_BASE_URL}/api/auth/puzzle`, {
            headers: {
                'Origin': 'http://localhost:5500',
                'Access-Control-Request-Method': 'GET',
                'Access-Control-Request-Headers': 'authorization,content-type'
            }
        });
        console.log('✅ Success:', response.status, response.statusText);
        console.log('Response headers:', JSON.stringify(response.headers, null, 2));
    } catch (error) {
        console.error('❌ Test 2 failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response headers:', error.response.headers);
        }
    }
    
    // Test 3: Test with credentials
    try {
        console.log('\nTest 3: Request with credentials');
        const response = await axios.get(`${API_BASE_URL}/api/auth/test-auth`, {
            withCredentials: true,
            headers: {
                'Origin': 'http://localhost:5500',
                'Accept': 'application/json'
            }
        });
        console.log('✅ Success:', response.status, response.statusText);
        console.log('Data:', response.data);
    } catch (error) {
        console.error('❌ Test 3 failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
    
    console.log('\n=== CORS Tests Completed ===');
}

// Start the tests
testCors().catch(console.error);
