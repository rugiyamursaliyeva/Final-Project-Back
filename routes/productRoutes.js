import express from 'express'
import { deleteProduct, getProducts, postProduct, putProduct } from '../controllers/productController.js'

const router = express.Router()

router
.get('/product', getProducts)
.post('/product', postProduct)
.delete('/product/:id', deleteProduct)
.put('/product/:id', putProduct)

export default router