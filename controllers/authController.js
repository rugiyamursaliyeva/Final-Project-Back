import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import { transporter } from '../server.js';

export const register = async (req, res) => {
  const { name, surname, email, password, confirmPassword, course, groupNo, role, inviteCode } = req.body;

  try {
    // Sahələrin yoxlanılması
    if (!name || !surname || !email || !password || !confirmPassword || !course || !groupNo || !role || !inviteCode) {
      return res.status(400).json({ message: 'Bütün sahələr məcburidir' });
    }

    // Təsdiqləmə kodu yoxlaması
    const validInviteCode = process.env.INVITE_CODE;
    if (inviteCode !== validInviteCode) {
      return res.status(400).json({ message: 'Yanlış dəvət kodu' });
    }

    // E-poçt domeni yoxlaması
    if (role === 'student' && !email.endsWith('@code.edu.az')) {
      return res.status(400).json({ message: 'Tələbə e-poçtu @code.edu.az domeni ilə olmalıdır' });
    }
    if (role === 'teacher' && !email.endsWith('@gmail.com')) {
      return res.status(400).json({ message: 'Müəllim e-poçtu @gmail.com domeni ilə olmalıdır' });
    }

    // Şifrə uyğunluğu
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Şifrə və təsdiq şifrəsi uyğun gəlmir' });
    }

    // Mövcud istifadəçi yoxlaması
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Bu email artıq istifadə olunur' });
    }

    // Rol yoxlaması
    if (!['student', 'teacher'].includes(role)) {
      return res.status(400).json({ message: 'Rol düzgün seçilməyib' });
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
      groupNo,
      role,
    });

    await newUser.save();

    // E-poçt bildirişi
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Qeydiyyat Uğurludur',
      text: `Hörmətli ${name} ${surname}, platformada qeydiyyatınız uğurla tamamlandı!`,
    });

    res.status(201).json({ message: 'Qeydiyyat uğurla tamamlandı' });
  } catch (error) {
    console.error(error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server xətası', error: error.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'E-poçt və şifrə məcburidir' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Email və ya şifrə yanlışdır' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Email və ya şifrə yanlışdır' });
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        course: user.course, // Add course to token for assignment filtering
        groupNo: user.groupNo, // Add groupNo to token for assignment filtering
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(200).json({
      message: 'Giriş uğurludur',
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
    res.status(500).json({ message: 'Server xətası', error: error.message });
  }
};
