/**
 * Complete Auth Flow Test
 * Tests: Registration, Login, Me endpoint, Token refresh
 */

const http = require('http');

const baseUrl = 'http://localhost:5000/api/auth';
const testEmail = 'testuser@pragyan.com';
const testPassword = 'TestPass@12345'; // Meets all requirements

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

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

    const registerRes = await makeRequest('POST', '/register', registerPayload);
    console.log(`Status: ${registerRes.statusCode}`);
    console.log('Response:', JSON.stringify(registerRes.body, null, 2));

    if (registerRes.statusCode !== 201) {
      console.log('❌ Registration failed\n');
      return;
    }

    console.log('✓ Registration successful\n');
    
    const user = registerRes.body.data?.user;
    const accessToken = registerRes.body.data?.accessToken;
    const refreshToken = registerRes.body.data?.refreshToken;

    if (!accessToken || !refreshToken) {
      console.log('❌ Tokens not returned in registration response\n');
      return;
    }

    // ========== PHASE 2: Login ==========
    console.log('PHASE 2: Login');
    console.log('----------------------------');
    
    const loginPayload = {
      email: testEmail,
      password: testPassword
    };

    const loginRes = await makeRequest('POST', '/login', loginPayload);
    console.log(`Status: ${loginRes.statusCode}`);
    console.log('Response:', JSON.stringify(loginRes.body, null, 2));

    if (loginRes.statusCode !== 200) {
      console.log('❌ Login failed\n');
      return;
    }

    console.log('✓ Login successful');
    console.log(`  User: ${loginRes.body.data.user.email}`);
    console.log(`  Role: ${loginRes.body.data.user.role}\n`);

    const loginAccessToken = loginRes.body.data?.accessToken;

    // ========== PHASE 3: Get Current User ==========
    console.log('PHASE 3: Get Current User (Me)');
    console.log('----------------------------');

    const meOptions = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/me',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${loginAccessToken}`,
        'Content-Type': 'application/json'
      }
    };

    const meRes = await new Promise((resolve) => {
      const req = http.request(meOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({
              statusCode: res.statusCode,
              body: JSON.parse(data)
            });
          } catch (e) {
            resolve({
              statusCode: res.statusCode,
              body: data
            });
          }
        });
      });
      req.on('error', () => resolve({ statusCode: 0, body: {} }));
      req.end();
    });

    console.log(`Status: ${meRes.statusCode}`);
    console.log('Response:', JSON.stringify(meRes.body, null, 2));

    if (meRes.statusCode !== 200) {
      console.log('❌ Me endpoint failed\n');
    } else {
      console.log('✓ Me endpoint successful\n');
    }

    // ========== PHASE 4: Refresh Token ==========
    console.log('PHASE 4: Refresh Token');
    console.log('----------------------------');

    const refreshPayload = {
      refreshToken: refreshToken
    };

    const refreshRes = await makeRequest('POST', '/refresh-token', refreshPayload);
    console.log(`Status: ${refreshRes.statusCode}`);
    console.log('Response:', JSON.stringify(refreshRes.body, null, 2));

    if (refreshRes.statusCode !== 200) {
      console.log('❌ Token refresh failed\n');
    } else {
      console.log('✓ Token refresh successful\n');
    }

    // ========== SUMMARY ==========
    console.log('========== TEST SUMMARY ==========');
    console.log(`Phase 1 (Register): ${registerRes.statusCode === 201 ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Phase 2 (Login): ${loginRes.statusCode === 200 ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Phase 3 (Me): ${meRes.statusCode === 200 ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Phase 4 (Refresh): ${refreshRes.statusCode === 200 ? '✓ PASS' : '✗ FAIL'}`);

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

runTests();
