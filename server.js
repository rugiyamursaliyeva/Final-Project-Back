import express from 'express';
import { connectDB } from './configs/config.js';
import AuthRoutes from './routes/authRoutes.js';
import AssignmentRoutes from './routes/assignmentRoutes.js';
import MaterialRoutes from './routes/materialRoutes.js';
import NotificationRoutes from './routes/notificationRoutes.js';
import ProductRoutes from './routes/productRoutes.js';
import AdminRoutes from './routes/adminRoutes.js';
import ContactRoutes from './routes/contactRoutes.js';
import ScheduleRoutes from './routes/scheduleRoutes.js';
import GroupRoutes from './routes/groupRoutes.js';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import path from 'path';

dotenv.config();

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173', // Allow requests from Vite frontend
  credentials: true,
}));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'))); // Serve static files

// Routes
app.use('/', ProductRoutes);
app.use('/', AdminRoutes);
app.use('/', ContactRoutes);
app.use('/', ScheduleRoutes);
app.use('/api/auth', AuthRoutes);
app.use('/api/assignments', AssignmentRoutes);
app.use('/api/materials', MaterialRoutes);
app.use('/api/notifications', NotificationRoutes);
app.use('/api/groups', GroupRoutes);

// Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
});

// Email configuration
export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});