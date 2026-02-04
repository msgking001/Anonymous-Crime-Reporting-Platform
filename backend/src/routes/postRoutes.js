import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import * as postController from '../controllers/postController.js';
import { postCreationLimiter, voteLimiter } from '../middleware/rateLimit.js';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
        filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
    }),
    limits: { fileSize: 10 * 1024 * 1024 }
});

router.get('/', postController.getPosts);
router.post('/', postCreationLimiter, upload.array('media', 4), postController.createPost);
router.post('/:id/vote', voteLimiter, postController.submitVote);
router.get('/:id/vote', postController.checkVoteStatus);

export default router;
