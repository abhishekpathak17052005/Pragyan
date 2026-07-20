/**
 * Script to add icons to existing career roadmaps
 * Usage: npx ts-node scripts/add-career-icons.ts
 */

import { prisma } from '@/lib/prisma';
import { getIconForCareer } from '@/modules/career-roadmap/icon-mapping';

async function main() {
  console.log('Starting to add icons to careers...');

  try {
    // Get all careers without icons
    const careers = await prisma.careerRoadmap.findMany({
      where: {
        OR: [{ icon: null }, { icon: '' }],
      },
    });

    console.log(`Found ${careers.length} careers without icons`);

    if (careers.length === 0) {
      console.log('All careers already have icons!');
      return;
    }

    // Update each career with icon based on title
    for (const career of careers) {
      const icon = getIconForCareer(career.title);
      console.log(`Updating "${career.title}" with icon: ${icon}`);

      await prisma.careerRoadmap.update({
        where: { id: career.id },
        data: { icon },
      });
    }

    console.log(`✓ Successfully added icons to ${careers.length} careers!`);
  } catch (error) {
    console.error('Error adding icons:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
