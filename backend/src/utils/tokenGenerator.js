import crypto from 'crypto';

/**
 * Generate a secure random token for anonymous report tracking
 * Token is returned to user, hash is stored in database
 * @returns {string} 16-character alphanumeric token
 */
export const generateToken = () => {
    // Generate 12 random bytes and convert to base64
    // Then clean up to get alphanumeric only
    const randomBytes = crypto.randomBytes(12);
    const token = randomBytes
        .toString('base64')
        .replace(/[^a-zA-Z0-9]/g, '')
        .substring(0, 16)
        .toUpperCase();

    return token;
};

/**
 * Generate a unique report ID
 * @returns {string} UUID-style report ID
 */
export const generateReportId = () => {
    return crypto.randomUUID();
};
