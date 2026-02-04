import mongoose from 'mongoose';
import Post from '../models/Post.js';
import VoteTrack from '../models/VoteTrack.js';

/**
 * GET /api/posts
 * Public feed with pagination and filters
 * Always returns 200, even if result set is empty.
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

        // Always return success: true and the data array
        // This prevents 404s on empty pages as requested
        res.status(200).json({
            success: true,
            data: posts || [],
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit) || 0
            }
        });
    } catch (error) {
        console.error('getPosts error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

/**
 * POST /api/posts
 * Create an anonymous post
 * Includes compatibility layer for frontend field names
 */
export const createPost = async (req, res) => {
    try {
        const {
            category,
            description,
            city,
            area,
            initialThreatLevel,
            title
        } = req.body;

        // Safety: Reject only if critical fields for the schema are missing
        if (!description || !city) {
            return res.status(400).json({ success: false, error: 'Description and City are required' });
        }

        const post = new Post({
            title: title || area || 'Anonymous Report',
            description,
            category: category || initialThreatLevel || 'Other',
            city,
            mediaUrls: [] // JSON-only as requested
        });

        await post.save();

        res.status(201).json({ success: true, data: post });
    } catch (error) {
        console.error('createPost error:', error);
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

        const existingVote = await VoteTrack.findOne({ postId: id, sessionId });
        const weights = { low_risk: 1, concerning: 3, urgent: 6, critical: 10 };

        if (existingVote) {
            if (existingVote.voteType === voteType) {
                return res.json({ success: true, message: 'Already voted' });
            }

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
        console.error('submitVote error:', error);
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

        const vote = await VoteTrack.findOne({ postId: id, sessionId });
        res.json({ success: true, voted: !!vote, voteType: vote?.voteType || null });
    } catch (error) {
        console.error('checkVoteStatus error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};
