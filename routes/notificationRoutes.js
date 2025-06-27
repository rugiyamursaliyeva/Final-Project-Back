import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getNotifications } from '../controllers/notificationController.js';

const router = express.Router();

router.use(protect);

router.get('/', getNotifications);

export default router;