import { body, param, validationResult } from 'express-validator';

/**
 * Input sanitization and validation middleware
 * Protects against XSS and ensures data quality
 */

// Validation rules for report submission
export const reportValidation = [
    body('category')
        .trim()
        .isIn(['theft', 'harassment', 'cyber_fraud', 'stalking', 'assault', 'corruption', 'other'])
        .withMessage('Invalid crime category'),

    body('crimeType')
        .trim()
        .isIn(['physical', 'cyber'])
        .withMessage('Crime type must be "physical" or "cyber"'),

    body('description')
        .trim()
        .isLength({ min: 50, max: 1000 })
        .withMessage('Description must be between 50 and 1000 characters')
        .escape(), // XSS protection

    body('location.area')
        .trim()
        .notEmpty()
        .withMessage('Location area is required')
        .isLength({ max: 200 })
        .escape(),

    body('location.city')
        .trim()
        .notEmpty()
        .withMessage('City is required')
        .isLength({ max: 100 })
        .escape(),

    body('location.coordinates.lat')
        .optional()
        .isFloat({ min: -90, max: 90 })
        .withMessage('Invalid latitude'),

    body('location.coordinates.lng')
        .optional()
        .isFloat({ min: -180, max: 180 })
        .withMessage('Invalid longitude'),

    body('threatLevel')
        .trim()
        .isIn(['low', 'medium', 'high', 'emergency'])
        .withMessage('Invalid threat level'),

    body('incidentTime.date')
        .optional()
        .isISO8601()
        .withMessage('Invalid date format'),

    body('evidenceUrls')
        .optional()
        .isArray()
        .withMessage('Evidence URLs must be an array'),

    body('evidenceUrls.*')
        .optional()
        .isString()
        .trim()
];

// Validation rules for token parameter
export const tokenValidation = [
    param('token')
        .trim()
        .isLength({ min: 16, max: 16 })
        .withMessage('Invalid token format')
        .isAlphanumeric()
        .withMessage('Token must be alphanumeric')
];

// Validation rules for admin status update
export const statusUpdateValidation = [
    body('status')
        .trim()
        .isIn(['submitted', 'under_review', 'forwarded', 'closed'])
        .withMessage('Invalid status'),

    body('statusMessage')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Status message too long')
        .escape(),

    body('adminNotes')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .escape()
];

// Middleware to handle validation errors
export const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
};

// Sanitize all string inputs in request body
export const sanitizeInputs = (req, res, next) => {
    const sanitize = (obj) => {
        if (typeof obj === 'string') {
            // Remove potentially dangerous characters
            return obj.replace(/<[^>]*>/g, '').trim();
        }
        if (Array.isArray(obj)) {
            return obj.map(sanitize);
        }
        if (obj && typeof obj === 'object') {
            const sanitized = {};
            for (const key in obj) {
                sanitized[key] = sanitize(obj[key]);
            }
            return sanitized;
        }
        return obj;
    };

    if (req.body) {
        req.body = sanitize(req.body);
    }
    next();
};
