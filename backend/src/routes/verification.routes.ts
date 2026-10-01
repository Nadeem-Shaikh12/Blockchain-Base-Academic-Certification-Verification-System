import { Router } from 'express';
import { verifyCertificate } from '../controllers/verification.controller';

const router = Router();

router.get('/:certificateId', verifyCertificate);

export default router;
