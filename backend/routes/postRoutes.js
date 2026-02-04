import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPosts, createPost, submitVote, checkVoteStatus } from '../controllers/postController.js';
import { postCreationLimiter, voteLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

// File upload configuration
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
        filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
    }),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    }
});

// Routes
router.get('/', getPosts);
router.post('/', postCreationLimiter, upload.array('media', 4), createPost);
router.post('/:id/vote', voteLimiter, submitVote);
router.get('/:id/vote', checkVoteStatus);

export default router;
