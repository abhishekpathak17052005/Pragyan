// src/app.ts

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import session from 'express-session';
import passport from 'passport';
import { config } from '@/config/env';
import { errorHandler } from '@/middleware/errorHandler';
import { configurePassport } from '@/config/passport';

// Routes
import authRoutes from '@/routes/auth';
import roadmapRoutes from '@/routes/roadmap';
import progressRoutes from '@/routes/progress';
import assessmentRoutes from '@/routes/assessment';
import aiRoutes from '@/routes/ai';
import recommendationsRoutes from '@/routes/recommendations';
import adminRoutes from '@/routes/admin';
import skillRoutes from '@/routes/skill';
import taskRoutes from '@/routes/task';
import careerMatchingRoutes from '@/routes/career-matching';
import careersRoutes from '@/routes/careers';
import jobsRoutes from '@/routes/jobs';
import { redisRateLimiter } from '@/middleware/redisRateLimiter';

const app: Application = express();
configurePassport();

// ============ SECURITY MIDDLEWARE ============

app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);

// CORS
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || config.cors.allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('CORS blocked: origin not allowed'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ============ BODY PARSING ============

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.set('trust proxy', 1);
app.use(
  session({
    secret: config.oauth.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60 * 1000,
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

// ============ LOGGING ============

if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// ============ ROUTES ============

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.post('/api/top-career', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Please use authenticated recommendation endpoints for personalized top career.',
    data: null,
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/roadmaps', roadmapRoutes);
app.use('/api/progress', progressRoutes);
// Protect assessment and AI endpoints with Redis-backed per-user/IP limiter (falls back to in-memory)
app.use('/api/assessment', redisRateLimiter, assessmentRoutes);
app.use('/api/ai', redisRateLimiter, aiRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/career-matching', careerMatchingRoutes);
app.use('/api/careers', careersRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/admin', adminRoutes);

// ============ 404 HANDLING ============

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// ============ ERROR HANDLING ============

app.use(errorHandler);

export default app;
