import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  deadline: { type: Date, required: true },
  course: { type: String, required: true },
  groupNo: { type: String, required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  githubLink: String,
  submittedAt: Date,
  grade: Number,
  feedback: String,
}, { timestamps: true });

export default mongoose.model('Assignment', assignmentSchema);