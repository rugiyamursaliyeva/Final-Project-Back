// 4. ✅ Model düzəlişi (group.js)
import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
  groupNo: { 
    type: String, 
    required: [true, 'Group number required'],
    trim: true,
    maxlength: [10, 'The group number can be a maximum of 10 characters.']
  },
  course: {
    type: String,
    required: [true, 'Course required'],
    enum: {
      values: [
        'Front-end',
        'Back-end',
        'Graphic Design',
        'UX/UI Design',
        'Digital Architecture',
        '2D Motion Design',
        'Digital Marketing',
        'Cybersecurity',
      ],
      message: 'Choose a valid course'
    }
  },
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index - eyni kurs və qrup nömrəsi olmasın
groupSchema.index({ course: 1, groupNo: 1 }, { unique: true });

// Virtual field - tam adı
groupSchema.virtual('fullName').get(function() {
  return `${this.course} - ${this.groupNo}`;
});

export default mongoose.model('Group', groupSchema);