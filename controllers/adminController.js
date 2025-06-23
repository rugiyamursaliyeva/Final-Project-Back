export const adminLogin = (req, res) => {
  const adminUser = {
    username: 'admin',
    password: '1234',
  }

  const { username, password } = req.body
  if (username === adminUser.username && password === adminUser.password) {
    return res.status(200).json({ success: true, message: 'Admin girişi uğurludur' })
  } else {
    return res.status(401).json({ success: false, message: 'Yanlış istifadəçi adı və ya şifrə' })
  }
}
