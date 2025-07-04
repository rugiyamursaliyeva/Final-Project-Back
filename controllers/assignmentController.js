import Assignment from '../models/Assignment.js';
import Notification from '../models/Notification.js';
import User from '../models/userModel.js';
import Group from '../models/group.js';
import { transporter } from '../server.js';

// Tələbənin tapşırıqlarını gətir
export const getAssignmentsByStudent = async (req, res) => {
  try {
    console.log('Fetching assignments for student:', req.user.email);
    const assignments = await Assignment.find({
      course: req.user.course,
      groupNo: req.user.groupNo,
    }).populate('teacher', 'name surname');

    res.json(assignments);
  } catch (error) {
    console.error('Error retrieving student assignments:', error.message, error.stack);
    res.status(500).json({ message: 'An error occurred: ' + error.message });
  }
};

// Müəllimin tapşırıqlarını gətir
export const getAssignmentsByTeacher = async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      console.error('Non-teacher attempted to fetch assignments:', req.user);
      return res.status(403).json({ message: 'Only teachers can perform this operation.' });
    }

    console.log('Fetching assignments for teacher:', req.user.email);
    const assignments = await Assignment.find({ course: req.user.course });
    res.json(assignments);
  } catch (error) {
    console.error('Error retrieving teacher assignments:', error.message, error.stack);
    res.status(500).json({ message: 'An error occurred: ' + error.message });
  }
};

// Tapşırıq yaratma
export const createAssignment = async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      console.error('Non-teacher attempted to create assignment:', req.user);
      return res.status(403).json({ message: 'Only teachers can create assignments' });
    }

    const { title, description, deadline, course, groupNo } = req.body;
    console.log('Creating assignment:', { title, course, groupNo, teacherId: req.user.id });

    const groupExists = await Group.findOne({ course, groupNo });
    if (!groupExists) {
      console.error('Group not found:', { course, groupNo });
      return res.status(400).json({ message: 'There is no group for this course.' });
    }

    const newAssignment = new Assignment({
      title,
      description,
      deadline: new Date(deadline),
      course,
      groupNo,
      teacher: req.user.id,
    });

    await newAssignment.save();

    const students = await User.find({ role: 'student', course, groupNo });
    for (const student of students) {
      console.log('Sending notification to student:', student.email);
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: student.email,
        subject: 'New Task',
        text: `Dear ${student.name}, "${title}" A new task has been added. Deadline: ${deadline}`,
      });

      const notification = new Notification({
        recipient: student._id,
        recipientRole: 'student',
        course,
        message: `New Task: ${title}. Deadline: ${deadline}`,
        groupNo,
        sender: req.user._id,
        senderRole: req.user.role,
        assignmentTitle: title,
        isRead: false,
      });
      await notification.save();
    }

    res.status(201).json({ message: 'Task created successfully' });
  } catch (error) {
    console.error('Task creation error:', error.message, error.stack);
    res.status(500).json({ message: 'An error occurred: ' + error.message });
  }
};

// Tapşırıq göndərmə
export const submitAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { githubLink } = req.body;

    console.log('Submitting assignment:', { assignmentId, githubLink, studentId: req.user.id });

    if (!githubLink) {
      console.error('Missing GitHub link');
      return res.status(400).json({ message: 'GitHub link required' });
    }

    const githubRegex = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w-]+(\/|\.git)?$/i;
    if (!githubRegex.test(githubLink)) {
      console.error('Invalid GitHub link:', githubLink);
      return res.status(400).json({
        message: 'Invalid GitHub link format. Link https://github.com it should start with and include the username and repository name.(for example, https://github.com/username/repository or with .git)',
      });
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      console.error('Assignment not found:', assignmentId);
      return res.status(404).json({ message: 'Task not found' });
    }

    if (req.user.role !== 'student' || req.user.course !== assignment.course || req.user.groupNo !== assignment.groupNo) {
      console.error('Unauthorized submission attempt:', { user: req.user, assignment });
      return res.status(403).json({ message: 'You do not have permission to submit this assignment.' });
    }

    if (new Date(assignment.deadline) < new Date()) {
      console.error('Assignment deadline passed:', assignment.deadline);
      return res.status(400).json({ message: 'The deadline for the assignment has passed.' });
    }

    assignment.githubLink = githubLink;
    assignment.submittedAt = new Date();
    assignment.student = req.user.id;
    await assignment.save();

    const teacher = await User.findById(assignment.teacher);
    if (teacher) {
      console.log('Sending notification to teacher:', teacher.email);
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: teacher.email,
        subject: 'Task Assigned',
        text: `Dear ${teacher.name}, "${assignment.title}" task ${req.user.name} was handed over by. Link: ${githubLink}`,
      });

      const notification = new Notification({
        recipient: teacher._id,
        recipientRole: 'teacher',
        course: assignment.course,
        message: `${req.user.name} "${assignment.title}" handed over the assignment. Link: ${githubLink}`,
        groupNo: assignment.groupNo,
        sender: req.user._id,
        senderRole: req.user.role,
        assignmentTitle: assignment.title,
        isRead: false,
      });
      await notification.save();
    } else {
      console.warn('Teacher not found for assignment:', assignmentId);
    }

    res.json({ message: 'Task sent successfully.', assignment });
  } catch (error) {
    console.error('Task submission error:', error.message, error.stack);
    res.status(500).json({ message: 'An error occurred: ' + error.message });
  }
};

// Tapşırığı qiymətləndirmə
export const gradeAssignment = async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      console.error('Non-teacher attempted to grade:', req.user);
      return res.status(403).json({ message: 'Only teachers can evaluate' });
    }

    const { assignmentId } = req.params;
    const { grade, feedback } = req.body;

    if (!grade || !feedback) {
      console.error('Missing grade or feedback:', { grade, feedback });
      return res.status(400).json({ message: 'Score and feedback required' });
    }
    const gradeValue = parseInt(grade);
    if (isNaN(gradeValue) || gradeValue < 0 || gradeValue > 100) {
      console.error('Invalid grade value:', grade);
      return res.status(400).json({ message: 'Score should be between 0-100' });
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      console.error('Assignment not found:', assignmentId);
      return res.status(404).json({ message: 'Task not found' });
    }

    if (req.user.course !== assignment.course) {
      console.error('Teacher course mismatch:', {
        teacherCourse: req.user.course,
        assignmentCourse: assignment.course,
        teacherId: req.user.id,
        assignmentTeacher: assignment.teacher.toString(),
      });
      return res.status(403).json({ message: 'You do not have permission to grade this assignment.' });
  }

    console.log('Grading assignment:', {
      assignmentId,
      teacherId: req.user.id,
      assignmentTeacher: assignment.teacher.toString(),
      grade: gradeValue,
      feedback,
    });

    assignment.grade = gradeValue;
    assignment.feedback = feedback;
    await assignment.save();

    const students = await User.find({ role: 'student', course: assignment.course, groupNo: assignment.groupNo });
    const student = students.find(s => s._id.toString() === (assignment.student?.toString() || ''));
    if (student) {
      console.log('Sending notification to student:', student.email);
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: student.email,
        subject: 'Assignment Graded',
        text: `Dear ${student.name}, "${assignment.title}" youre task ${req.user.name} ${req.user.surname} Rated by. Score: ${gradeValue}. Opinion: ${feedback || 'No feedback given.'}`,
      });

      const notification = new Notification({
        recipient: student._id,
        recipientRole: 'student',
        course: assignment.course,
        message: `Task "${assignment.title}" ${req.user.name} ${req.user.surname} Rated by. Score: ${gradeValue}`,
        groupNo: assignment.groupNo,
        sender: req.user._id,
        senderRole: req.user.role,
        assignmentTitle: assignment.title,
        isRead: false,
      });
      await notification.save();
    } else {
      console.warn('No student found for assignment:', assignmentId);
    }

    res.json({ message: 'Assignment graded', assignment });
  } catch (error) {
    console.error('Task evaluation error:', error.message, error.stack);
    res.status(500).json({ message: 'An error occurred: ' + error.message });
  }
};

// Tapşırığı yeniləmə
export const updateAssignment = async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      console.error('Non-teacher attempted to update assignment:', req.user);
      return res.status(403).json({ message: 'Only teachers can edit assignments' });
    }

    const { id } = req.params;
    const { title, description, deadline, course, groupNo } = req.body;

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      console.error('Assignment not found:', id);
      return res.status(404).json({ message: 'Task not found' });
    }

    if (req.user.course !== assignment.course) {
      console.error('Teacher course mismatch:', {
        teacherCourse: req.user.course,
        assignmentCourse: assignment.course,
        teacherId: req.user.id,
        assignmentTeacher: assignment.teacher.toString(),
      });
      return res.status(403).json({ message: 'You do not have permission to edit this assignment.' });
    }

    const groupExists = await Group.findOne({ course, groupNo });
    if (!groupExists) {
      console.error('Group not found:', { course, groupNo });
      return res.status(400).json({ message: 'There is no group for this course.' });
    }

    assignment.title = title || assignment.title;
    assignment.description = description || assignment.description;
    assignment.deadline = deadline ? new Date(deadline) : assignment.deadline;
    assignment.course = course || assignment.course;
    assignment.groupNo = groupNo || assignment.groupNo;
    await assignment.save();

    res.json({ message: 'Task successfully updated', assignment });
  } catch (error) {
    console.error('Task update error:', error.message, error.stack);
    res.status(500).json({ message: 'An error occurred: ' + error.message });
  }
};

// Tapşırığı silmə
export const deleteAssignment = async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      console.error('Non-teacher attempted to delete assignment:', req.user);
      return res.status(403).json({ message: 'Only teachers can delete assignments.' });
    }

    const { id } = req.params;

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      console.error('Assignment not found:', id);
      return res.status(404).json({ message: 'Task not found' });
    }

    if (req.user.course !== assignment.course) {
      console.error('Teacher course mismatch:', {
        teacherCourse: req.user.course,
        assignmentCourse: assignment.course,
        teacherId: req.user.id,
        assignmentTeacher: assignment.teacher.toString(),
      });
      return res.status(403).json({ message: 'You do not have permission to delete this task.' });
    }

    await Assignment.deleteOne({ _id: id });

    res.json({ message: 'Task successfully deleted.' });
  } catch (error) {
    console.error('Task deletion error:', error.message, error.stack);
    res.status(500).json({ message: 'An error occurred: ' + error.message });
  }
};