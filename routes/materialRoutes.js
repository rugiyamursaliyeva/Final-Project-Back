import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getMaterials, createMaterial } from '../controllers/materialController.js';

const router = express.Router();

router.use(protect);

router.get('/', getMaterials);
router.post('/create', createMaterial);

export default router;