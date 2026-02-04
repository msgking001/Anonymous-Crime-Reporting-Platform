import express from 'express';
import * as postController from '../controllers/postController.js';
import { postCreationLimiter, voteLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

// Public Feed & Reporting
router.get('/', postController.getPosts);

/**
 * POST /api/posts
 * JSON-only report submission
 */
router.post('/', postCreationLimiter, postController.createPost);

// Voting
router.post('/:id/vote', voteLimiter, postController.submitVote);
router.get('/:id/vote', postController.checkVoteStatus);

// Status Check
router.get('/status/:token', postController.checkPostStatus);

export default router;
