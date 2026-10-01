import { Router } from 'express';
import { addStudent, getStudents } from '../controllers/student.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticate, authorize(['COLLEGE_ADMIN', 'SUPER_ADMIN']), addStudent);
router.get('/', authenticate, authorize(['COLLEGE_ADMIN', 'SUPER_ADMIN']), getStudents);

export default router;
