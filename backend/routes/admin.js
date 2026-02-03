import express from 'express';
import Report from '../models/Report.js';
import { decrypt } from '../utils/encryption.js';
import { adminAuth } from '../middleware/adminAuth.js';
import { statusUpdateValidation, handleValidationErrors } from '../middleware/sanitizer.js';

const router = express.Router();

// All admin routes require authentication
router.use(adminAuth);

/**
 * GET /api/admin/reports
 * List all reports with filters
 */
router.get('/reports', async (req, res) => {
    try {
        const {
            category,
            crimeType,
            status,
            threatLevel,
            assignedAuthority,
            spamFlag,
            minConfidence,
            maxConfidence,
            minUrgency,
            maxUrgency,
            city,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            page = 1,
            limit = 20
        } = req.query;

        // Build filter query
        const filter = {};

        if (category) filter.category = category;
        if (crimeType) filter.crimeType = crimeType;
        if (status) filter.status = status;
        if (threatLevel) filter.threatLevel = threatLevel;
        if (assignedAuthority) filter.assignedAuthority = assignedAuthority;
        if (spamFlag !== undefined) filter.spamFlag = spamFlag === 'true';
        if (city) filter['location.city'] = new RegExp(city, 'i');

        // Confidence score range
        if (minConfidence || maxConfidence) {
            filter.confidenceScore = {};
            if (minConfidence) filter.confidenceScore.$gte = parseInt(minConfidence);
            if (maxConfidence) filter.confidenceScore.$lte = parseInt(maxConfidence);
        }

        // Urgency score range
        if (minUrgency || maxUrgency) {
            filter.urgencyScore = {};
            if (minUrgency) filter.urgencyScore.$gte = parseInt(minUrgency);
            if (maxUrgency) filter.urgencyScore.$lte = parseInt(maxUrgency);
        }

        // Sorting
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [reports, total] = await Promise.all([
            Report.find(filter)
                .select('-hashedToken -description') // Don't expose token hash or encrypted description in list
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit)),
            Report.countDocuments(filter)
        ]);

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
 * Get report statistics
 */
router.get('/reports/stats', async (req, res) => {
    try {
        const [
            totalReports,
            byStatus,
            byCategory,
            byAuthority,
            spamCount,
            avgConfidence,
            avgUrgency
        ] = await Promise.all([
            Report.countDocuments(),
            Report.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),
            Report.aggregate([
                { $group: { _id: '$category', count: { $sum: 1 } } }
            ]),
            Report.aggregate([
                { $group: { _id: '$assignedAuthority', count: { $sum: 1 } } }
            ]),
            Report.countDocuments({ spamFlag: true }),
            Report.aggregate([
                { $group: { _id: null, avg: { $avg: '$confidenceScore' } } }
            ]),
            Report.aggregate([
                { $group: { _id: null, avg: { $avg: '$urgencyScore' } } }
            ])
        ]);

        res.json({
            success: true,
            data: {
                totalReports,
                byStatus: byStatus.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
                byCategory: byCategory.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
                byAuthority: byAuthority.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
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
 * Get single report details (with decrypted description)
 */
router.get('/reports/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const report = await Report.findOne({ reportId: id }).select('-hashedToken');

        if (!report) {
            return res.status(404).json({
                success: false,
                error: 'Report not found'
            });
        }

        // Decrypt description for admin viewing
        const reportObj = report.toObject();
        reportObj.description = decrypt(report.description);

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
            const { status, statusMessage, adminNotes } = req.body;

            const updateFields = { status };
            if (statusMessage !== undefined) updateFields.statusMessage = statusMessage;
            if (adminNotes !== undefined) updateFields.adminNotes = adminNotes;

            const report = await Report.findOneAndUpdate(
                { reportId: id },
                updateFields,
                { new: true }
            ).select('-hashedToken -description');

            if (!report) {
                return res.status(404).json({
                    success: false,
                    error: 'Report not found'
                });
            }

            res.json({
                success: true,
                message: 'Report status updated',
                data: report
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
