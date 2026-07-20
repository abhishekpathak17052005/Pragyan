/**
 * Complete Auth Flow Test - FIXED VERSION
 * Tests: Registration, Login, Me endpoint, Token refresh
 */

const http = require('http');

const baseUrl = 'http://localhost:5000/api/auth';
const testEmail = 'testuser@pragyan.com';
// Password must meet requirements:
// - Minimum 8 characters
// - Uppercase letter
// - Lowercase letter  
// - Number
// - Special character (@$!%*?&)
const testPassword = 'Pwr9@Key!X7'; // No sequential: P,w,r different; 9,7 different; X at end 

function makeRequest(method, path, body = null, authToken = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${baseUrl}${path}`);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (authToken) {
      options.headers['Authorization'] = `Bearer ${authToken}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('========== COMPLETE AUTH FLOW TEST ==========\n');

  try {
    // ========== PHASE 1: Register ==========
    console.log('PHASE 1: Register New User');
    console.log('----------------------------');
    
    const registerPayload = {
      fullName: 'Test User',
      email: testEmail,
      password: testPassword,
      confirmPassword: testPassword,
      role: 'STUDENT',
      collegeCode: 'IIT-BHU-001'
    };

    console.log('Sending:', JSON.stringify(registerPayload, null, 2));
    console.log('');

    const registerRes = await makeRequest('POST', '/register', registerPayload);
    console.log(`Status: ${registerRes.statusCode}`);
    console.log('Response:', JSON.stringify(registerRes.body, null, 2));
    console.log('');

    if (registerRes.statusCode !== 201) {
      console.log('❌ Registration failed');
      console.log('Response body:', registerRes.body);
      console.log('\n');
      return;
    }

    console.log('✓ Registration successful');
    console.log('');
    
    const user = registerRes.body.data?.user;
    const accessToken = registerRes.body.data?.accessToken;
    const refreshToken = registerRes.body.data?.refreshToken;

    console.log('User Details:');
    console.log('  ID:', user?.id);
    console.log('  Email:', user?.email);
    console.log('  Role:', user?.role);
    console.log('  Email Verified:', user?.emailVerified);
    console.log('');

    if (!accessToken || !refreshToken) {
      console.log('❌ Tokens not returned in registration response\n');
      return;
    }

    console.log('Tokens received:');
    console.log('  Access Token:', accessToken.substring(0, 50) + '...');
    console.log('  Refresh Token:', refreshToken.substring(0, 50) + '...');
    console.log('');

    // ========== PHASE 2: Login ==========
    console.log('PHASE 2: Login');
    console.log('----------------------------');
    
    const loginPayload = {
      email: testEmail,
      password: testPassword
    };

    console.log('Sending:', JSON.stringify(loginPayload, null, 2));
    console.log('');

    const loginRes = await makeRequest('POST', '/login', loginPayload);
    console.log(`Status: ${loginRes.statusCode}`);
    console.log('Response:', JSON.stringify(loginRes.body, null, 2));
    console.log('');

    if (loginRes.statusCode !== 200) {
      console.log('❌ Login failed\n');
      return;
    }

    console.log('✓ Login successful');
    console.log('  User:', loginRes.body.data.user.email);
    console.log('  Role:', loginRes.body.data.user.role);
    console.log('  Email Verified:', loginRes.body.data.user.emailVerified);
    console.log('');

    const loginAccessToken = loginRes.body.data?.accessToken;
    const loginRefreshToken = loginRes.body.data?.refreshToken;

    // ========== PHASE 3: Get Current User ==========
    console.log('PHASE 3: Get Current User (Me)');
    console.log('----------------------------');

    const meRes = await makeRequest('GET', '/me', null, loginAccessToken);
    console.log(`Status: ${meRes.statusCode}`);
    console.log('Response:', JSON.stringify(meRes.body, null, 2));
    console.log('');

    if (meRes.statusCode !== 200) {
      console.log('❌ Me endpoint failed\n');
    } else {
      console.log('✓ Me endpoint successful');
      console.log('  Retrieved user:', meRes.body.data?.email);
      console.log('');
    }

    // ========== PHASE 4: Refresh Token ==========
    console.log('PHASE 4: Refresh Token');
    console.log('----------------------------');

    const refreshPayload = {
      refreshToken: loginRefreshToken
    };

    console.log('Sending:', JSON.stringify(refreshPayload, null, 2));
    console.log('');

    const refreshRes = await makeRequest('POST', '/refresh', refreshPayload);
    console.log(`Status: ${refreshRes.statusCode}`);
    console.log('Response:', JSON.stringify(refreshRes.body, null, 2));
    console.log('');

    if (refreshRes.statusCode !== 200) {
      console.log('❌ Token refresh failed\n');
    } else {
      console.log('✓ Token refresh successful');
      console.log('  New Access Token:', refreshRes.body.data?.accessToken?.substring(0, 50) + '...');
      console.log('');
    }

    // ========== SUMMARY ==========
    console.log('========== TEST SUMMARY ==========');
    console.log(`Phase 1 (Register): ${registerRes.statusCode === 201 ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Phase 2 (Login): ${loginRes.statusCode === 200 ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Phase 3 (Me): ${meRes.statusCode === 200 ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Phase 4 (Refresh): ${refreshRes.statusCode === 200 ? '✓ PASS' : '✗ FAIL'}`);
    console.log('');

    // Check if all passed
    if (registerRes.statusCode === 201 && 
        loginRes.statusCode === 200 && 
        meRes.statusCode === 200 && 
        refreshRes.statusCode === 200) {
      console.log('🎉 ALL TESTS PASSED!');
    } else {
      console.log('⚠️  Some tests failed - see details above');
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

runTests();
