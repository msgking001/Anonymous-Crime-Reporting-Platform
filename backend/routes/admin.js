import express from 'express';
import Post from '../models/Post.js'; // Switched to Post model
import { adminAuth } from '../middleware/adminAuth.js';
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
        if (spamFlag !== undefined) filter['moderation.flagged'] = spamFlag === 'true'; // Mapped to moderation.flagged
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

        // Transform posts to match expected Admin UI format where necessary
        const reports = posts.map(post => ({
            reportId: post.postId,
            category: post.category,
            crimeType: post.category, // reuse category as type
            description: post.description,
            location: post.location,
            status: post.status,
            threatLevel: post.initialThreatLevel, // Use initial or computed? Using initial for display
            urgencyScore: post.threatScore, // Map threatScore to urgencyScore
            confidenceScore: post.evidenceScore, // Map evidenceScore to confidenceScore
            createdAt: post.createdAt,
            spamFlag: post.moderation.flagged,
            evidenceUrls: post.mediaUrl ? [post.mediaUrl] : []
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
                { $group: { _id: null, avg: { $avg: '$threatScore' } } }
            ])
        ]);

        res.json({
            success: true,
            data: {
                totalReports,
                byStatus: byStatus.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
                byCategory: byCategory.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
                byAuthority: {}, // Not currently used in Post model
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

        const post = await Post.findOne({ postId: id });

        if (!post) {
            return res.status(404).json({
                success: false,
                error: 'Report not found'
            });
        }

        // Map to expected format
        const reportObj = {
            reportId: post.postId,
            category: post.category,
            crimeType: post.category,
            description: post.description,
            location: post.location,
            status: post.status,
            statusMessage: post.statusMessage,
            threatLevel: post.initialThreatLevel,
            urgencyScore: post.threatScore,
            confidenceScore: post.evidenceScore,
            createdAt: post.createdAt,
            spamFlag: post.moderation.flagged,
            evidenceUrls: post.mediaUrl ? [post.mediaUrl] : [],
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
                { postId: id },
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
                    reportId: post.postId,
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
