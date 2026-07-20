#!/usr/bin/env tsx
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import dns from 'dns';
import { prisma } from '@/lib/prisma';

const email = (process.env.ADMIN_EMAIL || process.argv[2] || 'admin@pragyan.com').trim().toLowerCase();

async function main() {
  try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
  } catch {
    // Ignore when the host does not allow DNS changes.
  }

  const now = new Date();

  try {
    // First, check if admin user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!existingUser) {
      console.error(`❌ Admin user not found with email: ${email}`);
      console.log('\nAttempting to create admin user...');

      // Create admin user if doesn't exist
      const created = await prisma.user.create({
        data: {
          email,
          fullName: 'Admin User',
          password: 'temp-password', // This will be replaced by sync script
          provider: 'local',
          role: 'ADMIN',
          userRole: 'ADMIN',
          emailVerified: true,
          accountStatus: 'ACTIVE',
          emailVerifiedAt: now,
          skills: [],
          interests: [],
          preferences: [],
          experienceType: 'experienced',
          skillLevel: 'Advanced',
          xp: 1000,
          streak: 0,
        },
      });

      console.log(`✅ Created new admin user`);
      console.log(`   Email: ${created.email}`);
      console.log(`   Role: ${created.userRole}`);
      console.log(`   Account Status: ${created.accountStatus}`);
      console.log(`   Email Verified At: ${created.emailVerifiedAt}`);
      return;
    }

    // Update existing user
    const updated = await prisma.user.update({
      where: { email },
      data: {
        emailVerifiedAt: now,
        accountStatus: 'ACTIVE',
        emailVerified: true,
        role: 'ADMIN',
        userRole: 'ADMIN',
      },
    });

    console.log('✅ Admin user verification updated successfully!');
    console.log('');
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
    console.log('   Password: (use your configured admin password or run sync script)');
  } catch (error) {
    console.error('Failed to update admin user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
