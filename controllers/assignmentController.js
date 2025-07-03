import Assignment from '../models/Assignment.js';
import Notification from '../models/Notification.js';
import User from '../models/userModel.js';
import Group from '../models/group.js';
import { transporter } from '../server.js';

// Tələbənin tapşırıqlarını gətir
export const getAssignmentsByStudent = async (req, res) => {
  try {
    console.log('Fetching assignments for student:', req.user.email); // Debug
    const assignments = await Assignment.find({ 
      course: req.user.course, 
      groupNo: req.user.groupNo 
    }).populate('teacher', 'name surname');
    
    res.json(assignments);
  } catch (error) {
    console.error('Tələbə tapşırıqlarını əldə etmə xətası:', error.message, error.stack);
    res.status(500).json({ message: 'Xəta baş verdi: ' + error.message });
  }
};

// Müəllimin tapşırıqlarını gətir
export const getAssignmentsByTeacher = async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      console.error('Non-teacher attempted to fetch assignments:', req.user);
      return res.status(403).json({ message: 'Yalnız müəllimlər bu əməliyyatı yerinə yetirə bilər' });
    }

    console.log('Fetching assignments for teacher:', req.user.email); // Debug
    const assignments = await Assignment.find({ course: req.user.course });
    res.json(assignments);
  } catch (error) {
    console.error('Müəllim tapşırıqlarını əldə etmə xətası:', error.message, error.stack);
    res.status(500).json({ message: 'Xəta baş verdi: ' + error.message });
  }
};

// Tapşırıq yaratma
export const createAssignment = async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      console.error('Non-teacher attempted to create assignment:', req.user);
      return res.status(403).json({ message: 'Yalnız müəllimlər tapşırıq yarada bilər' });
    }

    const { title, description, deadline, course, groupNo } = req.body;
    console.log('Creating assignment:', { title, course, groupNo, teacherId: req.user.id }); // Debug

    // Mövcud qrupu yoxla
    const groupExists = await Group.findOne({ course, groupNo });
    if (!groupExists) {
      console.error('Group not found:', { course, groupNo });
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
      console.log('Sending notification to student:', student.email); // Debug
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
    console.error('Tapşırıq yaratma xətası:', error.message, error.stack);
    res.status(500).json({ message: 'Xəta baş verdi: ' + error.message });
  }
};

// Tapşırıq göndərmə
export const submitAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { githubLink } = req.body;

    console.log('Submitting assignment:', { assignmentId, githubLink, studentId: req.user.id }); // Debug

    if (!githubLink) {
      console.error('Missing GitHub link');
      return res.status(400).json({ message: 'GitHub linki tələb olunur' });
    }

    // GitHub link validasiyası
    const githubRegex = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w-]+(\/|\.git)?$/i;
    if (!githubRegex.test(githubLink)) {
      console.error('Invalid GitHub link:', githubLink);
      return res.status(400).json({ message: 'Etibarsız GitHub link formatı. Link https://github.com ilə başlamalı və istifadəçi adı və repository adı daxil olmalıdır (məsələn, https://github.com/username/repository və ya .git ilə)' });
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      console.error('Assignment not found:', assignmentId);
      return res.status(404).json({ message: 'Tapşırıq tapılmadı' });
    }

    // Tələbənin tapşırığa icazəsi olub-olmadığını yoxla
    if (req.user.role !== 'student' || req.user.course !== assignment.course || req.user.groupNo !== assignment.groupNo) {
      console.error('Unauthorized submission attempt:', { user: req.user, assignment });
      return res.status(403).json({ message: 'Bu tapşırığı təhvil vermək üçün icazəniz yoxdur' });
    }

    // Son tarix yoxlaması
    if (new Date(assignment.deadline) < new Date()) {
      console.error('Assignment deadline passed:', assignment.deadline);
      return res.status(400).json({ message: 'Tapşırıq üçün son tarix keçib' });
    }

    assignment.githubLink = githubLink;
    assignment.submittedAt = new Date();
    assignment.student = req.user.id; // Set student ID
    await assignment.save();

    // Müəllimə bildiriş göndər
    const teacher = await User.findById(assignment.teacher);
    if (teacher) {
      console.log('Sending notification to teacher:', teacher.email); // Debug
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: teacher.email,
        subject: 'Tapşırıq Təhvil Verildi',
        text: `Hörmətli ${teacher.name}, "${assignment.title}" tapşırığı ${req.user.name} tərəfindən təhvil verildi. Link: ${githubLink}`,
      });

      const notification = new Notification({
        user: teacher._id,
        message: `${req.user.name} "${assignment.title}" tapşırığını təhvil verdi.`,
      });
      await notification.save();
    }

    res.json({ message: 'Tapşırıq uğurla göndərildi', assignment });
  } catch (error) {
    console.error('Tapşırıq təhvil vermə xətası:', error.message, error.stack);
    res.status(500).json({ message: 'Xəta baş verdi: ' + error.message });
  }
};

// Tapşırığı qiymətləndirmə
export const gradeAssignment = async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      console.error('Non-teacher attempted to grade:', req.user);
      return res.status(403).json({ message: 'Yalnız müəllimlər qiymətləndirə bilər' });
    }

    const { assignmentId } = req.params;
    const { grade, feedback } = req.body;

    // Validate input
    if (!grade || !feedback) {
      console.error('Missing grade or feedback:', { grade, feedback });
      return res.status(400).json({ message: 'Qiymət və rəy tələb olunur' });
    }
    const gradeValue = parseInt(grade);
    if (isNaN(gradeValue) || gradeValue < 0 || gradeValue > 100) {
      console.error('Invalid grade value:', grade);
      return res.status(400).json({ message: 'Qiymət 0-100 arasında olmalıdır' });
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      console.error('Assignment not found:', assignmentId);
      return res.status(404).json({ message: 'Tapşırıq tapılmadı' });
    }

    // Allow any teacher of the same course to grade
    if (req.user.course !== assignment.course) {
      console.error('Teacher course mismatch:', {
        teacherCourse: req.user.course,
        assignmentCourse: assignment.course,
        teacherId: req.user.id,
        assignmentTeacher: assignment.teacher.toString(),
      });
      return res.status(403).json({ message: 'Bu tapşırığı qiymətləndirmək üçün icazəniz yoxdur' });
    }

    console.log('Grading assignment:', {
      assignmentId,
      teacherId: req.user.id,
      assignmentTeacher: assignment.teacher.toString(),
      grade: gradeValue,
      feedback,
    }); // Debug

    assignment.grade = gradeValue;
    assignment.feedback = feedback;
    await assignment.save();

    // Tələbəyə email və bildiriş göndər
    const students = await User.find({ role: 'student', course: assignment.course, groupNo: assignment.groupNo });
    const student = students.find(s => s._id.toString() === (assignment.student?.toString() || ''));
    if (student) {
      console.log('Sending notification to student:', student.email); // Debug
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: student.email,
        subject: 'Tapşırıq Qiymətləndirildi',
        text: `Hörmətli ${student.name}, "${assignment.title}" tapşırığınız ${req.user.name} ${req.user.surname} tərəfindən qiymətləndirildi. Qiymət: ${gradeValue}. Rəy: ${feedback || 'Rəy verilməyib'}`,
      });

      const notification = new Notification({
        user: student._id,
        message: `Tapşırıq "${assignment.title}" ${req.user.name} ${req.user.surname} tərəfindən qiymətləndirildi. Qiymət: ${gradeValue}`,
        teacher: req.user._id, // Müəllim ID-si əlavə olunur
      });
      await notification.save();
    } else {
      console.warn('No student found for assignment:', assignmentId); // Debug
    }

    res.json({ message: 'Tapşırıq qiymətləndirildi', assignment });
  } catch (error) {
    console.error('Tapşırıq qiymətləndirmə xətası:', error.message, error.stack);
    res.status(500).json({ message: 'Xəta baş verdi: ' + error.message });
  }
};

// Tapşırığı yeniləmə
export const updateAssignment = async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      console.error('Non-teacher attempted to update assignment:', req.user);
      return res.status(403).json({ message: 'Yalnız müəllimlər tapşırıq redaktə edə bilər' });
    }

    const { id } = req.params;
    const { title, description, deadline, course, groupNo } = req.body;

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      console.error('Assignment not found:', id);
      return res.status(404).json({ message: 'Tapşırıq tapılmadı' });
    }

    // Allow any teacher of the same course to update
    if (req.user.course !== assignment.course) {
      console.error('Teacher course mismatch:', {
        teacherCourse: req.user.course,
        assignmentCourse: assignment.course,
        teacherId: req.user.id,
        assignmentTeacher: assignment.teacher.toString(),
      });
      return res.status(403).json({ message: 'Bu tapşırığı redaktə etmək üçün icazəniz yoxdur' });
    }

    // Mövcud qrupu yoxla
    const groupExists = await Group.findOne({ course, groupNo });
    if (!groupExists) {
      console.error('Group not found:', { course, groupNo });
      return res.status(400).json({ message: 'Bu kursa aid qrup mövcud deyil' });
    }

    assignment.title = title || assignment.title;
    assignment.description = description || assignment.description;
    assignment.deadline = deadline ? new Date(deadline) : assignment.deadline;
    assignment.course = course || assignment.course;
    assignment.groupNo = groupNo || assignment.groupNo;
    await assignment.save();

    res.json({ message: 'Tapşırıq uğurla yeniləndi', assignment });
  } catch (error) {
    console.error('Tapşırıq yeniləmə xətası:', error.message, error.stack);
    res.status(500).json({ message: 'Xəta baş verdi: ' + error.message });
  }
};

// Tapşırığı silmə
export const deleteAssignment = async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      console.error('Non-teacher attempted to delete assignment:', req.user);
      return res.status(403).json({ message: 'Yalnız müəllimlər tapşırıq silə bilər' });
    }

    const { id } = req.params;

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      console.error('Assignment not found:', id);
      return res.status(404).json({ message: 'Tapşırıq tapılmadı' });
    }

    // Allow any teacher of the same course to delete
    if (req.user.course !== assignment.course) {
      console.error('Teacher course mismatch:', {
        teacherCourse: req.user.course,
        assignmentCourse: assignment.course,
        teacherId: req.user.id,
        assignmentTeacher: assignment.teacher.toString(),
      });
      return res.status(403).json({ message: 'Bu tapşırığı silmək üçün icazəniz yoxdur' });
    }

    await Assignment.deleteOne({ _id: id });

    res.json({ message: 'Tapşırıq uğurla silindi' });
  } catch (error) {
    console.error('Tapşırıq silmə xətası:', error.message, error.stack);
    res.status(500).json({ message: 'Xəta baş verdi: ' + error.message });
  }
};