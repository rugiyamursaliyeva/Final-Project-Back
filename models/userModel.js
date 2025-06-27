import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  surname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  course: {
    type: String,
    required: true,
    enum: [
      'Front-end',
      'Back-end',
      'Graphic Design',
      'UX/UI Design',
      'Digital Architecture',
      '2D Motion Design',
      'Digital Marketing',
      'Cybersecurity',
    ],
  },
  groupNo: { type: String, required: true },
  role: {
    type: String,
    enum: ['student', 'teacher'],
    default: 'student',
    required: true,
  },
}, { timestamps: true });

export default mongoose.model('User', userSchema);