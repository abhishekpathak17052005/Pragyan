const axios = require('axios');

const API_URL = 'http://localhost:3000/api/dev/admin';

const accounts = [
  {
    email: 'student@test.com',
    password: 'TestStudent@123',
    userRole: 'STUDENT'
  },
  {
    email: 'recruiter@test.com',
    password: 'TestRecruiter@123',
    userRole: 'RECRUITER'
  },
  {
    email: 'placement@test.com',
    password: 'TestPlacement@123',
    userRole: 'PLACEMENT_OFFICER'
  },
  {
    email: 'admin@test.com',
    password: 'TestAdmin@123',
    userRole: 'ADMIN'
  }
];

async function createAccounts() {
  console.log('Creating test accounts...\n');
  
  for (const account of accounts) {
    try {
      const response = await axios.post(`${API_URL}/create-test-user`, account);
      console.log(`✓ ${account.userRole}`);
      console.log(`  Email: ${account.email}`);
      console.log(`  Password: ${account.password}`);
      console.log('');
    } catch (error) {
      if (error.response?.data?.message?.includes('already exists')) {
        console.log(`⚠ ${account.userRole} - Account already exists`);
        console.log(`  Email: ${account.email}`);
        console.log(`  Password: ${account.password}`);
        console.log('');
      } else {
        console.error(`✗ ${account.userRole} - Error: ${error.response?.data?.message || error.message}`);
        console.log('');
      }
    }
  }
}

createAccounts().catch(console.error);
