import express from 'express';
import mongoose from 'mongoose';
import Post from '../models/Post.js';
import { adminAuth } from '../middleware/adminAuth.js';
import { decrypt } from '../utils/encryption.js';
import { statusUpdateValidation, handleValidationErrors } from '../middleware/sanitizer.js';

const router = express.Router();

// All admin routes require authentication
router.use(adminAuth);

/**
 * GET /api/admin/reports
 * List all posts with filters (Admin View)
 */
router.get('/reports', async (req, res) => {
    try {
        const {
            category,
            status,
            initialThreatLevel,
            spamFlag,
            minThreatScore,
            maxThreatScore,
            city,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            page = 1,
            limit = 20
        } = req.query;

        // Build filter query
        const filter = {};

        if (category) filter.category = category;
        if (status) filter.status = status;
        if (initialThreatLevel) filter.initialThreatLevel = initialThreatLevel;
        if (spamFlag !== undefined) filter['moderation.flagged'] = spamFlag === 'true';
        if (city) filter['location.city'] = new RegExp(city, 'i');

        // Threat score range
        if (minThreatScore || maxThreatScore) {
            filter.threatScore = {};
            if (minThreatScore) filter.threatScore.$gte = parseInt(minThreatScore);
            if (maxThreatScore) filter.threatScore.$lte = parseInt(maxThreatScore);
        }

        // Sorting
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [posts, total] = await Promise.all([
            Post.find(filter)
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit)),
            Post.countDocuments(filter)
        ]);

        // Transform posts to match expected Admin UI format
        const reports = posts.map(post => ({
            reportId: post.postId || post._id,
            category: post.category,
            crimeType: post.category,
            description: (() => {
                try {
                    return decrypt(post.description) || post.description;
                } catch (e) {
                    return post.description;
                }
            })(),
            location: post.location || { city: post.city },
            status: post.status || 'submitted',
            threatLevel: post.initialThreatLevel || 'concerning',
            urgencyScore: post.severityScore,
            confidenceScore: post.evidenceScore || 0,
            createdAt: post.createdAt,
            spamFlag: post.moderation?.flagged || false,
            evidenceUrls: post.mediaUrls || []
        }));

        res.json({
            success: true,
            data: {
                reports,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });

    } catch (error) {
        console.error('Admin list reports error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch reports'
        });
    }
});

/**
 * GET /api/admin/reports/stats
 * Get post statistics
 */
router.get('/reports/stats', async (req, res) => {
    try {
        const [
            totalReports,
            byStatus,
            byCategory,
            spamCount,
            avgConfidence,
            avgUrgency
        ] = await Promise.all([
            Post.countDocuments(),
            Post.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),
            Post.aggregate([
                { $group: { _id: '$category', count: { $sum: 1 } } }
            ]),
            Post.countDocuments({ 'moderation.flagged': true }),
            Post.aggregate([
                { $group: { _id: null, avg: { $avg: '$evidenceScore' } } }
            ]),
            Post.aggregate([
                { $group: { _id: null, avg: { $avg: '$severityScore' } } }
            ])
        ]);

        res.json({
            success: true,
            data: {
                totalReports,
                byStatus: byStatus.reduce((acc, item) => ({ ...acc, [item._id || 'unknown']: item.count }), {}),
                byCategory: byCategory.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
                byAuthority: {},
                spamCount,
                avgConfidence: avgConfidence[0]?.avg || 0,
                avgUrgency: avgUrgency[0]?.avg || 0
            }
        });

    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch statistics'
        });
    }
});

/**
 * GET /api/admin/reports/:id
 * Get single report details
 */
router.get('/reports/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const post = await Post.findById(id) || await Post.findOne({ postId: id });

        if (!post) {
            return res.status(404).json({
                success: false,
                error: 'Report not found'
            });
        }

        const reportObj = {
            reportId: post.postId || post._id,
            category: post.category,
            crimeType: post.category,
            description: (() => {
                try {
                    return decrypt(post.description) || post.description;
                } catch (e) {
                    return post.description;
                }
            })(),
            location: post.location || { city: post.city },
            status: post.status || 'submitted',
            statusMessage: post.statusMessage,
            threatLevel: post.initialThreatLevel || 'concerning',
            urgencyScore: post.severityScore,
            confidenceScore: post.evidenceScore || 0,
            createdAt: post.createdAt,
            spamFlag: post.moderation?.flagged || false,
            evidenceUrls: post.mediaUrls || [],
            votes: post.votes
        };

        res.json({
            success: true,
            data: reportObj
        });

    } catch (error) {
        console.error('Admin get report error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch report'
        });
    }
});

/**
 * PATCH /api/admin/reports/:id/status
 * Update report status and message
 */
router.patch('/reports/:id/status',
    statusUpdateValidation,
    handleValidationErrors,
    async (req, res) => {
        try {
            const { id } = req.params;
            const { status, statusMessage } = req.body;

            const updateFields = { status };
            if (statusMessage !== undefined) updateFields.statusMessage = statusMessage;

            const post = await Post.findOneAndUpdate(
                { $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { postId: id }] },
                updateFields,
                { new: true }
            );

            if (!post) {
                return res.status(404).json({
                    success: false,
                    error: 'Report not found'
                });
            }

            res.json({
                success: true,
                message: 'Report status updated',
                data: {
                    reportId: post.postId || post._id,
                    status: post.status,
                    statusMessage: post.statusMessage
                }
            });

        } catch (error) {
            console.error('Admin update status error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update report status'
            });
        }
    }
);

export default router;
