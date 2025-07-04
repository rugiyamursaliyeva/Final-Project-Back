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
      subject: 'New Form Information',
      html: `
        <h2>New Application</h2>
        <p><b>Name:</b> ${name}</p>
        <p><b>Surname:</b> ${surname}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Phone:</b> ${phoneNumber}</p>
        <p><b>Message:</b><br/> ${message.replace(/\n/g, '<br/>')}</p> <!-- ✅ message displayed -->
      `
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('Email sent:', info.response)
    res.status(200).json({ success: true, message: 'Email senti' })
  } catch (error) {
    console.error('Error sending email:', error.message)
    res.status(500).json({ success: false, message: error.message })
  }
}
