import rateLimit from 'express-rate-limit';

export const postCreationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        error: 'Too many posts created. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.headers['x-session-id'] || req.ip
});

export const voteLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: {
        success: false,
        error: 'Too many votes. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.headers['x-session-id'] || req.ip
});
