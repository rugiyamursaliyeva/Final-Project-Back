import express from 'express';
import {
  createGroup,
  getGroups,
  updateGroup,
  deleteGroup,
  getGroupsByCourse
} from '../controllers/groupController.js';

const router = express.Router();

router.post('/create', createGroup);
router.get('/', getGroups);
router.put('/:id', updateGroup);
router.delete('/:id', deleteGroup);
router.get('/by-course', getGroupsByCourse);

export default router;
