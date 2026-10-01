import { Router } from 'express';
import { issueCertificate, getCertificates, downloadPDF, revokeCertificate } from '../controllers/certificate.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticate, authorize(['COLLEGE_ADMIN', 'SUPER_ADMIN']), issueCertificate);
router.get('/', authenticate, getCertificates);
router.get('/:id/download', authenticate, downloadPDF);
router.post('/:id/revoke', authenticate, authorize(['SUPER_ADMIN', 'COLLEGE_ADMIN']), revokeCertificate);

export default router;
