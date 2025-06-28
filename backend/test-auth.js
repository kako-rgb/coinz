const mongoose = require('mongoose');
const axios = require('axios');
const User = require('./models/User');

// Test configuration
const BASE_URL = 'https://coinz-tcfm.onrender.com/auth';
const TEST_PHONE = '+1234567890';
const TEST_PASSWORD = 'test1234';

// Helper function to make API calls
async function makeRequest(method, endpoint, data = null, token = null) {
    const config = {
        method,
        url: `${BASE_URL}${endpoint}`,
        headers: {},
        data
    };

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    try {
        const response = await axios(config);
        return { success: true, data: response.data };
    } catch (error) {
        return { 
            success: false, 
            error: error.response?.data?.error || error.message 
        };
    }
}

// Clean up test data
async function cleanup() {
    try {
        await User.deleteOne({ phoneNumber: TEST_PHONE });
        console.log('✅ Cleaned up test data');
    } catch (error) {
        console.error('Error cleaning up:', error);
    }
}

// Run tests
async function runTests() {
    console.log('🚀 Starting authentication flow tests...\n');

    // Clean up before starting
    await cleanup();

    // Test 1: Get a puzzle for registration
    console.log('1. Getting puzzle for registration...');
    const puzzleRes = await makeRequest('get', '/puzzle');
    if (!puzzleRes.success) {
        console.error('❌ Failed to get puzzle:', puzzleRes.error);
        return;
    }
    console.log('✅ Got puzzle:', puzzleRes.data.puzzle.question);

    // Test 2: Register a new user
    console.log('\n2. Registering new user...');
    const registerRes = await makeRequest('post', '/register', {
        phoneNumber: TEST_PHONE,
        password: TEST_PASSWORD,
        puzzleToken: puzzleRes.data.puzzle.token,
        puzzleAnswer: '5', // This should be calculated based on the puzzle
        answerHash: puzzleRes.data.answerHash
    });

    if (!registerRes.success) {
        console.error('❌ Registration failed:', registerRes.error);
        return;
    }
    console.log('✅ User registered successfully');

    // Test 3: Login with correct credentials
    console.log('\n3. Logging in with correct credentials...');
    const loginRes = await makeRequest('post', '/login', {
        phoneNumber: TEST_PHONE,
        password: TEST_PASSWORD
    });

    if (!loginRes.success) {
        console.error('❌ Login failed:', loginRes.error);
        return;
    }
    console.log('✅ Login successful');
    const authToken = loginRes.data.token;

    // Test 4: Access protected route
    console.log('\n4. Accessing protected route...');
    const protectedRes = await makeRequest('get', '/test', null, authToken);
    if (!protectedRes.success) {
        console.error('❌ Failed to access protected route:', protectedRes.error);
        return;
    }
    console.log('✅ Successfully accessed protected route');
    console.log('   User data:', JSON.stringify(protectedRes.data, null, 2));

    // Clean up after tests
    await cleanup();
    console.log('\n✨ All tests completed successfully!');
}

// Run the tests
runTests()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('Test error:', error);
        process.exit(1);
    });
