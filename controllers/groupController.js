import Group from '../models/Group.js';

export const createGroup = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Yalnız admin qrup yarada biler' });
    }
    const { groupNo, course } = req.body;
    const existing = await Group.findOne({ groupNo, course });
    if (existing) {
      return res.status(400).json({ message: 'Bu qrup artiq movcuddur' });
    }
    const group = new Group({ groupNo, course });
    await group.save();
    res.status(201).json({ message: 'Qrup yaradildi' });
  } catch (err) {
    res.status(500).json({ message: 'Xəta bas verdi' });
  }
};

export const getGroups = async (req, res) => {
  try {
    const groups = await Group.find().sort({ course: 1, groupNo: 1 });
    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: 'Xəta bas verdi' });
  }
};
