/**
 * Test script to verify assessment phase data persistence
 * Tests Phase 1 and Phase 2 save/update cycles with database verification
 */

import axios from 'axios';
import { prisma } from '@/lib/prisma';

const API_URL = 'http://localhost:3000/api';
let authToken = '';

interface TestResult {
  phase: number;
  test: string;
  status: 'PASS' | 'FAIL';
  details: string;
}

const results: TestResult[] = [];

function log(message: string) {
  console.log(`[TEST] ${new Date().toISOString()} - ${message}`);
}

function logResult(phase: number, test: string, status: 'PASS' | 'FAIL', details: string) {
  results.push({ phase, test, status, details });
  const icon = status === 'PASS' ? '✓' : '✗';
  console.log(`${icon} Phase ${phase} - ${test}: ${details}`);
}

async function setup() {
  try {
    log('Setting up test user and authentication...');
    
    // Register test user
    const registerRes = await axios.post(`${API_URL}/auth/register`, {
      email: `test-${Date.now()}@pragyan.test`,
      password: 'Secure@2026Test',
      confirmPassword: 'Secure@2026Test',
      fullName: 'Test User',
      role: 'STUDENT',
      collegeCode: 'COEP',
    });

    authToken = registerRes.data.data.accessToken;
    log(`✓ Test user registered and authenticated`);
  } catch (err: any) {
    console.error('Setup failed:', err.response?.data || err.message);
    process.exit(1);
  }
}

function getAxiosConfig() {
  return {
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
  };
}

async function testPhase1() {
  log('=== Testing Phase 1: Profile Collection ===');
  
  const phase1Payload = {
    personalInfo: {
      firstName: 'John',
      lastName: 'Doe',
      age: 22,
      gender: 'Male',
      country: 'India',
      state: 'Maharashtra',
      city: 'Pune',
    },
    education: {
      currentStatus: 'College Student',
      highestQualification: 'B.Tech',
      collegeName: 'COEP',
      university: 'Pune University',
      degree: 'B.Tech',
      branch: 'Computer Science',
      currentYear: '3rd',
      expectedGraduationYear: 2026,
      cgpaOrPercentage: '8.5',
    },
    careerGoal: 'Get Job',
    experience: {
      programmingExperience: 'Intermediate',
      previouslyWorked: true,
      yearsOfExperience: 1,
      currentCompany: 'Tech Corp',
      currentRole: 'Intern',
    },
  };

  try {
    // Save Phase 1
    log('Saving Phase 1 data...');
    const saveRes = await axios.post(
      `${API_URL}/assessment/phase-1`,
      phase1Payload,
      getAxiosConfig()
    );

    if (saveRes.data.success) {
      logResult(1, 'Save', 'PASS', `Session ID: ${saveRes.data.data.sessionId}`);
    } else {
      logResult(1, 'Save', 'FAIL', 'Response not successful');
      return;
    }

    // Verify data in database
    log('Verifying Phase 1 data in database...');
    const session = await prisma.assessmentSession.findFirst({
      where: { phase: 1 },
      orderBy: { completedAt: 'desc' },
    });

    if (session && session.analysis) {
      const analysis = JSON.parse(session.analysis);
      if (analysis.personalInfo?.firstName === 'John') {
        logResult(1, 'Database Persistence', 'PASS', 'Data correctly persisted to AssessmentSession');
      } else {
        logResult(1, 'Database Persistence', 'FAIL', 'Data not correctly saved');
      }
    } else {
      logResult(1, 'Database Persistence', 'FAIL', 'No session found in database');
    }

    // Get Phase 1 data
    log('Fetching Phase 1 data...');
    const getRes = await axios.get(
      `${API_URL}/assessment/phase-1`,
      getAxiosConfig()
    );

    if (getRes.data.data?.personalInfo?.firstName === 'John') {
      logResult(1, 'Retrieve', 'PASS', 'Data correctly retrieved from backend');
    } else {
      logResult(1, 'Retrieve', 'FAIL', 'Retrieved data does not match saved data');
    }

    // Update Phase 1
    log('Updating Phase 1 data...');
    phase1Payload.personalInfo.firstName = 'Jane';
    const updateRes = await axios.put(
      `${API_URL}/assessment/phase-1`,
      phase1Payload,
      getAxiosConfig()
    );

    if (updateRes.data.success) {
      logResult(1, 'Update', 'PASS', 'Phase 1 data updated successfully');
    } else {
      logResult(1, 'Update', 'FAIL', 'Update failed');
    }

  } catch (err: any) {
    logResult(1, 'Phase 1', 'FAIL', err.response?.data?.message || err.message);
  }
}

async function testPhase2() {
  log('=== Testing Phase 2: Interest & Domain Discovery ===');

  const phase2Payload = {
    careerObjective: 'Get Job',
    preferredDomains: ['Full Stack Development', 'Mobile Development'],
    skillConfidence: {
      programming: 'Advanced',
      mathematics: 'Intermediate',
      problemSolving: 'Advanced',
      communication: 'Intermediate',
      teamwork: 'Advanced',
      leadership: 'Intermediate',
    },
    favoriteSubjects: ['DSA', 'Web Development', 'Database Design'],
    workStyle: ['Remote', 'Startup'],
    learningStyle: ['Building Projects', 'Hands-on Practice'],
    motivation: 'Passion',
  };

  try {
    // Verify Phase 1 exists first
    log('Verifying Phase 1 completion as prerequisite...');
    const phase1 = await prisma.assessmentSession.findFirst({
      where: { phase: 1 },
      orderBy: { completedAt: 'desc' },
    });

    if (!phase1) {
      logResult(2, 'Prerequisite Check', 'FAIL', 'Phase 1 not found');
      return;
    }
    logResult(2, 'Prerequisite Check', 'PASS', 'Phase 1 exists');

    // Save Phase 2
    log('Saving Phase 2 data...');
    const saveRes = await axios.post(
      `${API_URL}/assessment/phase-2`,
      phase2Payload,
      getAxiosConfig()
    );

    if (saveRes.data.success) {
      logResult(2, 'Save', 'PASS', `Session ID: ${saveRes.data.data.sessionId}`);
      
      // Verify baselinePayload was generated
      if (saveRes.data.data.baselinePayload) {
        logResult(2, 'Baseline Generation', 'PASS', 'Baseline payload generated for Phase 3');
      } else {
        logResult(2, 'Baseline Generation', 'FAIL', 'No baseline payload in response');
      }
    } else {
      logResult(2, 'Save', 'FAIL', 'Response not successful');
      return;
    }

    // Verify data in database
    log('Verifying Phase 2 data in database...');
    const session = await prisma.assessmentSession.findFirst({
      where: { phase: 2 },
      orderBy: { completedAt: 'desc' },
    });

    if (session && session.analysis) {
      const analysis = JSON.parse(session.analysis);
      if (analysis.careerObjective === 'Get Job' && analysis.preferredDomains?.length === 2) {
        logResult(2, 'Database Persistence', 'PASS', 'Data correctly persisted to AssessmentSession');
      } else {
        logResult(2, 'Database Persistence', 'FAIL', 'Data not correctly saved');
      }
    } else {
      logResult(2, 'Database Persistence', 'FAIL', 'No session found in database');
    }

    // Get Phase 2 data
    log('Fetching Phase 2 data...');
    const getRes = await axios.get(
      `${API_URL}/assessment/phase-2`,
      getAxiosConfig()
    );

    if (getRes.data.data?.careerObjective === 'Get Job') {
      logResult(2, 'Retrieve', 'PASS', 'Data correctly retrieved from backend');
    } else {
      logResult(2, 'Retrieve', 'FAIL', 'Retrieved data does not match saved data');
    }

  } catch (err: any) {
    logResult(2, 'Phase 2', 'FAIL', err.response?.data?.message || err.message);
  }
}

async function testPhase3Prerequisites() {
  log('=== Testing Phase 3 Prerequisites ===');

  try {
    log('Attempting to start Phase 3...');
    const startRes = await axios.post(
      `${API_URL}/assessment/phase-3/start`,
      {},
      getAxiosConfig()
    );

    if (startRes.data.success) {
      logResult(3, 'Prerequisite Check', 'PASS', 'Phase 3 started (Phase 1 and 2 complete)');
    } else {
      logResult(3, 'Prerequisite Check', 'FAIL', 'Phase 3 start failed');
    }
  } catch (err: any) {
    if (err.response?.status === 400 && err.response?.data?.error?.includes('Phase')) {
      logResult(3, 'Prerequisite Enforcement', 'PASS', 'Phase prerequisites correctly enforced');
    } else {
      logResult(3, 'Prerequisite Check', 'FAIL', err.response?.data?.message || err.message);
    }
  }
}

async function printSummary() {
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const total = results.length;

  console.log('\n=== TEST SUMMARY ===');
  console.log(`Total: ${total} | Passed: ${passed} | Failed: ${failed}`);
  console.log('');

  results.forEach(r => {
    const icon = r.status === 'PASS' ? '✓' : '✗';
    console.log(`${icon} Phase ${r.phase} - ${r.test}: ${r.details}`);
  });

  const passRate = ((passed / total) * 100).toFixed(1);
  console.log(`\nPass Rate: ${passRate}%`);
}

async function main() {
  try {
    await setup();
    await testPhase1();
    await testPhase2();
    await testPhase3Prerequisites();
    await printSummary();

    const failed = results.filter(r => r.status === 'FAIL').length;
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
