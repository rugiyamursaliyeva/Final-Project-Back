export const adminLogin = (req, res) => {
  const adminUser = {
    username: 'admin',
    password: '1234',
  }

  const { username, password } = req.body
  if (username === adminUser.username && password === adminUser.password) {
    return res.status(200).json({ success: true, message: 'Admin login successful' })
  } else {
    return res.status(401).json({ success: false, message: 'Incorrect username or password.' })
  }
}
