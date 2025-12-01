import mongoose from "mongoose";
import { Comment } from "../modules/comment.js";
import { ApiError } from "../utils/apierror.js";
import { ApiResponse } from "../utils/apiresponse.js";
import { asynchandler } from "../utils/asynchandler.js";
import { Video } from "../modules/video.js";

const getVideoComments = asynchandler(async (req, res) => {
  const rawVideoId=req.params.videoId;
  const  videoId  = String(rawVideoId ?? "").trim();
  const { page = 1, limit = 10 } = req.query;

  if (!videoId) {
    throw new ApiError(400, "videoId is required");
  }
  const videoExist = await Video.findById(videoId);
  if (!videoExist) {
    throw new ApiError(404, "video not found");
  }
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };
  const aggregateComments = Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "commenter",
        pipeline: [
          {
            $project: {
              avatar: 1,
              FullName: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "comment",
        as: "likes",
      },
    },
    {
      $addFields: {
        likesCount: {
          $size: "$likes",
        },
        commenter: {
          $first: "$commenter",
        },
      },
    },
    {
      $project: {
        commenter: 1,
        likesCount: 1,
        createdAt: 1,
        content: 1,
      },
    },
  ]);

  const comments = await Comment.aggregatePaginate(aggregateComments, options);
  return res
    .status(200)
    .json(new ApiResponse(200, comments.docs, "comments fetched successfully"));
});

const addComment = asynchandler(async (req, res) => {
  const rawVideoId = req.body.videoId ?? req.params.videoId;
  const videoId = String(rawVideoId || "").trim();
  const {content}=req.body;

  console.log("videoId raw:", JSON.stringify(rawVideoId), "=> trimmed:", videoId);

  if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "video doesnot found");
  }
  const comment = await Comment.create({
    content,
    video: videoId,
    owner: req.user._id,
  });
  return res
    .status(201)
    .json(new ApiResponse(201, comment, "comment added successfully"));
});

const deleteComment = asynchandler(async (req, res) => {
    const rawCommentId=req.params.commentId;
  const  commentId  = String(rawCommentId ?? "").trim();

  if (!commentId) {
    throw new ApiError(400, "commentId is required");
  }
  const comment = await Comment.findByIdAndDelete(commentId);
  if (!comment) {
    throw new ApiError(404, "comment not found to be deleted");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, comment, "comment deleted successfully"));
});
const updateComment = asynchandler(async (req, res) => {
  const rawCommentId=req.params.commentId;
  const  commentId  = String(rawCommentId ?? "").trim();
  const { content } = req.body;
  if (!(commentId && content.trim())) {
    throw new ApiError(400, "commentId and content are required to update");
  }
  const comment = await Comment.findByIdAndUpdate(
    commentId,
    {
      content: content.trim(),
    },
    {
      new: true,
    }
  );
  if (!comment) {
    throw new ApiError(400, "comment not found to be updated");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "comment updated successfully"));
});

export { getVideoComments, addComment, deleteComment, updateComment };
