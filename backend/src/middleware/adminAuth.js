/**
 * Admin authentication middleware
 * Uses environment-based key for prototype security
 * In production, this would be replaced with proper auth
 */

const ADMIN_KEY = process.env.ADMIN_KEY || 'admin-secret-key-2024';

export const adminAuth = (req, res, next) => {
    const providedKey = req.headers['x-admin-key'];

    if (!providedKey) {
        return res.status(401).json({
            success: false,
            error: 'Admin authentication required'
        });
    }

    if (providedKey !== ADMIN_KEY) {
        return res.status(403).json({
            success: false,
            error: 'Invalid admin credentials'
        });
    }

    next();
};

export default adminAuth;
