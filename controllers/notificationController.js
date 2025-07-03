import Notification from '../models/Notification.js';

export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .populate('teacher', 'name surname') // Müəllimin adı və soyadını populyasiya et
      .sort({ createdAt: -1 }); // Ən son bildirişlər yuxarıda görünsün
    res.json(notifications);
  } catch (error) {
    console.error('Bildirişləri əldə etmə xətası:', error.message, error.stack);
    res.status(500).json({ message: 'Xəta baş verdi: ' + error.message });
  }
};