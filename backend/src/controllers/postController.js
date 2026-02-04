import mongoose from 'mongoose';
import Post from '../models/Post.js';

/**
 * GET /api/posts
 * Public feed with pagination and filters
 */
export const getPosts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const filter = {};
        if (req.query.category) filter.category = req.query.category;
        if (req.query.city) filter.city = { $regex: req.query.city, $options: 'i' };

        const posts = await Post.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Post.countDocuments(filter);

        res.json({
            success: true,
            data: posts,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

/**
 * POST /api/posts
 * Create an anonymous post
 */
export const createPost = async (req, res) => {
    try {
        const { title, description, category, city } = req.body;

        if (!title || !description || !category || !city) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        const mediaUrls = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

        const post = new Post({
            title,
            description,
            category,
            city,
            mediaUrls
        });

        await post.save();

        res.status(201).json({ success: true, data: post });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

/**
 * POST /api/posts/:id/vote
 * Submit a session-based vote with atomic update
 */
export const submitVote = async (req, res) => {
    try {
        const { id } = req.params;
        const { voteType } = req.body;
        const sessionId = req.headers['x-session-id'];

        if (!sessionId) {
            return res.status(400).json({ success: false, error: 'Session ID required' });
        }

        const validVotes = ['low_risk', 'concerning', 'urgent', 'critical'];
        if (!validVotes.includes(voteType)) {
            return res.status(400).json({ success: false, error: 'Invalid vote type' });
        }

        // Tracking votes to enforce session-based restriction
        // Using a separate collection for vote tracking to allow session-based lookups
        const VoteTrack = mongoose.models.VoteTrack || mongoose.model('VoteTrack', new mongoose.Schema({
            postId: mongoose.Schema.Types.ObjectId,
            sessionId: String,
            voteType: String
        }));

        const existingVote = await VoteTrack.findOne({ postId: id, sessionId });

        // Weight calculation logic
        const weights = { low_risk: 1, concerning: 3, urgent: 6, critical: 10 };

        if (existingVote) {
            if (existingVote.voteType === voteType) {
                return res.json({ success: true, message: 'Already voted' });
            }

            // Atomic update: decrement old, increment new
            const update = {
                $inc: {
                    [`votes.${existingVote.voteType}`]: -1,
                    [`votes.${voteType}`]: 1,
                    severityScore: weights[voteType] - weights[existingVote.voteType]
                }
            };

            await Post.findByIdAndUpdate(id, update);
            existingVote.voteType = voteType;
            await existingVote.save();
        } else {
            // New vote
            const update = {
                $inc: {
                    [`votes.${voteType}`]: 1,
                    severityScore: weights[voteType]
                }
            };

            await Post.findByIdAndUpdate(id, update);
            await VoteTrack.create({ postId: id, sessionId, voteType });
        }

        res.json({ success: true, message: 'Vote recorded' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

/**
 * GET /api/posts/:id/vote
 * Check session vote status
 */
export const checkVoteStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const sessionId = req.headers['x-session-id'];

        if (!sessionId) return res.json({ success: true, voted: false });

        const VoteTrack = mongoose.models.VoteTrack;
        if (!VoteTrack) return res.json({ success: true, voted: false });

        const vote = await VoteTrack.findOne({ postId: id, sessionId });
        res.json({ success: true, voted: !!vote, voteType: vote?.voteType || null });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};
