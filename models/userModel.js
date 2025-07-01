import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  surname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  course: { type: String, required: true },
  groupNo: { type: String, required: false }, // Optional for teachers
  role: { type: String, enum: ['student', 'teacher'], required: true },
});

export default mongoose.model('User', userSchema);