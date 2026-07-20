#!/usr/bin/env node

require('dotenv').config({ path: '.env' });

const { MongoClient } = require('mongodb');
const dns = require('dns');

const email = (process.env.ADMIN_EMAIL || process.argv[2] || 'admin@pragyan.com').trim().toLowerCase();
const mongoUrl = process.env.MONGO_DIRECT_URL || process.env.MONGODB_URI || process.env.DATABASE_URL;
const mongoDbName = process.env.DB_NAME || 'Pragyan';

async function main() {
  if (!mongoUrl) {
    throw new Error('DATABASE_URL or MONGO_DIRECT_URL is required');
  }

  try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
  } catch {
    // Ignore
  }

  const client = new MongoClient(mongoUrl);
  await client.connect();

  try {
    const db = client.db(mongoDbName);
    const usersCollection = db.collection('User');

    const user = await usersCollection.findOne({ email });

    if (!user) {
      console.error(`❌ User not found: ${email}`);
      return;
    }

    console.log('\n📋 ADMIN USER VERIFICATION STATUS\n');
    console.log('═'.repeat(50));
    console.log(`Email:               ${user.email}`);
    console.log(`Full Name:           ${user.fullName}`);
    console.log(`Role:                ${user.role}`);
    console.log(`User Role:           ${user.userRole}`);
    console.log(`Account Status:      ${user.accountStatus}`);
    console.log(`Email Verified:      ${user.emailVerified}`);
    console.log(`Email Verified At:   ${user.emailVerifiedAt}`);
    console.log(`Created At:          ${user.createdAt}`);
    console.log('═'.repeat(50));

    // Check if all required fields for login are set
    const canLogin = user.emailVerifiedAt && user.accountStatus === 'ACTIVE' && (user.userRole === 'ADMIN' || user.role === 'ADMIN');
    
    console.log('\n✅ Login Check:');
    console.log(`   Email Verified At: ${user.emailVerifiedAt ? '✅ SET' : '❌ NOT SET'}`);
    console.log(`   Account Status:    ${user.accountStatus === 'ACTIVE' ? '✅ ACTIVE' : '❌ NOT ACTIVE'}`);
    console.log(`   Is Admin:          ${(user.userRole === 'ADMIN' || user.role === 'ADMIN') ? '✅ YES' : '❌ NO'}`);
    console.log(`\n   Ready for Login:   ${canLogin ? '✅ YES - CAN LOGIN' : '❌ NO - CANNOT LOGIN'}`);
    console.log('═'.repeat(50));

    console.log('\n🔐 USE THESE CREDENTIALS TO LOGIN:');
    console.log(`   Email:    ${email}`);
    console.log(`   Password: admin17052005`);
    console.log('\n');
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error('Verification failed:', error.message);
  process.exit(1);
});
