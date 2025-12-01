import {Router} from 'express';
const router=Router();
import{
    toggleLike,
    getLikesCount
} from '../controllers/like.js';
import {verifyJWT} from '../middlewares/auth.js';
router.use(verifyJWT);
router.post('/toggle-like/:videoId',toggleLike);
router.get('/likes-count',getLikesCount);
export default router;