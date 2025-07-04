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
      cb(new Error('Only PDF files are accepted.'), false);
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
    res.status(500).json({ message: 'An error occurred: ' + error.message });
  }
};

// Material əlavə etmə (müəllim üçün)
export const createMaterial = async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can add materials' });
    }

    upload(req, res, async (err) => {
      if (err) {
        console.error('Upload error:', err.message);
        return res.status(400).json({ message: err.message || 'File upload error' });
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
          return res.status(500).json({ message: 'File uploaded but not found on the server' });
        }
      } else if (type === 'video' && req.body.url) {
        const urlPattern = /^https?:\/\/(www\.)?[\w-]+\.[\w-]+(\/[\w-./?%&=]*)?$/;
        if (!urlPattern.test(req.body.url)) {
          console.error('Invalid video URL:', req.body.url);
          return res.status(400).json({ message: 'Please enter a valid video URL.' });
        }
        url = req.body.url;
        console.log('Video URL:', url);
      } else {
        console.error('Missing file or URL for type:', type);
        return res.status(400).json({ message: 'A file or URL for a video is required for a PDF.' });
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
      res.status(201).json({ message: 'Material added successfully', material: newMaterial });
    });
  } catch (error) {
    console.error('Create material error:', error.message);
    res.status(500).json({ message: 'An error occurred:' + error.message });
  }
};

// Material redaktə etmə (müəllim üçün)
export const updateMaterial = async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can edit material' });
    }

    upload(req, res, async (err) => {
      if (err) {
        console.error('Upload error:', err.message);
        return res.status(400).json({ message: err.message || 'File upload error' });
      }

      const { materialId } = req.params;
      const { title, type, course, description, groupNo } = req.body;
      let updateData = { title, type, course, description, groupNo };

      const material = await Material.findById(materialId);
      if (!material) {
        console.error('Material not found:', materialId);
        return res.status(404).json({ message: 'Material not found' });
      }

      if (material.uploadedBy.toString() !== req.user.id) {
        return res.status(403).json({ message: 'You do not have permission to edit this material.' });
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
          return res.status(400).json({ message: 'Please enter a valid video URL.' });
        }
        updateData.url = req.body.url;
        console.log('Video URL updated:', updateData.url);
      } else if (!req.file && !req.body.url) {
        updateData.url = material.url;
      }

      const updatedMaterial = await Material.findByIdAndUpdate(materialId, updateData, { new: true });
      console.log('Material updated:', updatedMaterial);
      res.json({ message: 'Material updated successfully.', material: updatedMaterial });
    });
  } catch (error) {
    console.error('Update material error:', error.message);
    res.status(500).json({ message: 'An error occurred: ' + error.message });
  }
};

// Material silmə (müəllim üçün)
export const deleteMaterial = async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can delete material' });
    }

    const { materialId } = req.params;
    const material = await Material.findById(materialId);
    if (!material) {
      console.error('Material not found:', materialId);
      return res.status(404).json({ message: 'Material not found' });
    }

    if (material.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You do not have permission to delete this material.' });
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
    res.json({ message: 'Material successfully deleted.' });
  } catch (error) {
    console.error('Delete material error:', error.message);
    res.status(500).json({ message: 'An error occurred: ' + error.message });
  }
};