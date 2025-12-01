import{Router} from "express";

import{
    getAllVideos,
  getVideoById,
  publishVideo,
  updateVideo,
  deleteVideo,
  togglePublishedStatus
} from "../controllers/video.js";
import {verifyJWT} from "../middlewares/auth.js";
import{upload} from "../middlewares/multer.js";
const router=Router();
router.use(verifyJWT);
router.get("/",getAllVideos);
router.route("/upload").post(verifyJWT,upload.fields([
  {
    name:"thumbnail",
    maxCount:1,
  },{
    name:"videoFile",
    maxCount:1,
  }

  
]),publishVideo)
router.route("/:videoId")
.get(getVideoById)
.delete(deleteVideo)
.patch(upload.single('thumbnail'),updateVideo)
router.patch('/:videoId/togglePublished',togglePublishedStatus);

export default router;


