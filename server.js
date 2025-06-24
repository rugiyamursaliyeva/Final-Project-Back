import express from 'express'
import { connectDB } from './configs/config.js'
import ProductRoutes from './routes/productRoutes.js'
import AdminRoutes from './routes/adminRoutes.js'
import ContactRoutes from './routes/contactRoutes.js'
import ScheduleRoutes from './routes/scheduleRoutes.js' // 🔁 Əlavə et
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cors())

// Route-lar
app.use('/', ProductRoutes)
app.use('/', AdminRoutes)
app.use('/', ContactRoutes)
app.use('/', ScheduleRoutes) // ✅ Burada əlavə olundu

// Verilənlər bazasına qoşul
connectDB()

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`)
})
