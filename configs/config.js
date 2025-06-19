import { configDotenv } from "dotenv";
import mongoose from "mongoose";

configDotenv()

export const connectDB = async () => {
    try {
        const connect = await mongoose.connect(process.env.MONGO_URI)
        console.log('databazaya bagalanildi');  
    } catch (error) {
        console.log('error');  
    }
}

// usename = nexixi5666
// password = eHVpIllX3RyINZSb
// MONGO_URI = mongodb+srv://nexixi5666:eHVpIllX3RyINZSb@cluster0.mlhc4of.mongodb.net/