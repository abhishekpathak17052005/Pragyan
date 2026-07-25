// Quick diagnostic script to test Phase 4 endpoint
// Run with: node test-phase4-endpoint.js

const BASE_URL = 'http://localhost:3000/api/assessment';

async function testPhase4() {
  console.log('Testing Phase 4 endpoint availability...\n');
  
  try {
    // Test without auth (should get 401)
    console.log('1. Testing /phase-4/start without auth...');
    const res1 = await fetch(`${BASE_URL}/phase-4/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    console.log(`   Status: ${res1.status} ${res1.statusText}`);
    if (res1.status === 404) {
      console.log('   ❌ ISSUE: Route not found (404)\n');
      return;
    } else if (res1.status === 401) {
      console.log('   ✓ Route exists (needs authentication)\n');
    }
    
    // Check if backend is running
    console.log('2. Testing backend health...');
    const res2 = await fetch('http://localhost:3000/api/health').catch(() => null);
    if (!res2) {
      console.log('   ❌ ISSUE: Backend not running on port 3000\n');
      console.log('   Fix: Start backend with: cd backend && npm run dev\n');
      return;
    }
    console.log('   ✓ Backend is running\n');
    
    console.log('✓ Phase 4 endpoint is properly configured');
    console.log('\nTo test fully, you need:');
    console.log('  1. Complete Phase 1 (profile)');
    console.log('  2. Complete Phase 2 (domains selection)');
    console.log('  3. Complete Phase 3 (cognitive assessment)');
    console.log('  4. Then try Phase 4');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nPossible fixes:');
    console.log('  1. Make sure backend is running: cd backend && npm run dev');
    console.log('  2. Check if port 3000 is correct');
    console.log('  3. Check network/firewall settings');
  }
}

testPhase4();
