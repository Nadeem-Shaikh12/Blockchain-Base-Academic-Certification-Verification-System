import { Router } from 'express';
import { getBlockchain, checkIntegrity } from '../controllers/blockchain.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/integrity', authenticate, authorize(['SUPER_ADMIN', 'COLLEGE_ADMIN']), checkIntegrity);
router.get('/', authenticate, authorize(['SUPER_ADMIN', 'COLLEGE_ADMIN']), getBlockchain);

export default router;
