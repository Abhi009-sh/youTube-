import dotenv from 'dotenv';
import connectDB from './db/db.js';

import{app} from '../src/app.js';


dotenv.config({
    path:'./.env'
});
connectDB()
.then(()=>{
    app.listen(process.env.PORT, () => {
    console.log(`Database connection succcessful at:${process.env.PORT}`);
})
})
.catch((error)=>{
    console.log("Database connection failed", error);
    process.exit(1);
})