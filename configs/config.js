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

// username = giamursal5
// password = upRjbBMQuUQpeH6D
// MONGO_URI = mongodb+srv://giamursal5:upRjbBMQuUQpeH6D@cluster0.drgkkqt.mongodb.net/

// EMAIL_USER=murselzade427@gmail.com
// EMAIL_PASS=qdcebokjqmytayph
// EMAIL_RECEIVER=murselzade427@gmail.com

// JWT_SECRET=supergizlikey
// JWT_EXPIRES_IN=24h

// INVITE_CODE=School2025


