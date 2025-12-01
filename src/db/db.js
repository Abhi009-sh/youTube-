import mongoose from "mongoose";
import {DB_NAME} from '../constrant.js';
const connectDB=async()=>{
    try{ 
       const connectionInstance= await mongoose.connect(`${process.env.MONGO_URL}/${DB_NAME}`)
        console.log(`Database connected !! Db host:${connectionInstance.connection.host}`);
    }
    catch(error){
        console.log('Error connecting database',error);
        process.exit(1);
    }
}
export default connectDB;