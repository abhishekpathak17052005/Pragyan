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
    // Ignore when the host does not allow DNS changes.
  }

  const client = new MongoClient(mongoUrl);
  await client.connect();

  try {
    const db = client.db(mongoDbName);
    const usersCollection = db.collection('User');

    const now = new Date();

    // Check if user exists
    const existingUser = await usersCollection.findOne({ email });

    if (!existingUser) {
      console.error(`❌ Admin user not found with email: ${email}`);
      console.log('\nSearching for any ADMIN users in database...');
      
      const adminUsers = await usersCollection.find({ role: 'ADMIN' }).toArray();
      if (adminUsers.length > 0) {
        console.log(`\nFound ${adminUsers.length} admin user(s):`);
        adminUsers.forEach((user, idx) => {
          console.log(`  ${idx + 1}. ${user.email}`);
        });
      } else {
        console.log('No ADMIN users found in database');
      }
      return;
    }

    // Update user with verification
    const result = await usersCollection.updateOne(
      { email },
      {
        $set: {
          emailVerifiedAt: now,
          accountStatus: 'ACTIVE',
          emailVerified: true,
          userRole: 'ADMIN',
          role: 'ADMIN',
          updatedAt: now,
        },
      }
    );

    console.log('✅ Admin user verification updated successfully!');
    console.log('');
    
    // Fetch updated user to show details
    const updated = await usersCollection.findOne({ email });
    
    console.log('Updated Admin User Details:');
    console.log(`   Email: ${updated.email}`);
    console.log(`   Full Name: ${updated.fullName}`);
    console.log(`   Role: ${updated.role}`);
    console.log(`   User Role: ${updated.userRole}`);
    console.log(`   Account Status: ${updated.accountStatus}`);
    console.log(`   Email Verified: ${updated.emailVerified}`);
    console.log(`   Email Verified At: ${updated.emailVerifiedAt}`);
    console.log(`   Created At: ${updated.createdAt}`);
    console.log('');
    console.log('🔐 Login Credentials:');
    console.log(`   Email: ${email}`);
    console.log('   Password: admin17052005 (or your configured admin password)');
    console.log('');
    console.log('✅ Admin account is now ready to login!');
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error('Failed to update admin user:', error.message);
  process.exit(1);
});
