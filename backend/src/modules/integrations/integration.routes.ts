import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import * as controller from './integration.controller';

const router = Router();

router.get('/status', authenticate, controller.status);
router.post('/:provider/connect', authenticate, controller.connect);
router.get('/:provider/callback', controller.callback);
router.post('/:provider/sync', authenticate, controller.sync);
router.delete('/:provider', authenticate, controller.disconnect);

export default router;
