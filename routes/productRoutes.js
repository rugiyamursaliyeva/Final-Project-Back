import express from 'express'
import { deleteProduct, getProducts, postProduct } from '../controllers/productController.js'

const router = express.Router()

router
.get('/product', getProducts)
.post('/product', postProduct)
.delete('/product/:id', deleteProduct)

export default router