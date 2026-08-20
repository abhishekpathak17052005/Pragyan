import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { sendError, sendSuccess } from '@/utils/response';
import { searchService } from '@/services/search';

export const search = asyncHandler(async (req: Request, res: Response) => {
  const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (!query) return sendError(res, 400, 'Search query is required');
  if (query.length > 120) return sendError(res, 400, 'Search query must be 120 characters or fewer');

  const results = await searchService.search(query);
  return sendSuccess(res, { query, results }, 200, 'Search results fetched');
});
