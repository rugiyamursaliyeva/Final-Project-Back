import mongoose from 'mongoose';

const materialSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ['video', 'pdf', 'document'], required: true },
  course: { type: String, required: true },
  url: { type: String, required: true },
  description: String,
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  uploadDate: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model('Material', materialSchema);