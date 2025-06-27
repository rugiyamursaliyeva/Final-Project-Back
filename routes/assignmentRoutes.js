import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getAssignmentsByStudent, getAssignmentsByTeacher, createAssignment, submitAssignment, gradeAssignment } from '../controllers/assignmentController.js';

const router = express.Router();

router.use(protect);

router.get('/student', getAssignmentsByStudent);
router.get('/teacher', getAssignmentsByTeacher);
router.post('/create', createAssignment);
router.patch('/:assignmentId/submit', submitAssignment);
router.patch('/:assignmentId/grade', gradeAssignment);

export default router;