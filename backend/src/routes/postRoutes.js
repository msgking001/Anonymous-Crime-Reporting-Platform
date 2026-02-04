import express from 'express';
import * as postController from '../controllers/postController.js';
import { postCreationLimiter, voteLimiter } from '../middleware/rateLimit.js';
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

const router = express.Router();

// Public Feed & Reporting
router.get('/', postController.getPosts);

/**
 * POST /api/posts
 * Multi-part submission for media support
 */
router.post('/', postCreationLimiter, upload.single('media'), postController.createPost);

// Voting
router.post('/:id/vote', voteLimiter, postController.submitVote);
router.get('/:id/vote', postController.checkVoteStatus);

// Status Check
router.get('/status/:token', postController.checkPostStatus);

export default router;
