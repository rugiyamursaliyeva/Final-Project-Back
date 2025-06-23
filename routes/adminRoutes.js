import express from 'express'
import { adminLogin } from '../controllers/adminController.js'

const router = express.Router()

router.post('/admin-login', adminLogin)

export default router
