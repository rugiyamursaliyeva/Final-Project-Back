import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
  groupNo: { type: String, required: true, unique: true },
  course: {
    type: String,
    required: true,
    enum: [
      'Front-end', 'Back-end', 'Graphic Design', 'UX/UI Design',
      'Digital Architecture', '2D Motion Design',
      'Digital Marketing', 'Cybersecurity'
    ],
  },
}, { timestamps: true });

export default mongoose.model('Group', groupSchema);
