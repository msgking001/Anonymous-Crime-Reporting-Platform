import mongoose from 'mongoose';
import Post from '../models/Post.js';
import VoteTrack from '../models/VoteTrack.js';
import { encrypt, decrypt, hashToken } from '../utils/encryption.js';
import { generateToken, generateReportId } from '../utils/tokenGenerator.js';

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

        // Decrypt descriptions for the feed
        const sanitizedPosts = posts.map(p => {
            const post = p.toObject();
            if (post.description) {
                try {
                    const decrypted = decrypt(post.description);
                    if (decrypted) post.description = decrypted;
                } catch (e) {
                    // Fail silently, keep original if not encrypted
                }
            }
            return post;
        });

        const total = await Post.countDocuments(filter);

        // Always return success: true and the data array
        // This prevents 404s on empty pages as requested
        res.status(200).json({
            success: true,
            data: sanitizedPosts || [],
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
            location, // Handle both flat and nested
            initialThreatLevel,
            title
        } = req.body;

        const effectiveCity = city || location?.city;
        const effectiveArea = area || location?.area;

        // Threat level mapping to ensure Mongoose enum compliance
        const threatLevelMap = {
            'low': 'low_risk',
            'medium': 'concerning',
            'high': 'urgent',
            'emergency': 'critical',
            'low_risk': 'low_risk',
            'concerning': 'concerning',
            'urgent': 'urgent',
            'critical': 'critical'
        };

        const mappedThreatLevel = threatLevelMap[initialThreatLevel] || 'concerning';

        if (!description || !effectiveCity) {
            return res.status(400).json({ success: false, error: 'Description and City are required' });
        }

        const reportId = generateReportId();
        const token = generateToken();
        const hashedTokenValue = hashToken(token);

        const post = new Post({
            postId: reportId,
            hashedToken: hashedTokenValue,
            title: title || effectiveArea || 'Anonymous Report',
            description: encrypt(description),
            category: category || 'Other',
            location: {
                area: effectiveArea || 'Unknown',
                city: effectiveCity || 'Unknown'
            },
            initialThreatLevel: mappedThreatLevel,
            mediaUrls: req.file ? [`/uploads/${req.file.filename}`] : [],
            contentType: req.file ? (req.file.mimetype.startsWith('video') ? 'video' : 'image') : 'none'
        });

        await post.save();

        res.status(201).json({
            success: true,
            data: {
                token, // Only shown once
                reportId,
                status: 'submitted',
                mediaUrls: post.mediaUrls,
                contentType: post.contentType,
                disclaimer: 'Save your token! It is the only way to track your report.'
            }
        });
    } catch (error) {
        console.error('createPost error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

/**
 * GET /api/posts/status/:token
 * Check report status using anonymous token
 */
export const checkPostStatus = async (req, res) => {
    try {
        const { token } = req.params;
        const hashedTokenValue = hashToken(token);

        const post = await Post.findOne({ hashedToken: hashedTokenValue });

        if (!post) {
            return res.status(404).json({ success: false, error: 'Report not found' });
        }

        let description = post.description;
        try {
            const decrypted = decrypt(post.description);
            if (decrypted) description = decrypted;
        } catch (e) { }

        res.json({
            success: true,
            data: {
                reportId: post.postId || post._id,
                category: post.category,
                status: post.status || 'submitted',
                statusMessage: post.statusMessage || 'Your report has been received.',
                description,
                location: post.location,
                mediaUrls: post.mediaUrls,
                contentType: post.contentType,
                submittedAt: post.createdAt,
                lastUpdated: post.updatedAt
            }
        });
    } catch (error) {
        console.error('checkPostStatus error:', error);
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
