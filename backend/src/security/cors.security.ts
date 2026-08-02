import cors from 'cors';

import { config } from '@/config/env';

// DEBUG: Log allowed origins on startup
console.log('CORS Debug - Allowed origins:', config.cors.allowedOrigins);

export const secureCors = cors({
  origin: (origin, callback) => {
    console.log('CORS Debug - Incoming request origin:', origin);
    if (!origin || config.cors.allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('CORS blocked: origin not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
  maxAge: 60 * 60,
});
