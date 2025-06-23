import nodemailer from 'nodemailer'

const submittedForms = {}

export const sendEmail = async (req, res) => {
  const { name, surname, email, phoneNumber, message } = req.body // ✅ message əlavə olundu
  const key = `${email}-${phoneNumber}`
  const now = Date.now()

  if (submittedForms[key] && now - submittedForms[key] < 1 * 60 * 1000) {
    return res.status(429).json({
      success: false,
      message: 'This information has already been submitted. Please try again after 1 minute.'
    })
  }

  submittedForms[key] = now

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      }
    })

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_RECEIVER,
      subject: 'Yeni Form Məlumatı',
      html: `
        <h2>Yeni Müraciət</h2>
        <p><b>Ad:</b> ${name}</p>
        <p><b>Soyad:</b> ${surname}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Telefon:</b> ${phoneNumber}</p>
        <p><b>Mesaj:</b><br/> ${message.replace(/\n/g, '<br/>')}</p> <!-- ✅ message göstərildi -->
      `
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('Email göndərildi:', info.response)
    res.status(200).json({ success: true, message: 'Email göndərildi' })
  } catch (error) {
    console.error('Email göndərmə xətası:', error.message)
    res.status(500).json({ success: false, message: error.message })
  }
}
