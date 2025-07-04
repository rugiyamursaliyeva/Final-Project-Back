import ClassSchedule from '../models/scheduleModel.js'

export const createSchedule = async (req, res) => {
  try {
    const { date, classDays, classHours, locationType } = req.body

    const parsedDate = new Date(date)
    if (isNaN(parsedDate)) {
      return res.status(400).json({ message: "The date format is incorrect." })
    }

    const newSchedule = new ClassSchedule({
      date: parsedDate,
      classDays,
      classHours,
      locationType,
    })

    await newSchedule.save()
    res.status(201).json(newSchedule)
  } catch (error) {
    console.error("When adding an error:", error)
    res.status(500).json({ message: 'An error occurred while adding.', error: error.message })
  }
}

export const getSchedule = async (req, res) => {
  try {
    const schedule = await ClassSchedule.find()
    res.status(200).json(schedule)
  } catch (error) {
    res.status(500).json({ message: 'An error occurred while retrieving.' })
  }
}

export const updateSchedule = async (req, res) => {
  try {
    const updated = await ClassSchedule.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
    res.status(200).json(updated)
  } catch (error) {
    res.status(500).json({ message: 'An error occurred while updating.' })
  }
}

export const deleteSchedule = async (req, res) => {
  try {
    await ClassSchedule.findByIdAndDelete(req.params.id)
    res.status(200).json({ message: 'Successfully deleted' })
  } catch (error) {
    res.status(500).json({ message: 'An error occurred while deleting.' })
  }
}
