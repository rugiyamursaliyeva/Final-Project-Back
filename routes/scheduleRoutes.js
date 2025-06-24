import express from 'express'
import { createSchedule, getSchedule, updateSchedule, deleteSchedule } from '../controllers/scheduleController.js'

const router = express.Router()

router.get('/schedule', getSchedule)
router.post('/schedule', createSchedule)
router.put('/schedule/:id', updateSchedule)
router.delete('/schedule/:id', deleteSchedule)

export default router
