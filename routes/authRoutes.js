import express from 'express'
import { register, login } from '../controllers/authController.js'

const router = express.Router()

router.post('/register', register)
router.post('/login', login) // ✅ Login endpoint əlavə olundu

export default router
