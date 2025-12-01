import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../modules/video.js";
import { ApiError } from "../utils/apierror.js";
import { ApiResponse } from "../utils/apiresponse.js";
import { asynchandler } from "../utils/asynchandler.js";
import { User } from "../modules/user.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import{removeCloudinaryFile} from '../utils/removeCloudinary.js'

const getAllVideos = asynchandler(async (req, res) => {
  const { page = 1, limit = 10, sortBy, sortType, query, userId } = req.query;
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };
  if (sortBy) {
    options.sort = {
      [sortBy]: sortType === "asc" ? 1 : -1,
    };
  }
  const matchStage = {};
  if (isValidObjectId(userId)) {
    matchStage.owner = { $ne: new mongoose.Types.ObjectId(userId) };
  }
  if (query) {
    matchStage.$or = [
      {
        title: { $regex: query, $options: "i" },
      },
      {
        description: { $regex: query, $options: "i" },
      },
    ];
  }

  const aggregateVideos = Video.aggregate([{ $match: matchStage }]);

  const videos = await Video.aggregatePaginate(aggregateVideos, options);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { videos: videos.docs },
        " All Videos fetched succcessfully"
      )
    );
});

const getVideoById=asynchandler(async(req,res)=>{
    const {videoId}=req.params;
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,'Invalid videoId');
    }
      const video= await  Video.aggregate([
        {
            $match:{
                _id:new mongoose.Tyypes.ObjectId(videoId)
            }
        },{
            $lookup:{
                from:'subcriptions',
                localField:'_id',
                foreignField:'channel',
                as:'subscribers'
            }
        },{
            $lookup:{
                from:'likes',
                localField:'_id',
                foreignField:'video',
                as:'likes'
            }
        },{
            $lookup:{
                from:'comments',
                localField:'_id',
                foreignField:'video',
                as:'comments'
            }
        },{
            $addFields:{
               likesCount:{
                $size:'$likes'
               },
               commentsCount:{
                $size:'$comments'
               },
               subscribersCount:{
                $size:'$subscribers'
               }

               

            }
        },{
            $project:{
                subscribersCount:1,
                likesCount:1,
                commentsCount:1,
                duration:1,
                description:1,
                title:1,
                thumbnail:1,
                 isPublished:1,
                 views:1


            }
        }

      ])
      if(!video[0]?.isPublished){
        throw new ApiError(404,"video is privete or not published");
      }
      return res
      .status(200)
      .json(new ApiResponse(200,video[0],'Video fetched successfully')); 
      

})


const publishVideo=asynchandler(async(req,res)=>{
   const {title,description} =req.body

    if(!(title&&description)){
        throw new ApiError(404,'title and description are required');
    }
    let thumbnailLocalPath,videoLocalPath;
    if(req.files?.thumbnail?.length){
        thumbnailLocalPath=req.files.thumbnail[0].path;
    }else{
        throw new ApiError(400,'thumbnail is required');
    }
    if(req.files?.videoFile?.length){
        videoLocalPath=req.files.videoFile[0].path;
    }else{
        throw new ApiError(400,'videoFile is required');
    }
 if(!(thumbnailLocalPath && videoLocalPath)){
    throw new ApiError(400,"thumbnail or videofile is missing");
 }
    const thumbnail=await uploadOnCloudinary(thumbnailLocalPath,'thumbnail');
    const video= await uploadOnCloudinary(videoLocalPath,'video');
    if(!(thumbnail && video)){
        throw new ApiError(500,'error in uploading thumbnail or video');
    }
      const newVideo=await Video.create({
        title,
        description,
        thumbnail:thumbnail.url,
        owner:req.user_id,
        duration:video.duration,
        isPublished:true,
        videoFile:video.url
      })
      return res
      .status(201)
      .json(new ApiResponse(201,newVideo,"video published successfully"));



})

const updateVideo=asynchandler(async(req,res)=>{
const {videoId}=req.params;
const {title, description}=req.body;
const newThumbnailLocalPath=req.file?.path;
if(!(title || description|| newThumbnailLocalPath)){
  throw new ApiError(400,'nothing to update');
}
const existingVideo=await Video.findById(videoId);
if(!existingVideo){
  throw new ApiError(400,'Exsisting video not found');
}
let updatableFields={};
if(title){
  updatableFields.title=title;
}
if(description){
   updatableFields.description=description;
}
let newThumbnailUrl=null;

if(newThumbnailLocalPath){
  const uploadNewThumbnail=await uploadOnCloudinary(newThumbnailLocalPath,'thumbnail');
   
  if(!uploadNewThumbnail){
  throw new ApiError(500,'error in uploading new thumbnail');
}

newThumbnailUrl=uploadNewThumbnail.url;
updatableFields.thumbnail=newThumbnailUrl;
}
const updateVideo=await Video.findByIdAndUpdate(videoId,{
      $set:updatableFields
},{
  new:true
})
if(!updateVideo){
  throw new ApiError(500,"error in updating video");
}
if(newThumbnailUrl && existingVideo.thumbnail){
 await removeCloudinaryFile(existingVideo.thumbnail,'image');
}
return res
.status(200)
.json(new ApiResponse(200,updateVideo,'video updated successfully'));









})
const deleteVideo=asynchandler(async(req,res)=>{
  const {videoId}=req.params;
  if(!isValidObjectId(videoId)){
    throw new ApiError(400,'Invalid videoid');
  }
  const existingVideo=await Video.findById(videoId);
  if(!existingVideo){
    throw new ApiError('400','video doesnot exits')
  
  }
 
 await User.updateMany(
   {watchHistory:existingVideo._id},
   {
    $pull:{watchHistory:existingVideo._id}
   }, //many
 )


 await Like.deleteMay({video:existingVideo._id})
 await Comment.deleteMany({video:existingVideo._id})
 await Subcription.deleteMany({channel:existingVideo._id})
 const thumbnail=existingVideo.thumbnail;
 const videoUrl=existingVideo.videoFile;
 await removeCloudinaryFile(thumbnail);
  await removeCloudinaryFile(videoUrl, "video");

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video deleted successfully"));




})
const togglePublishedStatus=asynchandler(async(req,res)=>{
 const {videoId}=req.params;
 if(!isValidObjectId(videoId)){
  throw new ApiError(400,'Invalid videoId');
 }
  const response=await Video.findByIdAndUpdate(videoId,
    [
      {
        $set:{isPublished:{$eq:['$isPublished',false]}}
      }
    ],{
      new:true
    }
  )
   return res
   .status(200)
   .json(new ApiResponse(200,response,'video publish status toggled successfully'));

})
export{
  getAllVideos,
  getVideoById,
  publishVideo,
  updateVideo,
  deleteVideo,
  togglePublishedStatus
}