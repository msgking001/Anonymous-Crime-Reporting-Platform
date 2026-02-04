import rateLimit from 'express-rate-limit';

export const postCreationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // limit each IP/Session to 3 posts per hour
    message: {
        error: 'Too many posts created from this session, please try again after an hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.headers['x-session-id'] || req.ip;
    }
});

export const voteLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // limit each IP/Session to 30 votes per 15 minutes
    message: {
        error: 'Too many votes submitted, please slow down'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.headers['x-session-id'] || req.ip;
    }
});
