import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import Report from '../models/Report.js';
import { encrypt, hashToken } from '../utils/encryption.js';
import { generateToken, generateReportId } from '../utils/tokenGenerator.js';
import { analyzeReport } from '../utils/categorizer.js';
import { reportSubmitLimiter, statusCheckLimiter, uploadLimiter } from '../middleware/rateLimiter.js';
import { reportValidation, tokenValidation, handleValidationErrors, sanitizeInputs } from '../middleware/sanitizer.js';

const router = express.Router();

// Configure file upload
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Allow images, videos, and audio
    const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/webm', 'video/quicktime',
        'audio/mpeg', 'audio/wav', 'audio/ogg'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images, videos, and audio files are allowed.'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
    }
});

/**
 * POST /api/reports
 * Submit a new anonymous crime report
 */
router.post('/',
    reportSubmitLimiter,
    sanitizeInputs,
    reportValidation,
    handleValidationErrors,
    async (req, res) => {
        try {
            const {
                category,
                crimeType,
                description,
                location,
                threatLevel,
                incidentTime,
                evidenceUrls
            } = req.body;

            // Analyze the report using NLP categorizer
            const analysis = analyzeReport({
                category,
                crimeType,
                description,
                threatLevel
            });

            // Generate unique identifiers
            const reportId = generateReportId();
            const token = generateToken();
            const hashedTokenValue = hashToken(token);

            // Encrypt sensitive description
            const encryptedDescription = encrypt(description);

            // Create report document
            const report = new Report({
                reportId,
                hashedToken: hashedTokenValue,
                category,
                crimeType,
                description: encryptedDescription,
                location,
                threatLevel,
                incidentTime,
                evidenceUrls: evidenceUrls || [],
                confidenceScore: analysis.confidenceScore,
                urgencyScore: analysis.urgencyScore,
                assignedAuthority: analysis.assignedAuthority,
                spamFlag: analysis.spamFlag,
                status: 'submitted'
            });

            await report.save();

            res.status(201).json({
                success: true,
                message: 'Report submitted successfully',
                data: {
                    token, // Return plain token to user (only time it's visible)
                    reportId,
                    status: 'submitted',
                    assignedAuthority: analysis.assignedAuthority,
                    disclaimer: 'This is not a replacement for an official FIR. For emergencies, please contact local authorities directly.'
                }
            });

        } catch (error) {
            console.error('Report submission error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to submit report. Please try again.'
            });
        }
    }
);

/**
 * GET /api/reports/status/:token
 * Check report status using anonymous token
 */
router.get('/status/:token',
    statusCheckLimiter,
    tokenValidation,
    handleValidationErrors,
    async (req, res) => {
        try {
            const { token } = req.params;
            const hashedTokenValue = hashToken(token);

            const report = await Report.findOne({ hashedToken: hashedTokenValue });

            if (!report) {
                return res.status(404).json({
                    success: false,
                    error: 'Report not found. Please check your token.'
                });
            }

            res.json({
                success: true,
                data: {
                    reportId: report.reportId,
                    category: report.category,
                    status: report.status,
                    statusMessage: report.statusMessage || 'Your report has been received.',
                    assignedAuthority: report.assignedAuthority,
                    submittedAt: report.createdAt,
                    lastUpdated: report.updatedAt
                }
            });

        } catch (error) {
            console.error('Status check error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to check status. Please try again.'
            });
        }
    }
);

/**
 * POST /api/reports/upload
 * Upload evidence files
 */
router.post('/upload',
    uploadLimiter,
    upload.array('files', 5), // Max 5 files
    (req, res) => {
        try {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'No files uploaded'
                });
            }

            const fileUrls = req.files.map(file => `/uploads/${file.filename}`);

            res.json({
                success: true,
                message: `${req.files.length} file(s) uploaded successfully`,
                data: {
                    urls: fileUrls
                }
            });

        } catch (error) {
            console.error('File upload error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to upload files. Please try again.'
            });
        }
    }
);

// Error handler for multer
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'File too large. Maximum size is 10MB.'
            });
        }
        return res.status(400).json({
            success: false,
            error: error.message
        });
    }
    next(error);
});

export default router;
