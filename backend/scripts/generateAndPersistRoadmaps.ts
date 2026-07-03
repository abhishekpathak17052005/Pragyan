import 'module-alias/register';
import dotenv from 'dotenv';

dotenv.config();

import { PrismaClient } from '@prisma/client';
import { masterRoadmapGeneratorService } from '@/modules/master-roadmap-generator/master-roadmap-generator.service';
import { RoadmapReviewService } from '@/modules/roadmap-review/roadmap-review.service';

type CareerConfig = {
  name: string;
};

const careers: CareerConfig[] = [
  { name: 'Full Stack Web Developer' },
  { name: 'Software Engineer' },
  { name: 'DBA' },
  { name: 'Frontend Engineer' },
  { name: 'Backend Engineer' },
];

const prisma = new PrismaClient();
const reviewService = new RoadmapReviewService();

async function roadmapExists(careerName: string) {
  return prisma.careerRoadmap.findFirst({
    where: { name: careerName },
    select: { id: true, name: true, slug: true },
  });
}

async function generateAndPersist(careerName: string) {
  const existing = await roadmapExists(careerName);
  if (existing) {
    console.log(`Skipping existing roadmap for: ${careerName} (slug=${existing.slug})`);
    return existing;
  }

  console.log(`Generating roadmap preview for: ${careerName}`);
  const result = await masterRoadmapGeneratorService.generateRoadmapPreview(careerName);
  console.log(`  Source: ${result.source}${result.model ? `, model: ${result.model}` : ''}`);

  console.log(`Persisting roadmap for: ${careerName}`);
  const persisted = await reviewService.approveRoadmap(result.roadmap as any);
  console.log(`  Persisted roadmap id=${persisted.id} slug=${persisted.slug}`);
  return persisted;
}

async function run() {
  try {
    for (const career of careers) {
      await generateAndPersist(career.name);
    }
    console.log('✅ All requested roadmaps generated and persisted.');
  } catch (error) {
    console.error('❌ Failed to generate or persist roadmaps:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void run();
