import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getMaterials, createMaterial, updateMaterial, deleteMaterial } from '../controllers/materialController.js';

const router = express.Router();

router.use(protect);

router.get('/', getMaterials);
router.post('/create', createMaterial);
router.patch('/:materialId', updateMaterial);
router.delete('/:materialId', deleteMaterial);

export default router;