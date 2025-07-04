import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import User from '../models/userModel.js';

// Bildiriş yaratma
export const createNotification = async (req, res) => {
  try {
    const { message, course, groupNo, assignmentTitle, recipientRole, studentId } = req.body;
    if (!message || !course) {
      return res.status(400).json({ message: 'Message and course required' });
    }
    let recipients;
    if (recipientRole === 'student') {
      if (studentId) {
        recipients = await User.find({ _id: studentId, role: 'student', course });
      } else if (groupNo) {
        recipients = await User.find({ role: 'student', course, groupNo });
      } else {
        return res.status(400).json({ message: 'Group number or student ID required' });
      }
    } else if (recipientRole === 'teacher') {
      recipients = await User.find({ role: 'teacher', course });
    } else {
      return res.status(400).json({ message: 'Wrong buyer role' });
    }
    console.log('Found recipients for notification:', recipients);
    if (!recipients || recipients.length === 0) {
      return res.status(404).json({ message: 'No buyers found' });
    }
    const notifications = await Promise.all(
      recipients.map(async (recipient) => {
        const notification = new Notification({
          recipient: recipient._id,
          recipientRole,
          message,
          course,
          groupNo: recipientRole === 'student' ? groupNo : null,
          sender: req.user._id,
          senderRole: req.user.role,
          assignmentTitle,
          isRead: false,
          createdAt: new Date(),
        });
        return await notification.save();
      })
    );
    res.status(201).json({ message: 'Notifications created successfully', notifications });
  } catch (error) {
    console.error('Error creating notification:', error.message, error.stack);
    res.status(500).json({ message: 'An error occurred: ' + error.message });
  }
};

// Bildirişləri çəkmə
export const getNotifications = async (req, res) => {
  try {
    console.log('Fetching notifications for user:', {
      email: req.user.email,
      id: req.user._id,
      role: req.user.role,
      course: req.user.course,
      groupNo: req.user.groupNo,
    });
    const notifications = await Notification.find({
      recipient: req.user._id,
      recipientRole: req.user.role,
      course: req.user.course,
      ...(req.user.role === 'student' ? { groupNo: req.user.groupNo } : {}),
    })
      .populate('sender', 'name surname')
      .sort({ createdAt: -1 });
    console.log('Fetched notifications:', notifications);
    res.json(notifications);
  } catch (error) {
    console.error('Error retrieving notifications:', error.message, error.stack);
    res.status(500).json({ message: 'An error occurred: ' + error.message });
  }
};

// Bildirişi oxundu kimi işarələmə
export const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user._id,
    });
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found or not authorized' });
    }
    notification.isRead = true;
    await notification.save();
    res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    console.error('Error marking notification as read:', error.message, error.stack);
    res.status(500).json({ message: 'An error occurred: ' + error.message });
  }
};