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

const putProduct = async (req, res) => {
    const { id } = req.params; 
    const { image, title, description } = req.body; 

    try {
        const updatedProduct = await ProductModel.findByIdAndUpdate(
            id,
            { image, title, description },
            { new: true } 
        );

        if (!updatedProduct) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.json(updatedProduct);
    } catch (error) {
        res.status(500).json({ message: "An error occurred while updating the product.", error });
    }
};


export {getProducts, postProduct, deleteProduct, putProduct}