import 'module-alias/register';
import dotenv from 'dotenv';

dotenv.config();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrate() {
  const curriculums = await prisma.roadmapCurriculum.findMany({
    include: {
      modules: {
        include: {
          weeks: {
            include: {
              days: {
                include: {
                  topics: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (curriculums.length === 0) {
    console.log('No roadmapCurriculum records found to migrate.');
    return;
  }

  for (const curriculum of curriculums) {
    const existing = await prisma.careerRoadmap.findFirst({
      where: { slug: curriculum.slug },
    });

    if (existing) {
      console.log(`Skipping existing careerRoadmap for slug=${curriculum.slug}`);
      continue;
    }

    const totalWeeks = curriculum.modules.reduce((sum, module) => sum + module.weeks.length, 0);

    let weekCounter = 1;
    const weeks = curriculum.modules.flatMap((module) =>
      module.weeks.map((week) => ({
        weekNumber: weekCounter++,
        title: `${module.title}: ${week.title}`,
        description: week.description,
        days: {
          create: week.days.map((day) => ({
            dayNumber: day.dayNumber,
            title: day.title,
            description: day.description,
            topics: {
              create: day.topics.map((topic) => ({
                title: topic.title,
                description: topic.description,
                difficulty: topic.difficulty,
                estimatedTime: topic.estimatedDuration,
                order: topic.sortOrder,
                progress: {
                  learningObjective: topic.learningObjective,
                  prerequisite: topic.prerequisite,
                  practicalTask: topic.practicalTask,
                },
              })),
            },
          })),
        },
      }))
    );

    const careerRoadmap = await prisma.careerRoadmap.create({
      data: {
        name: curriculum.careerName,
        slug: curriculum.slug,
        description: curriculum.summary,
        totalWeeks,
        weeks: {
          create: weeks,
        },
      },
    });

    console.log(`Migrated roadmap '${curriculum.careerName}' to careerRoadmap id=${careerRoadmap.id}`);
  }
}

migrate()
  .then(() => {
    console.log('Migration complete.');
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
