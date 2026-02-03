import rateLimit from 'express-rate-limit';

/**
 * Rate limiting middleware to prevent misuse
 * - 5 report submissions per hour per session
 * - 20 status checks per hour per session
 */

// Rate limiter for report submissions
export const reportSubmitLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 5, // Max 5 submissions per hour
    message: {
        success: false,
        error: 'Too many reports submitted. Please try again later.',
        retryAfter: '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Use session-based identification (no IP logging)
    keyGenerator: (req) => {
        // Use a combination of user-agent and a random session marker
        return req.headers['x-session-id'] || req.sessionID || 'anonymous';
    }
});

// Rate limiter for status checks
export const statusCheckLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 20, // Max 20 status checks per hour
    message: {
        success: false,
        error: 'Too many status checks. Please try again later.',
        retryAfter: '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.headers['x-session-id'] || req.sessionID || 'anonymous';
    }
});

// Rate limiter for file uploads
export const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 10, // Max 10 uploads per hour
    message: {
        success: false,
        error: 'Too many file uploads. Please try again later.',
        retryAfter: '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.headers['x-session-id'] || req.sessionID || 'anonymous';
    }
});

// General API rate limiter
export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
    message: {
        success: false,
        error: 'Too many requests. Please slow down.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false
});
