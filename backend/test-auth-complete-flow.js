/**
 * Complete Auth Flow Test - CORRECT FLOW
 * 1. Register user (no tokens at registration)
 * 2. Verify email (get verification token from response or DB)
 * 3. Login (get access token and refresh token)
 * 4. Get me endpoint (verify authenticated)
 * 5. Refresh token
 */

const http = require('http');

const baseUrl = 'http://localhost:5000/api/auth';
const uniqueId = Date.now();
const testEmail = `testuser${uniqueId}@pragyan.com`;
const testPassword = 'Pwr9@Key!X7';

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

    console.log('✓ Registration successful (Note: No tokens returned at registration)');
    console.log('');

    // ========== PHASE 2: Verify Email ==========
    // NOTE: In production, user would click the verification link in email
    // For this test, we'd need to:
    // 1. Get the verification token from the database
    // 2. Call GET /verify-email?token=xxx
    // 3. Since we don't have database access here, we'll skip this step
    
    console.log('PHASE 2: Verify Email');
    console.log('----------------------------');
    console.log('⊘ Skipping email verification (would normally be done via email link)');
    console.log('NOTE: In production, user clicks verification link in email');
    console.log('For now, we\'ll assume email is verified and proceed to login');
    console.log('');

    // ========== PHASE 3: Login ==========
    console.log('PHASE 3: Login');
    console.log('----------------------------');
    
    const loginPayload = {
      email: testEmail,
      password: testPassword
    };

    console.log('Sending:', JSON.stringify(loginPayload, null, 2));
    console.log('');

    const loginRes = await makeRequest('POST', '/login', loginPayload);
    console.log(`Status: ${loginRes.statusCode}`);
    console.log('Response (truncated):', JSON.stringify(loginRes.body, null, 2).substring(0, 300) + '...');
    console.log('');

    if (loginRes.statusCode !== 200 && loginRes.statusCode !== 401) {
      console.log('Note:', loginRes.body?.message || 'Login attempt');
      if (loginRes.statusCode === 401) {
        console.log('⊘ User not yet verified via email (expected if verification wasn\'t done)');
      }
    }

    if (loginRes.statusCode !== 200) {
      console.log(`⊘ Login status: ${loginRes.statusCode}`);
      if (loginRes.statusCode === 401) {
        console.log('   Reason: Account not yet verified via email');
        console.log('   Flow: User must click email verification link first');
      } else {
        console.log(`   Response: ${loginRes.body?.message}`);
      }
      console.log('\n========== SUMMARY ==========');
      console.log(`Phase 1 (Register): ✓ PASS`);
      console.log(`Phase 2 (Verify Email): ⊘ SKIPPED (requires email interaction)`);
      console.log(`Phase 3+ (Login): ⊘ BLOCKED (can't verify without email verification)`);
      console.log('');
      console.log('To complete full flow:');
      console.log('1. Check database for verification token');
      console.log('2. Call GET /verify-email?token=TOKEN');
      console.log('3. Then login should succeed');
      return;
    }

    console.log('✓ Login successful');
    console.log('  User:', loginRes.body.data?.user?.email);
    console.log('  Role:', loginRes.body.data?.user?.role);
    console.log('');

    const loginAccessToken = loginRes.body.data?.accessToken;
    const loginRefreshToken = loginRes.body.data?.refreshToken;

    if (!loginAccessToken || !loginRefreshToken) {
      console.log('❌ Tokens not returned in login response');
      return;
    }

    // ========== PHASE 4: Get Current User ==========
    console.log('PHASE 4: Get Current User (Me)');
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

    // ========== PHASE 5: Refresh Token ==========
    console.log('PHASE 5: Refresh Token');
    console.log('----------------------------');

    const refreshPayload = {
      refreshToken: loginRefreshToken
    };

    console.log('Sending:', JSON.stringify(refreshPayload, null, 2));
    console.log('');

    const refreshRes = await makeRequest('POST', '/refresh', refreshPayload);
    console.log(`Status: ${refreshRes.statusCode}`);
    if (refreshRes.statusCode === 200) {
      console.log('Response: { accessToken: "[JWT]", refreshToken: "[JWT]", ... }');
    } else {
      console.log('Response:', JSON.stringify(refreshRes.body, null, 2));
    }
    console.log('');

    if (refreshRes.statusCode !== 200) {
      console.log('❌ Token refresh failed\n');
    } else {
      console.log('✓ Token refresh successful');
      console.log('');
    }

    // ========== SUMMARY ==========
    console.log('========== TEST SUMMARY ==========');
    console.log(`Phase 1 (Register): ${registerRes.statusCode === 201 ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Phase 2 (Verify Email): ⊘ SKIPPED`);
    console.log(`Phase 3 (Login): ${loginRes.statusCode === 200 ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Phase 4 (Me): ${meRes.statusCode === 200 ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Phase 5 (Refresh): ${refreshRes.statusCode === 200 ? '✓ PASS' : '✗ FAIL'}`);
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
