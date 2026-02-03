import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import Post from '../models/Post.js';
import ThreatVote from '../models/ThreatVote.js';
import { hashToken } from '../utils/encryption.js';
import { generalLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Configure file upload
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', 'uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/webm', 'video/quicktime'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images and videos are allowed.'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    }
});

/**
 * GET /api/posts
 * Get paginated feed of posts
 */
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Filter options
        const filter = {};
        if (req.query.category) {
            filter.category = req.query.category;
        }
        if (req.query.city) {
            filter['location.city'] = { $regex: req.query.city, $options: 'i' };
        }

        // Only show non-flagged or verified posts
        filter.$or = [
            { 'moderation.flagged': false },
            { verified: true }
        ];

        // Sort by visibility score (combines threat, evidence, recency)
        const posts = await Post.find(filter)
            .sort({ visibilityScore: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('-moderation.flagReason'); // Hide internal moderation details

        const total = await Post.countDocuments(filter);

        res.json({
            success: true,
            data: {
                posts: posts.map(post => ({
                    postId: post.postId,
                    contentType: post.contentType,
                    mediaUrl: post.mediaUrl,
                    category: post.category,
                    description: post.description,
                    location: post.location,
                    timeWindow: post.timeWindow,
                    initialThreatLevel: post.initialThreatLevel,
                    threatLevel: getThreatLevel(post.threatScore),
                    communityFlagged: post.communityFlagged,
                    status: post.status,
                    statusMessage: post.statusMessage,
                    verified: post.verified,
                    createdAt: post.createdAt
                })),
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                    hasMore: page * limit < total
                }
            }
        });
    } catch (error) {
        console.error('Feed fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch posts'
        });
    }
});

/**
 * GET /api/posts/:postId
 * Get single post details
 */
router.get('/:postId', async (req, res) => {
    try {
        const post = await Post.findOne({ postId: req.params.postId });

        if (!post) {
            return res.status(404).json({
                success: false,
                error: 'Post not found'
            });
        }

        res.json({
            success: true,
            data: {
                postId: post.postId,
                contentType: post.contentType,
                mediaUrl: post.mediaUrl,
                category: post.category,
                description: post.description,
                location: post.location,
                timeWindow: post.timeWindow,
                initialThreatLevel: post.initialThreatLevel,
                threatLevel: getThreatLevel(post.threatScore),
                communityFlagged: post.communityFlagged,
                status: post.status,
                statusMessage: post.statusMessage,
                verified: post.verified,
                createdAt: post.createdAt
            }
        });
    } catch (error) {
        console.error('Post fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch post'
        });
    }
});

/**
 * POST /api/posts
 * Create a new anonymous post
 */
router.post('/', upload.single('media'), async (req, res) => {
    try {
        const { category, description, area, city, timeWindow, initialThreatLevel } = req.body;

        // Validation
        if (!category || !description || !area || !city) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: category, description, area, city'
            });
        }

        if (description.length < 20 || description.length > 500) {
            return res.status(400).json({
                success: false,
                error: 'Description must be between 20 and 500 characters'
            });
        }

        // Determine content type
        let contentType = 'text';
        let mediaUrl = null;

        if (req.file) {
            if (req.file.mimetype.startsWith('image/')) {
                contentType = 'image';
            } else if (req.file.mimetype.startsWith('video/')) {
                contentType = 'video';
            }
            mediaUrl = `/uploads/${req.file.filename}`;
        }

        // Basic content moderation (check for personal accusations)
        const flagged = containsPersonalAccusation(description);

        // Create post
        const post = new Post({
            postId: uuidv4().substring(0, 12),
            contentType,
            mediaUrl,
            category,
            description: sanitizeDescription(description),
            location: { area, city },
            timeWindow: timeWindow || 'Unknown',
            initialThreatLevel: initialThreatLevel || 'concerning',
            evidenceScore: contentType !== 'text' ? 70 : 50,
            moderation: {
                reviewed: false,
                flagged,
                flagReason: flagged ? 'Potential personal accusation' : ''
            }
        });

        await post.save();

        res.status(201).json({
            success: true,
            message: 'Post submitted successfully',
            data: {
                postId: post.postId,
                disclaimer: 'For awareness and early reporting only. Not a substitute for FIR.'
            }
        });
    } catch (error) {
        console.error('Post creation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create post'
        });
    }
});

/**
 * POST /api/posts/:postId/vote
 * Submit a threat level vote
 */
router.post('/:postId/vote', async (req, res) => {
    try {
        const { voteType } = req.body;
        const sessionId = req.headers['x-session-id'];

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                error: 'Session ID required'
            });
        }

        if (!['low_risk', 'concerning', 'urgent', 'critical'].includes(voteType)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid vote type'
            });
        }

        const post = await Post.findOne({ postId: req.params.postId });

        if (!post) {
            return res.status(404).json({
                success: false,
                error: 'Post not found'
            });
        }

        const sessionHash = hashToken(sessionId);

        // Check for existing vote
        const existingVote = await ThreatVote.findOne({
            postId: post._id,
            sessionHash
        });

        if (existingVote) {
            // Update existing vote
            const oldVoteType = existingVote.voteType;

            // Remove old vote count
            post.votes[oldVoteType] = Math.max(0, post.votes[oldVoteType] - 1);

            // Add new vote count
            post.votes[voteType] += 1;

            existingVote.voteType = voteType;
            existingVote.timestamp = new Date();
            await existingVote.save();
        } else {
            // Create new vote
            await ThreatVote.create({
                postId: post._id,
                voteType,
                sessionHash
            });

            post.votes[voteType] += 1;
            post.totalVotes += 1;
        }

        await post.save();

        res.json({
            success: true,
            message: 'Vote recorded',
            data: {
                threatLevel: getThreatLevel(post.threatScore)
            }
        });
    } catch (error) {
        console.error('Vote error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to record vote'
        });
    }
});

/**
 * GET /api/posts/:postId/vote
 * Check if session has voted on a post
 */
router.get('/:postId/vote', async (req, res) => {
    try {
        const sessionId = req.headers['x-session-id'];

        if (!sessionId) {
            return res.json({
                success: true,
                data: { hasVoted: false, voteType: null }
            });
        }

        const post = await Post.findOne({ postId: req.params.postId });

        if (!post) {
            return res.status(404).json({
                success: false,
                error: 'Post not found'
            });
        }

        const sessionHash = hashToken(sessionId);
        const existingVote = await ThreatVote.findOne({
            postId: post._id,
            sessionHash
        });

        res.json({
            success: true,
            data: {
                hasVoted: !!existingVote,
                voteType: existingVote?.voteType || null
            }
        });
    } catch (error) {
        console.error('Vote check error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check vote status'
        });
    }
});

// Helper function to convert score to threat level
function getThreatLevel(score) {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'urgent';
    if (score >= 30) return 'concerning';
    return 'low';
}

// Basic content moderation
function containsPersonalAccusation(text) {
    const patterns = [
        /\b(his|her|their)\s+name\s+is\b/i,
        /\b(phone|mobile|contact)\s*[:\s]+\d/i,
        /\b(address|lives\s+at|staying\s+at)\b/i,
        /\b(mr\.|mrs\.|ms\.)\s+[a-z]+\b/i
    ];
    return patterns.some(p => p.test(text));
}

// Sanitize description
function sanitizeDescription(text) {
    return text
        .replace(/<[^>]*>/g, '') // Remove HTML
        .replace(/[^\w\s.,!?-]/g, '') // Remove special chars except basic punctuation
        .trim();
}

export default router;
