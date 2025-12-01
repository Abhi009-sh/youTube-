import {Router} from 'express';
const router=Router();
import {
    getVideoComments,
    addComment,
    deleteComment,
    updateComment,

} from '../controllers/comment.js';
import {verifyJWT} from '../middlewares/auth.js';
router.use(verifyJWT);
router.route('/:videoId').get(getVideoComments).post(addComment);
router.route('/:commentId').delete(deleteComment).patch(updateComment);
export default router;

