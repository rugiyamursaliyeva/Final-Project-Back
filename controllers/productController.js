import ProductModel from "../models/productModel.js";

const getProducts = async (req, res) => {
    const products = await ProductModel.find()
    res.json(products)
}

const postProduct = async (req, res) => {
    const {image, title, description} = req.body
    const product = {image, title, description}
    await ProductModel.create(product)
    res.json(product)
}

const deleteProduct = async (req, res) => {
    const {id} = req.params
    await ProductModel.findByIdAndDelete(id)
    res.json(`${id} -li product silindi`)
}

export {getProducts, postProduct, deleteProduct}