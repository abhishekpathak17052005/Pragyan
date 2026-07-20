import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import {
  // Company
  createCompany,
  getAllCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
  // Recruiter
  createRecruiter,
  getRecruitersByCompany,
  getRecruiterById,
  updateRecruiter,
  deleteRecruiter,
  // Job
  createJob,
  getAllJobs,
  getJobsByCompany,
  getJobById,
  updateJob,
  publishJob,
  deleteJob,
  getOpenJobs,
  // Application
  applyJob,
  withdrawApplication,
  getStudentApplications,
  getJobApplications,
  updateApplicationStatus,
  // Hiring Drive
  createHiringDrive,
  getHiringDrivesByCompany,
  getHiringDriveById,
  updateHiringDrive,
  deleteHiringDrive,
  getUpcomingDrives,
  // Dashboard
  getCompanyDashboard,
  getMyCompany,
  getCompanyAnalytics,
} from './recruitment.controller';

const router = Router();

// ============ COMPANY ROUTES ============

router.get('/dashboard', authenticate, getCompanyDashboard);
router.get('/my-company', authenticate, getMyCompany);
router.get('/analytics', authenticate, getCompanyAnalytics);
router.post('/companies', authenticate, createCompany);
router.get('/companies', getAllCompanies);
router.get('/companies/:id', getCompanyById);
router.put('/companies/:id', authenticate, updateCompany);
router.delete('/companies/:id', authenticate, deleteCompany);

// ============ RECRUITER ROUTES ============

router.post('/recruiters', authenticate, createRecruiter);
router.get('/companies/:companyId/recruiters', getRecruitersByCompany);
router.get('/recruiters/:id', getRecruiterById);
router.put('/recruiters/:id', authenticate, updateRecruiter);
router.delete('/recruiters/:id', authenticate, deleteRecruiter);

// ============ JOB ROUTES ============

router.get('/jobs', getAllJobs);
router.get('/jobs/open', getOpenJobs);
router.get('/jobs/:id', getJobById);
router.post('/jobs', authenticate, createJob);
router.get('/companies/:companyId/jobs', authenticate, getJobsByCompany);
router.put('/jobs/:id', authenticate, updateJob);
router.patch('/jobs/:id/publish', authenticate, publishJob);
router.delete('/jobs/:id', authenticate, deleteJob);

// ============ JOB APPLICATION ROUTES ============

router.post('/jobs/apply', authenticate, applyJob);
router.delete('/applications/:id', authenticate, withdrawApplication);
router.get('/applications', authenticate, getStudentApplications);
router.get('/jobs/:jobId/applications', authenticate, getJobApplications);
router.patch('/applications/:id/status', authenticate, updateApplicationStatus);

// ============ HIRING DRIVE ROUTES ============

router.get('/hiring-drives/upcoming', getUpcomingDrives);
router.get('/hiring-drives/:id', getHiringDriveById);
router.post('/hiring-drives', authenticate, createHiringDrive);
router.get('/companies/:companyId/hiring-drives', authenticate, getHiringDrivesByCompany);
router.put('/hiring-drives/:id', authenticate, updateHiringDrive);
router.delete('/hiring-drives/:id', authenticate, deleteHiringDrive);

export default router;
