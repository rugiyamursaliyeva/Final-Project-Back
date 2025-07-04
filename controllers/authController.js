import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import { transporter } from '../server.js';

export const register = async (req, res) => {
  const { name, surname, email, password, confirmPassword, course, groupNo, role, inviteCode } = req.body;

  try {
    // Sahələrin yoxlanılması
    if (!name || !surname || !email || !password || !confirmPassword || !course || !role || !inviteCode) {
      return res.status(400).json({ message: 'All required fields must be filled in.' });
    }

    // Tələbə üçün groupNo yoxlaması
    if (role === 'student' && !groupNo) {
      return res.status(400).json({ message: 'Group number is mandatory for students.' });
    }

    // Təsdiqləmə kodu yoxlaması
    const validInviteCode = process.env.INVITE_CODE;
    if (inviteCode !== validInviteCode) {
      return res.status(400).json({ message: 'Invalid invitation code' });
    }

    // E-poçt domeni yoxlaması
    if (role === 'student' && !email.endsWith('@code.edu.az')) {
      return res.status(400).json({ message: 'Student email must have the domain @code.edu.az' });
    }
    if (role === 'teacher' && !email.endsWith('@gmail.com')) {
      return res.status(400).json({ message: 'The teachers email must be with the @gmail.com domain.' });
    }

    // Şifrə uyğunluğu
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Password and confirmation password do not match.' });
    }

    // Mövcud istifadəçi yoxlaması
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'This email is already in use.' });
    }

    // Rol yoxlaması
    if (!['student', 'teacher'].includes(role)) {
      return res.status(400).json({ message: 'Role not selected correctly' });
    }

    // Şifrə şifrələmə
    const hashedPassword = await bcrypt.hash(password, 10);

    // Yeni istifadəçi yaratma
    const newUser = new User({
      name,
      surname,
      email,
      password: hashedPassword,
      course,
      groupNo: role === 'student' ? groupNo : null, // Set groupNo to null for teachers
      role,
    });

    await newUser.save();

    // E-poçt bildirişi
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Registration Successful',
      text: `Dear ${name} ${surname}, Your registration on the platform has been successfully completed.!`,
    });

    res.status(201).json({ message: 'Registration completed successfully.' });
  } catch (error) {
    console.error(error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Email or password is incorrect.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Email or password is incorrect.' });
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        course: user.course,
        groupNo: user.groupNo,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        surname: user.surname,
        email: user.email,
        role: user.role,
        course: user.course,
        groupNo: user.groupNo,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};