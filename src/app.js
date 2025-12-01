import express from 'express';
import cookieParser from 'cookie-parser';
import cors from'cors';

const app=express();
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}));
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static('public'));
app.use(cookieParser());

import userRouter from './routes/user.js';
import videoRouter from './routes/video.js';
import commentRouter from './routes/comment.js';
import playListsRouter from './routes/playlist.js';
import likeRouter from './routes/like.js';
app.use('/videos',videoRouter);
app.use('/users',userRouter);  
app.use('/comments',commentRouter)
app.use('/playLists',playListsRouter);
app.use('/likes',likeRouter);
export  {app};