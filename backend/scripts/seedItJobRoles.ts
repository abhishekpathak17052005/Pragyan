/**
 * seedItJobRoles.ts
 * -----------------------------------------------------------------------
 * Loads it_job_roles_refined.json (+ skill_index.json) into MongoDB via
 * Prisma for Pragyan AI. Idempotent â€” safe to re-run (upserts by jobId).
 *
 * Usage:
 *   1. Copy it_job_roles_refined.json and skill_index.json into
 *      backend/seed/it-job-roles/
 *   2. Add the Prisma models below (or equivalents) to schema.prisma,
 *      then `npx prisma generate` and `npx prisma db push`.
 *   3. Add to package.json:  "seed:it-jobs": "ts-node backend/scripts/seedItJobRoles.ts"
 *   4. Run: npm run seed:it-jobs
 *
 * ---- Prisma models (add to schema.prisma) ----
 *
 * model ItJobRole {
 *   id             String   @id @default(auto()) @map("_id") @db.ObjectId
 *   jobId          String   @unique
 *   jobTitle       String
 *   careerCluster  String
 *   seniorityLevel String
 *   description    String
 *   requiredSkills String[]
 *   skillCount     Int
 *   certifications String[]
 *   assessmentTopics String[]
 *   skillWeights   Json
 *   relatedRoles   Json
 *   embeddingKeywords String[]
 *   searchText     String
 *   createdAt      DateTime @default(now())
 *   updatedAt      DateTime @updatedAt
 *
 *   @@index([careerCluster])
 *   @@index([requiredSkills])
 * }
 *
 * model SkillIndexEntry {
 *   id                String   @id @default(auto()) @map("_id") @db.ObjectId
 *   skillName         String   @unique
 *   documentFrequency Int
 *   jobIds            String[]
 * }
 * -----------------------------------------------------------------------
 */

import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface RelatedRole {
  jobId: string;
  jobTitle: string;
  similarity: number;
}

interface ItJobRoleSeed {
  jobId: string;
  jobTitle: string;
  careerCluster: string;
  seniorityLevel: string;
  description: string;
  requiredSkills: string[];
  skillCount: number;
  certifications: string[];
  assessmentTopics: string[];
  skillWeights: Record<string, number>;
  relatedRoles: RelatedRole[];
  embeddingKeywords: string[];
  searchText: string;
}

interface SkillIndexEntry {
  documentFrequency: number;
  jobIds: string[];
}

async function seedItJobRoles() {
  const filePath = path.join(__dirname, '../seed/it-job-roles/it_job_roles_refined.json');
  const roles: ItJobRoleSeed[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  let created = 0;
  let updated = 0;

  for (const role of roles) {
    const existing = await prisma.itJobRole.findUnique({ where: { jobId: role.jobId } });

    await prisma.itJobRole.upsert({
      where: { jobId: role.jobId },
      create: {
        jobId: role.jobId,
        jobTitle: role.jobTitle,
        careerCluster: role.careerCluster,
        seniorityLevel: role.seniorityLevel,
        description: role.description,
        requiredSkills: role.requiredSkills,
        skillCount: role.skillCount,
        certifications: role.certifications,
        assessmentTopics: role.assessmentTopics,
        skillWeights: role.skillWeights,
        relatedRoles: role.relatedRoles as any,
        embeddingKeywords: role.embeddingKeywords,
        searchText: role.searchText,
      },
      update: {
        jobTitle: role.jobTitle,
        careerCluster: role.careerCluster,
        seniorityLevel: role.seniorityLevel,
        description: role.description,
        requiredSkills: role.requiredSkills,
        skillCount: role.skillCount,
        certifications: role.certifications,
        assessmentTopics: role.assessmentTopics,
        skillWeights: role.skillWeights,
        relatedRoles: role.relatedRoles as any,
        embeddingKeywords: role.embeddingKeywords: role.embeddingKeywords,
        searchText: role.searchText,
      },
    });

    existing ? updated++ : created++;
  }

  console.log(`ItJobRole seed complete â€” created: ${created}, updated: ${updated}, total: ${roles.length}`);
}

async function seedSkillIndex() {
  const filePath = path.join(__dirname, '../seed/it-job-roles/skill_index.json');
  const skillIndex: Record<string, SkillIndexEntry> = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  let count = 0;
  for (const [skillName, entry] of Object.entries(skillIndex)) {
    await prisma.skillIndexEntry.upsert({
      where: { skillName },
      create: { skillName, documentFrequency: entry.documentFrequency, jobIds: entry.jobIds },
      update: { documentFrequency: entry.documentFrequency, jobIds: entry.jobIds },
    });
    count++;
  }
  console.log(`SkillIndexEntry seed complete â€” total: ${count}`);
}

async function main() {
  console.log('Seeding IT Job Roles...');
  await seedItJobRoles();
  await seedSkillIndex();
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
