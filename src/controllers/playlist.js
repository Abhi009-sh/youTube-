import mongoose,{isValidObjectId} from 'mongoose';
import {PlayList} from '../modules/playlist.js';
import {ApiError} from '../utils/apierror.js';
import {ApiResponse} from '../utils/apiresponse.js';
import {asynchandler} from '../utils/asynchandler.js';
import {Video} from "../modules/video.js";



const createPlayList=asynchandler(async(req,res)=>{
    const {name,description}=req.body;
    if(!name.trim()|| !description.trim()){
        throw new ApiError(400,'name or descripition is missing');
    }
    const existing=await PlayList.findOne({
        owner:req.user._id,
        name:name.trim()
    })
    if(existing){
     throw new ApiError(409,'playlist with same name is already existed');
    }
  const newPlayList=await PlayList.create({
    owner:req.user._id,
    name:name.trim(),
    description:description.trim()
  })
  return res
  .status(201)
  .json(new ApiResponse(201,newPlayList,"new playlist created succesfully"));

})
const getUserPlayLists=asynchandler(async(req,res)=>{
 const {userId}=req.params;
 const playlists=await PlayList.aggregate([
    {
        $match:{
            owner:new mongoose.Types.ObjectId(userId)
        }
    },{
        $lookup:{
            from:"videos",
            localField:"videos",
            foreignField:"_id",
            as:"video",
            pipeline:[
                 {
                    $project:{
                        title:1,
                        description:1,
                        videoFile:1,
                        thumbnail:1,
                        duration:1,
                        views:1,
                        isPublished:1,
                        owner:1,

                    }
                 }
            ]
        }
    }
 ])
 if(!playlists){
 throw new ApiError(404,"no playlists found for the user");
 }
 return res
 .status(200)
 .json(new ApiResponse(200,playlists,'playlists fetched successfully'));
 

 



})
const getPlaylistById=asynchandler(async(req,res)=>{
    const rawId=req.params.playListId ?? "";
    const playlistId=String(rawId).trim();
    if(!mongoose.Types.ObjectId.isValid(playlistId)){
        throw new ApiError(400,'invalid playlistId');
    }
    const playList=await PlayList.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(playlistId)
            }
        },{
            $lookup:{
                from:"videos",
                localField:"videos",
                foreignField:"_id",
                as:"videos",
                pipeline:[
                    {
                        $project:{
                            title:1,
                            description:1,
                            videoFile:1,
                            thumbnail:1,
                            duration:1,
                            views:1,
                            isPublished:1,
                            owner:1
                        }
                    }
                ]
            }
        }
    ])
    if(!playList.length){
     throw new ApiError(404,'playlist not found');

    }
    return res
    .status(200)
    .json(new ApiResponse(200,playList,'playlist fetched successfully'));
})
const addVideoToPlayList=asynchandler(async(req,res)=>{
  const {playListId,videoId}=req.params;
//    -> get videoId and playlistId from request params 
//     -> validate is empty 
//     -> validate video and playlist exist 
//     -> add videoId in playlist videos
//     -> return response
//     */
  
if(!isValidObjectId(playListId) || !isValidObjectId(videoId)){
    throw new ApiError(400,'invalid playlisId or videoId');
}

const video=await Video.findById(videoId);
if(!video){
    throw new ApiError(404,'video not found');
}
const playlist=await PlayList.findById(playListId);
if(!playlist){
    throw new ApiError(404,'playlist not found');
}
const updatePlayList=await PlayList.findByIdAndUpdate(
    playListId,{
        $addToSet:{videos:videoId}
    },{
            new:true,
        }
)
return res
.status(200)
.json(new ApiResponse(200,updatePlayList,'video added to playlist scuccessfully'));

})
const deletePlayList=asynchandler(async(req,res)=>{
    const rawId=req.params.playListId ?? "";
    const playlistId=String(rawId).trim();
    if(!mongoose.Types.ObjectId.isValid(playlistId)){
        throw new ApiError(400,'invalid  playlistId');
    }
    const deletePlaylist=await PlayList.findByIdAndDelete(playlistId);
    if(!deletePlaylist){
        throw new ApiError(404,"playlist not found");
    }
    return res
    .status(200)
    .json(new ApiResponse(200,deletePlaylist,'playlist deleted scuccessfully'));
})
const removeVideoFromPlayList=asynchandler(async(req,res)=>{
    const {playListId:rawPlId,videoId:rawVdId}=req.params;
    const playlistId=String(rawPlId ??  "").trim();
    const videoId=String(rawVdId ?? "").trim();
    if(!mongoose.Types.ObjectId.isValid(playlistId) || !mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400,'invalid playlistId or videoId');
    }
    const updatePlaylist=await PlayList.findByIdAndUpdate(playlistId,{
        $pull:{
            videos:new mongoose.Types.ObjectId(videoId)
        }
    },{
        new:true
    })
    if(!updatePlaylist){
        throw new ApiError(404,'playlist not found');
    }

    const exitVideo=!updatePlaylist.videos.map(v=>v.string()).includes(videoId);
    if(!exitVideo){
        throw new ApiError(404,'video not found in playlist');
    }
    return res
    .status(200)
    .json(new ApiResponse(200,updatePlaylist,'video remvoed from playlist successfully'));

    

})
export{
    createPlayList,
    getUserPlayLists,
    getPlaylistById,
    addVideoToPlayList,
    deletePlayList,
    removeVideoFromPlayList
}