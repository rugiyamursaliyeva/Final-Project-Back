import mongoose from "mongoose";

const productSchema = mongoose.Schema({
    image:{type:String, required:true},
    title:{type:String, required:true},
    description:{type:String, required:true}
}, {timestamps:true})

const ProductModel = mongoose.model('Product', productSchema)

export default ProductModel