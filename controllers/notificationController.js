import Notification from '../models/Notification.js';

// İstifadəçinin bildirişlərini gətir
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Xəta baş verdi' });
  }
};