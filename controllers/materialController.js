import Material from '../models/Material.js';

// Materialların siyahısı, filter və axtarış ilə
export const getMaterials = async (req, res) => {
  try {
    const { course, type, search } = req.query;
    let filter = {};

    if (course) filter.course = course;
    if (type) filter.type = type;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const materials = await Material.find(filter).sort({ uploadDate: -1 });
    res.json(materials);
  } catch (error) {
    res.status(500).json({ message: 'Xəta baş verdi' });
  }
};

// Material əlavə etmə (müəllim üçün)
export const createMaterial = async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Yalnız müəllimlər material əlavə edə bilər' });
    }

    const { title, type, course, url, description } = req.body;

    const newMaterial = new Material({
      title,
      type,
      course,
      url,
      description,
      uploadedBy: req.user.id,
    });

    await newMaterial.save();
    res.status(201).json({ message: 'Material uğurla əlavə olundu' });
  } catch (error) {
    res.status(500).json({ message: 'Xəta baş verdi' });
  }
};