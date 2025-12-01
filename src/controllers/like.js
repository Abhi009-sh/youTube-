import mongoose,{isValidObjectId} from 'mongoose';
import {ApiError} from '../utils/apierror.js';
import {Like} from '../modules/like.js';
import { ApiResponse } from '../utils/apiresponse.js';
import {asynchandler} from '../utils/asynchandler.js';


const toggleLike = asynchandler(async (req, res) => {
  // accept id from route param or request body and avoid destructuring from undefined
  const likedContentId = String(req.params.videoId || req.body?.likedContentId || "").trim();
  const likeType = (req.body?.likeType || "Video").toString();

  if (!likedContentId || !likeType) {
    throw new ApiError(400, "likedContentId and likeType are required");
  }

  const validTypes = ["Video", "Comment"];
  if (!validTypes.includes(likeType)) {
    throw new ApiError(400, "likeType must be 'Video' or 'Comment'");
  }

  if (!isValidObjectId(likedContentId)) {
    throw new ApiError(400, "Invalid likedContentId");
  }

  const filters = {
    likedBy: new mongoose.Types.ObjectId(req.user._id),
    [likeType]: new mongoose.Types.ObjectId(likedContentId),
  };

  const deletedLike = await Like.findOneAndDelete(filters);
  let liked = false;
  if (!deletedLike) {
    await Like.create({
      likedBy: req.user._id,
      [likeType]: likedContentId,
    });
    liked = true;
  }

  const likesCount = await Like.countDocuments({
    [likeType]: new mongoose.Types.ObjectId(likedContentId),
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { liked, likesCount }, liked ? `${likeType} liked` : `${likeType} unliked`));
})
const getLikesCount = asynchandler(async (req, res) => {
  const userId = req.user._id;
  const likesVideo = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(userId),
        video: { $exists: true },
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "videoDetails",
        pipeline: [
          {
            $project: {
              videoFile: 1,
              thumbnail: 1,
              title: 1,
              description: 1,
              duration: 1,
              views: 1,
              isPublished: 1,
              owner: 1,
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "ownerDetails",
              pipeline: [
                {
                  $lookup: {
                    from: "subscriptions", // fix collection name if different in your DB
                    localField: "_id",
                    foreignField: "channel",
                    as: "subscribers",
                  },
                },
                {
                  $addFields: {
                    subscribersCount: { $size: "$subscribers" },
                  },
                },
                {
                  $project: {
                    _id: 0,
                    avatar: 1,
                    FullName: 1,
                    username: 1,
                    subscribersCount: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: { $first: "$ownerDetails" },
            },
          },
        ],
      },
    },
    {
      $addFields: {
        video: { $first: "$videoDetails" },
      },
    },
    {
      $project: {
        videoDetails: 0,
      },
    }, 
  ]);

  return res.status(200).json(new ApiResponse(200, likesVideo, "liked videos fetched successfully"));
})
export{
  toggleLike,
  getLikesCount
}
