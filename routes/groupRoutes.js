import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { createGroup, getGroups } from '../controllers/groupController.js';

const router = express.Router();
router.use(protect);
router.post('/create', createGroup); // admin
router.get('/', getGroups); // all users

export default router;
