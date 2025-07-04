import Material from '../models/Material.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/materials/';
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Yalnız PDF faylları qəbul olunur'), false);
    }
  },
}).single('file');

// Materialların siyahısı, filter və axtarış ilə
export const getMaterials = async (req, res) => {
  try {
    const { course, type, search, groupNo } = req.query;
    let filter = {};

    if (course) filter.course = course;
    if (type) filter.type = type;
    if (groupNo && groupNo !== 'all') filter.groupNo = groupNo;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const materials = await Material.find(filter).sort({ uploadDate: -1 });
    console.log('Fetched materials:', materials);
    res.json(materials);
  } catch (error) {
    console.error('Get materials error:', error.message);
    res.status(500).json({ message: 'Xəta baş verdi: ' + error.message });
  }
};

// Material əlavə etmə (müəllim üçün)
export const createMaterial = async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Yalnız müəllimlər material əlavə edə bilər' });
    }

    upload(req, res, async (err) => {
      if (err) {
        console.error('Upload error:', err.message);
        return res.status(400).json({ message: err.message || 'Fayl yüklənməsi xətası' });
      }

      const { title, type, course, description, groupNo } = req.body;
      let url;

      if (type === 'pdf' && req.file) {
        url = `/uploads/materials/${req.file.filename}`;
        console.log('PDF uploaded, URL:', url);
        // Faylın mövcudluğunu yoxla
        const filePath = path.join(process.cwd(), 'uploads', 'materials', req.file.filename);
        if (!fs.existsSync(filePath)) {
          console.error('File not found after upload:', filePath);
          return res.status(500).json({ message: 'Fayl yükləndi, lakin serverdə tapılmadı' });
        }
      } else if (type === 'video' && req.body.url) {
        const urlPattern = /^https?:\/\/(www\.)?[\w-]+\.[\w-]+(\/[\w-./?%&=]*)?$/;
        if (!urlPattern.test(req.body.url)) {
          console.error('Invalid video URL:', req.body.url);
          return res.status(400).json({ message: 'Düzgün video URL daxil edin' });
        }
        url = req.body.url;
        console.log('Video URL:', url);
      } else {
        console.error('Missing file or URL for type:', type);
        return res.status(400).json({ message: 'PDF üçün fayl və ya video üçün URL tələb olunur' });
      }

      const newMaterial = new Material({
        title,
        type,
        course,
        url,
        description,
        groupNo,
        uploadedBy: req.user.id,
      });

      await newMaterial.save();
      console.log('New material saved:', newMaterial);
      res.status(201).json({ message: 'Material uğurla əlavə olundu', material: newMaterial });
    });
  } catch (error) {
    console.error('Create material error:', error.message);
    res.status(500).json({ message: 'Xəta baş verdi: ' + error.message });
  }
};

// Material redaktə etmə (müəllim üçün)
export const updateMaterial = async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Yalnız müəllimlər material redaktə edə bilər' });
    }

    upload(req, res, async (err) => {
      if (err) {
        console.error('Upload error:', err.message);
        return res.status(400).json({ message: err.message || 'Fayl yüklənməsi xətası' });
      }

      const { materialId } = req.params;
      const { title, type, course, description, groupNo } = req.body;
      let updateData = { title, type, course, description, groupNo };

      const material = await Material.findById(materialId);
      if (!material) {
        console.error('Material not found:', materialId);
        return res.status(404).json({ message: 'Material tapılmadı' });
      }

      if (material.uploadedBy.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Bu materialı redaktə etməyə icazəniz yoxdur' });
      }

      if (type === 'pdf' && req.file) {
        if (material.url && material.url.startsWith('/uploads/materials/')) {
          const oldFilePath = path.join(process.cwd(), material.url.replace('/', ''));
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
            console.log('Old file deleted:', oldFilePath);
          }
        }
        updateData.url = `/uploads/materials/${req.file.filename}`;
        console.log('New PDF uploaded, URL:', updateData.url);
      } else if (type === 'video' && req.body.url) {
        const urlPattern = /^https?:\/\/(www\.)?[\w-]+\.[\w-]+(\/[\w-./?%&=]*)?$/;
        if (!urlPattern.test(req.body.url)) {
          console.error('Invalid video URL:', req.body.url);
          return res.status(400).json({ message: 'Düzgün video URL daxil edin' });
        }
        updateData.url = req.body.url;
        console.log('Video URL updated:', updateData.url);
      } else if (!req.file && !req.body.url) {
        updateData.url = material.url;
      }

      const updatedMaterial = await Material.findByIdAndUpdate(materialId, updateData, { new: true });
      console.log('Material updated:', updatedMaterial);
      res.json({ message: 'Material uğurla yeniləndi', material: updatedMaterial });
    });
  } catch (error) {
    console.error('Update material error:', error.message);
    res.status(500).json({ message: 'Xəta baş verdi: ' + error.message });
  }
};

// Material silmə (müəllim üçün)
export const deleteMaterial = async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Yalnız müəllimlər material silə bilər' });
    }

    const { materialId } = req.params;
    const material = await Material.findById(materialId);
    if (!material) {
      console.error('Material not found:', materialId);
      return res.status(404).json({ message: 'Material tapılmadı' });
    }

    if (material.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Bu materialı silməyə icazəniz yoxdur' });
    }

    if (material.type === 'pdf' && material.url && material.url.startsWith('/uploads/materials/')) {
      const filePath = path.join(process.cwd(), material.url.replace('/', ''));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('File deleted:', filePath);
      }
    }

    await Material.findByIdAndDelete(materialId);
    console.log('Material deleted:', materialId);
    res.json({ message: 'Material uğurla silindi' });
  } catch (error) {
    console.error('Delete material error:', error.message);
    res.status(500).json({ message: 'Xəta baş verdi: ' + error.message });
  }
};