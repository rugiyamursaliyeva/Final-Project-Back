// groupController.js
import Group from '../models/group.js';

// Yeni qrup yaratmaq
export const createGroup = async (req, res) => {
  try {
    const { groupNo, course } = req.body;

    if (!groupNo || !course) {
      return res.status(400).json({ success: false, message: 'Group number and course required' });
    }

    const existing = await Group.findOne({ groupNo, course });
    if (existing) {
      return res.status(400).json({ success: false, message: 'This group already exists.' });
    }

    const group = new Group({ groupNo, course });
    const savedGroup = await group.save();

    res.status(201).json({ success: true, message: 'Group created successfully', group: savedGroup });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
};

// Bütün qrupları gətirmək
export const getGroups = async (req, res) => {
  try {
    const groups = await Group.find().sort({ course: 1, groupNo: 1 });
    res.json({ success: true, groups, count: groups.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Unable to retrieve groups' });
  }
};

// Qrupu yeniləmək
export const updateGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { groupNo, course } = req.body;

    if (!groupNo || !course) {
      return res.status(400).json({ success: false, message: 'Group number and course required' });
    }

    // Başqa qrupda eyni ad varsa, xətadır
    const existing = await Group.findOne({ groupNo, course, _id: { $ne: id } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'This group already exists.' });
    }

    const updatedGroup = await Group.findByIdAndUpdate(
      id,
      { groupNo, course },
      { new: true, runValidators: true }
    );

    if (!updatedGroup) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    res.json({ success: true, message: 'Group updated successfully.', group: updatedGroup });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Unable to update group' });
  }
};

// Qrupu silmək
export const deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const group = await Group.findByIdAndDelete(id);

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    res.json({ success: true, message: 'Group successfully deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Unable to delete group' });
  }
};

// Kursa görə qrupları almaq (register üçün)
export const getGroupsByCourse = async (req, res) => {
  try {
    const { course } = req.query;
    if (!course) {
      return res.status(400).json({ success: false, message: 'Course required' });
    }

    const groups = await Group.find({ course }).sort({ groupNo: 1 });

    res.json({ success: true, groups, count: groups.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Unable to retrieve groups' });
  }
};
