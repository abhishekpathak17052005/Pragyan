/**
 * Script to clean all roadmap data from the database
 * Usage: cd backend && npx ts-node -P tsconfig.json prisma/clean-roadmaps.ts
 */

import { prisma } from '../src/lib/prisma';

async function cleanAllRoadmaps() {
  try {
    console.log('🧹 Starting roadmap cleanup...');

    // Delete in correct order to respect foreign key constraints
    const [resourcesDeleted, topicsDeleted, daysDeleted, weeksDeleted, modulesDeleted, careersDeleted] = await Promise.all([
      prisma.careerRoadmapResource.deleteMany({}),
      prisma.careerRoadmapTopic.deleteMany({}),
      prisma.careerRoadmapDay.deleteMany({}),
      prisma.careerRoadmapWeek.deleteMany({}),
      prisma.careerRoadmapModule.deleteMany({}),
      prisma.careerRoadmap.deleteMany({}),
    ]);

    console.log('✅ Cleanup completed:');
    console.log(`   - Deleted ${resourcesDeleted.count} resources`);
    console.log(`   - Deleted ${topicsDeleted.count} topics`);
    console.log(`   - Deleted ${daysDeleted.count} days`);
    console.log(`   - Deleted ${weeksDeleted.count} weeks`);
    console.log(`   - Deleted ${modulesDeleted.count} modules`);
    console.log(`   - Deleted ${careersDeleted.count} career roadmaps`);
    console.log(`\n🎯 Total: ${resourcesDeleted.count + topicsDeleted.count + daysDeleted.count + weeksDeleted.count + modulesDeleted.count + careersDeleted.count} records removed`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

cleanAllRoadmaps();
