import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

export const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(
            `${process.env.MONGODB_URI}`,
            {
                dbName: DB_NAME,
                useNewUrlParser: true,
                useUnifiedTopology: true,
                // Remove writeConcern as it's being handled in the connection string
            }
        );
        
        console.log(`\n✅ MongoDB connected! DB HOST: ${connectionInstance.connection.host}`);
        console.log(`📊 Database: ${connectionInstance.connection.name}`);
        
        return connectionInstance;
    } catch (error) {
        console.error("❌ MongoDB connection error:", error);
        process.exit(1);
    }
};

export default connectDB;