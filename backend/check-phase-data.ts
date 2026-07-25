// Quick script to check if a user has completed required phases for Phase 4
// Usage: npx tsx check-phase-data.ts <userId>

import { prisma } from './src/lib/prisma';

const userId = process.argv[2];

if (!userId) {
  console.error('Usage: npx tsx check-phase-data.ts <userId>');
  process.exit(1);
}

async function checkPhaseData() {
  console.log(`\n🔍 Checking phase data for user: ${userId}\n`);

  try {
    // Check user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, fullName: true },
    });

    if (!user) {
      console.error(`❌ User not found: ${userId}`);
      process.exit(1);
    }

    console.log(`✓ User found: ${user.email} (${user.fullName})\n`);

    // Check Phase 1
    const phase1 = await prisma.assessmentSession.findFirst({
      where: { userId, phase: 1 },
      orderBy: { completedAt: 'desc' },
    });

    if (phase1) {
      let phase1Data: any = {};
      try {
        phase1Data = JSON.parse(phase1.analysis);
      } catch { /* ignore */ }
      console.log('✓ Phase 1 (Profile): Completed');
      console.log(`  - Completed: ${phase1.completedAt?.toISOString()}`);
      console.log(`  - Education: ${phase1Data.education?.highestQualification || 'Not specified'}`);
      console.log(`  - Career Goal: ${phase1Data.careerGoal || 'Not specified'}`);
    } else {
      console.log('❌ Phase 1: Not completed');
    }

    // Check Phase 2 (CRITICAL FOR PHASE 4)
    const phase2 = await prisma.assessmentSession.findFirst({
      where: { userId, phase: 2 },
      orderBy: { completedAt: 'desc' },
    });

    if (phase2) {
      let phase2Data: any = {};
      try {
        phase2Data = JSON.parse(phase2.analysis);
      } catch { /* ignore */ }
      
      const domains = 
        phase2Data.baselinePayload?.preferredDomains ||
        phase2Data.preferredDomains ||
        phase2Data.domains ||
        [];

      console.log('\n✓ Phase 2 (Domains): Completed');
      console.log(`  - Completed: ${phase2.completedAt?.toISOString()}`);
      console.log(`  - Domains selected: ${domains.length > 0 ? domains.join(', ') : 'NONE (will use fallback)'}`);
      console.log(`  - Career Objective: ${phase2Data.careerObjective || 'Not specified'}`);
      
      if (domains.length === 0) {
        console.log('\n⚠️  WARNING: No domains found! Phase 4 will use fallback domains.');
      }
    } else {
      console.log('\n❌ Phase 2: NOT COMPLETED - Phase 4 will fail!');
      console.log('   Action required: Complete Phase 2 before trying Phase 4');
    }

    // Check Phase 3
    const phase3 = await prisma.assessmentSession.findFirst({
      where: { userId, phase: 3 },
      orderBy: { completedAt: 'desc' },
    });

    if (phase3) {
      let phase3Data: any = {};
      try {
        phase3Data = JSON.parse(phase3.analysis);
      } catch { /* ignore */ }
      console.log('\n✓ Phase 3 (Cognitive): Completed');
      console.log(`  - Completed: ${phase3.completedAt?.toISOString()}`);
      console.log(`  - Confidence: ${phase3Data.confidence || 0}`);
      console.log(`  - Session ID: ${phase3Data.sessionId || 'Not available'}`);
    } else {
      console.log('\n⚠️  Phase 3: Not completed (optional for Phase 4)');
    }

    // Check Phase 4
    const phase4 = await prisma.assessmentSession.findFirst({
      where: { userId, phase: 4 },
      orderBy: { completedAt: 'desc' },
    });

    if (phase4) {
      let phase4Data: any = {};
      try {
        phase4Data = JSON.parse(phase4.analysis);
      } catch { /* ignore */ }
      console.log('\n✓ Phase 4 (Technical): Completed');
      console.log(`  - Completed: ${phase4.completedAt?.toISOString()}`);
      console.log(`  - Confidence: ${phase4Data.technicalConfidence || 0}`);
      console.log(`  - Questions: ${phase4Data.totalQuestions || 'Unknown'}`);
    } else {
      console.log('\n○ Phase 4: Not yet attempted');
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));

    const canStartPhase4 = !!phase1 && !!phase2;
    
    if (canStartPhase4) {
      console.log('✓ User can start Phase 4 (all prerequisites met)');
    } else {
      console.log('❌ User CANNOT start Phase 4 yet');
      if (!phase1) console.log('   Missing: Phase 1 (Profile)');
      if (!phase2) console.log('   Missing: Phase 2 (Domain Selection) ⚠️ CRITICAL');
    }

    console.log('');

  } catch (error: any) {
    console.error('❌ Error checking phase data:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkPhaseData();
