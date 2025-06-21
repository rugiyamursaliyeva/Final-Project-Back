import express from 'express'
import { connectDB } from './configs/config.js';
import ProductRoutes from './routes/productRoutes.js'
import cors from 'cors'

const app = express()
app.use(express.urlencoded({extended:true}))
app.use(express.json())
app.use(cors('*'))

const adminUser = {
  username: 'admin',
  password: '1234',
}


app.post('/admin-login', (req, res) => {
  const { username, password } = req.body

  if (username === adminUser.username && password === adminUser.password) {
    return res.status(200).json({ success: true, message: 'Admin girişi uğurludur' })
  } else {
    return res.status(401).json({ success: false, message: 'Yanlış istifadəçi adı və ya şifrə' })
  }
})


app.use('/', ProductRoutes)


connectDB()

app.listen(5000, () => {
  console.log('backend running');
})
