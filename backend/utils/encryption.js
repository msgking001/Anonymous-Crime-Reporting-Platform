import CryptoJS from 'crypto-js';

/**
 * Encryption utilities for sensitive data
 * Uses AES-256 encryption for descriptions
 * SHA256 for token hashing
 */

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-32-char-encryption-key!!';

/**
 * Encrypt sensitive text using AES
 * @param {string} text - Plain text to encrypt
 * @returns {string} Encrypted text
 */
export const encrypt = (text) => {
    if (!text) return '';
    return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
};

/**
 * Decrypt encrypted text using AES
 * @param {string} encryptedText - Encrypted text
 * @returns {string} Decrypted plain text
 */
export const decrypt = (encryptedText) => {
    if (!encryptedText) return '';
    const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
};

/**
 * Hash a token using SHA256
 * Used for storing tokens securely in database
 * @param {string} token - Plain token
 * @returns {string} Hashed token
 */
export const hashToken = (token) => {
    return CryptoJS.SHA256(token).toString();
};

/**
 * Verify a token against a hash
 * @param {string} token - Plain token to verify
 * @param {string} hash - Stored hash
 * @returns {boolean} Whether token matches hash
 */
export const verifyToken = (token, hash) => {
    return hashToken(token) === hash;
};
