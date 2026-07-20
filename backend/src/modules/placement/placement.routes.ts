import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import {
  getDashboard,
  getStudents,
  getStudentById,
  getCompanies,
  getApplications,
  getAnalytics,
} from './placement.controller';

const router = Router();

// ============ DASHBOARD ============
router.get('/dashboard', authenticate, getDashboard);

// ============ STUDENTS ============
router.get('/students', authenticate, getStudents);
router.get('/students/:id', authenticate, getStudentById);

// ============ COMPANIES ============
router.get('/companies', authenticate, getCompanies);

// ============ APPLICATIONS ============
router.get('/applications', authenticate, getApplications);

// ============ ANALYTICS ============
router.get('/analytics', authenticate, getAnalytics);

export default router;
