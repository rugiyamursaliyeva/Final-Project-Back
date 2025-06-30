// ✅ İMPORTLAR
import Assignment from '../models/Assignment.js';
import Notification from '../models/Notification.js';
import User from '../models/userModel.js';
import Group from '../models/Group.js';    // <== ƏLAVƏ OLUNDU
import { transporter } from '../server.js';


// ✅ Tələbənin tapşırıqlarını gətir (düzəldilmiş)
export const getAssignmentsByStudent = async (req, res) => {
  try {
    // Tələbənin kursuna və qrupuna görə tapşırıqları gətir
    const assignments = await Assignment.find({ 
      course: req.user.course, 
      groupNo: req.user.groupNo 
    }).populate('teacher', 'name surname');
    
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: 'Xəta baş verdi' });
  }
};

// ✅ Müəllimin tapşırıqlarını gətir (öz qruplarına aid)
export const getAssignmentsByTeacher = async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Yalnız müəllimlər bu əməliyyatı yerinə yetirə bilər' });
    }

    const assignments = await Assignment.find({ course: req.user.course, groupNo: req.user.groupNo });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: 'Xəta baş verdi' });
  }
};


// ✅ Tapşırıq yaratma (müəllim üçün, deadline ilə)
export const createAssignment = async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Yalnız müəllimlər tapşırıq yarada bilər' });
    }

    const { title, description, deadline, course, groupNo } = req.body;

    // 🟢 Əlavə: Mövcud qrupu yoxla
    const groupExists = await Group.findOne({ course, groupNo });
    if (!groupExists) {
      return res.status(400).json({ message: 'Bu kursa aid qrup mövcud deyil' });
    }

    // Tapşırığı yarat
    const newAssignment = new Assignment({
      title,
      description,
      deadline: new Date(deadline),
      course,
      groupNo,
      teacher: req.user.id,
    });

    await newAssignment.save();

    // Tələbələrə bildiriş və email göndər
    const students = await User.find({ role: 'student', course, groupNo });
    for (const student of students) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: student.email,
        subject: 'Yeni Tapşırıq',
        text: `Hörmətli ${student.name}, "${title}" adlı yeni tapşırıq əlavə olundu. Son tarix: ${deadline}`,
      });

      const notification = new Notification({
        user: student._id,
        message: `Yeni tapşırıq: ${title}. Son tarix: ${deadline}`,
      });
      await notification.save();
    }

    res.status(201).json({ message: 'Tapşırıq uğurla yaradıldı' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Xəta baş verdi' });
  }
};


// ✅ Tapşırıq göndərmə (tələbə üçün)
export const submitAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { githubLink } = req.body;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Tapşırıq tapılmadı' });
    }

    if (assignment.student?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'İcazəniz yoxdur' });
    }

    assignment.githubLink = githubLink;
    assignment.submittedAt = new Date();
    await assignment.save();

    res.json({ message: 'Tapşırıq uğurla göndərildi' });
  } catch (error) {
    res.status(500).json({ message: 'Xəta baş verdi' });
  }
};


// ✅ Tapşırığı qiymətləndirmə (müəllim üçün)
export const gradeAssignment = async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Yalnız müəllimlər qiymətləndirə bilər' });
    }

    const { assignmentId } = req.params;
    const { grade, feedback } = req.body;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Tapşırıq tapılmadı' });
    }

    if (assignment.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: 'İcazəniz yoxdur' });
    }

    assignment.grade = grade;
    assignment.feedback = feedback;
    await assignment.save();

    // Tələbəyə email və bildiriş göndər
    const student = await User.findById(assignment.student);
    if (student) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: student.email,
        subject: 'Tapşırıq Qiymətləndirildi',
        text: `Hörmətli ${student.name}, "${assignment.title}" tapşırığınız qiymətləndirildi. Qiymət: ${grade}. Rəy: ${feedback}`,
      });

      const notification = new Notification({
        user: student._id,
        message: `Tapşırıq "${assignment.title}" qiymətləndirildi. Qiymət: ${grade}`,
      });
      await notification.save();
    }

    res.json({ message: 'Tapşırıq qiymətləndirildi' });
  } catch (error) {
    res.status(500).json({ message: 'Xəta baş verdi' });
  }
};
