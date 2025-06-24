import ClassSchedule from '../models/scheduleModel.js'

export const createSchedule = async (req, res) => {
  try {
    const { date, classDays, classHours, locationType } = req.body

    const parsedDate = new Date(date)
    if (isNaN(parsedDate)) {
      return res.status(400).json({ message: "Tarix formatı düzgün deyil" })
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
    console.error("Xəta əlavə edilərkən:", error)
    res.status(500).json({ message: 'Əlavə edilərkən xəta baş verdi', error: error.message })
  }
}

export const getSchedule = async (req, res) => {
  try {
    const schedule = await ClassSchedule.find()
    res.status(200).json(schedule)
  } catch (error) {
    res.status(500).json({ message: 'Gətirilərkən xəta baş verdi' })
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
    res.status(500).json({ message: 'Yenilənərkən xəta baş verdi' })
  }
}

export const deleteSchedule = async (req, res) => {
  try {
    await ClassSchedule.findByIdAndDelete(req.params.id)
    res.status(200).json({ message: 'Uğurla silindi' })
  } catch (error) {
    res.status(500).json({ message: 'Silinərkən xəta baş verdi' })
  }
}
