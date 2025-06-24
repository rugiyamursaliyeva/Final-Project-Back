import mongoose from 'mongoose'

const classScheduleSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  classDays: {
    type: String,
    required: true
  },
  classHours: {
    type: String,
    required: true
  },
  locationType: {
    type: String,
    default: 'campus'
  }
})

const ClassSchedule = mongoose.model('ClassSchedule', classScheduleSchema)

export default ClassSchedule
