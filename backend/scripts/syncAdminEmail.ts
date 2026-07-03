#!/usr/bin/env tsx
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import dns from 'dns';
import { MongoClient, ObjectId } from 'mongodb';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/utils/password';

const email = (process.env.ADMIN_EMAIL || process.argv[2] || 'admin@pragyan.com').trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD || process.argv[3] || 'admin17052005';
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

  const now = new Date();
  const hashedPassword = await hashPassword(password);
  const mongoId = new ObjectId();

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      role: 'ADMIN',
      password: hashedPassword,
      provider: 'local',
      emailVerified: true,
    },
    create: {
      email,
      fullName: 'Admin User',
      password: hashedPassword,
      provider: 'local',
      providerId: null,
      avatar: null,
      emailVerified: true,
      role: 'ADMIN',
      age: null,
      location: null,
      phone: null,
      linkedin: null,
      skills: [],
      interests: [],
      preferences: [],
      experience: null,
      experienceType: 'experienced',
      education: null,
      educationEntries: [],
      skillLevel: 'Advanced',
      xp: 1000,
      streak: 0,
    },
  });

  const client = new MongoClient(mongoUrl);
  await client.connect();

  try {
    const db = client.db(mongoDbName);
    const usersCollection = db.collection('User');
    const currentUsersCollection = db.collection('CurrentUser');
    const adminUsersCollection = db.collection('AdminUser');

    await usersCollection.updateOne(
      { email },
      {
        $set: {
          email,
          fullName: 'Admin User',
          password: hashedPassword,
          role: 'ADMIN',
          age: null,
          location: null,
          phone: null,
          linkedin: null,
          skills: ['HTML & CSS Fundamentals', 'JavaScript Fundamentals'],
          interests: ['Web Development', 'Backend Development'],
          preferences: [],
          experience: null,
          experienceType: 'experienced',
          education: null,
          educationEntries: [],
          skillLevel: 'Advanced',
          xp: 1000,
          streak: 0,
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true }
    );

    await currentUsersCollection.updateOne(
      { email },
      {
        $set: {
          userId: mongoId,
          email,
          fullName: 'Admin User',
          role: 'ADMIN',
          skills: ['HTML & CSS Fundamentals', 'JavaScript Fundamentals'],
          interests: ['Web Development', 'Backend Development'],
          preferences: [],
          experience: null,
          experienceType: 'experienced',
          education: null,
          educationEntries: [],
          skillLevel: 'Advanced',
          xp: 1000,
          streak: 0,
          active: true,
          lastLoginAt: now,
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true }
    );

    await adminUsersCollection.updateOne(
      { email },
      {
        $set: {
          userId: mongoId,
          email,
          fullName: 'Admin User',
          role: 'ADMIN',
          xp: 1000,
          streak: 0,
          active: true,
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true }
    );

    console.log(`Synced admin email to admin section: ${email}`);
    console.log(`Prisma role set to ADMIN for: ${user.email}`);
  } finally {
    await client.close();
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Failed to sync admin email:', error);
  process.exit(1);
});
