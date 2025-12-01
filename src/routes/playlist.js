import {Router} from 'express';
const router=Router();
import {
    createPlayList,
    addVideoToPlayList,
    getUserPlayLists,
  getPlaylistById,
    deletePlayList,
    removeVideoFromPlayList
} from '../controllers/playlist.js';
import {verifyJWT} from '../middlewares/auth.js';
router.use(verifyJWT);
router.post('/',createPlayList);
router.route('/:playListId')
      .get(getPlaylistById)
      .delete(deletePlayList);
router.patch('/add/:videoId/:playListId',addVideoToPlayList);
router.patch('/remove/:videoId/:playListId',removeVideoFromPlayList);
router.get('/user/:userId',getUserPlayLists);
export default router;