// groupController.js
import Group from '../models/group.js';

// Yeni qrup yaratmaq
export const createGroup = async (req, res) => {
  try {
    const { groupNo, course } = req.body;

    if (!groupNo || !course) {
      return res.status(400).json({ success: false, message: 'Qrup nömrəsi və kurs tələb olunur' });
    }

    const existing = await Group.findOne({ groupNo, course });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Bu qrup artıq mövcuddur' });
    }

    const group = new Group({ groupNo, course });
    const savedGroup = await group.save();

    res.status(201).json({ success: true, message: 'Qrup uğurla yaradıldı', group: savedGroup });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server xətası: ' + err.message });
  }
};

// Bütün qrupları gətirmək
export const getGroups = async (req, res) => {
  try {
    const groups = await Group.find().sort({ course: 1, groupNo: 1 });
    res.json({ success: true, groups, count: groups.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Qrupları əldə etmək mümkün olmadı' });
  }
};

// Qrupu yeniləmək
export const updateGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { groupNo, course } = req.body;

    if (!groupNo || !course) {
      return res.status(400).json({ success: false, message: 'Qrup nömrəsi və kurs tələb olunur' });
    }

    // Başqa qrupda eyni ad varsa, xətadır
    const existing = await Group.findOne({ groupNo, course, _id: { $ne: id } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Bu qrup artıq mövcuddur' });
    }

    const updatedGroup = await Group.findByIdAndUpdate(
      id,
      { groupNo, course },
      { new: true, runValidators: true }
    );

    if (!updatedGroup) {
      return res.status(404).json({ success: false, message: 'Qrup tapılmadı' });
    }

    res.json({ success: true, message: 'Qrup uğurla yeniləndi', group: updatedGroup });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Qrup yeniləmək mümkün olmadı' });
  }
};

// Qrupu silmək
export const deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const group = await Group.findByIdAndDelete(id);

    if (!group) {
      return res.status(404).json({ success: false, message: 'Qrup tapılmadı' });
    }

    res.json({ success: true, message: 'Qrup uğurla silindi' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Qrup silmək mümkün olmadı' });
  }
};

// Kursa görə qrupları almaq (register üçün)
export const getGroupsByCourse = async (req, res) => {
  try {
    const { course } = req.query;
    if (!course) {
      return res.status(400).json({ success: false, message: 'Kurs tələb olunur' });
    }

    const groups = await Group.find({ course }).sort({ groupNo: 1 });

    res.json({ success: true, groups, count: groups.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Qrupları əldə etmək mümkün olmadı' });
  }
};
