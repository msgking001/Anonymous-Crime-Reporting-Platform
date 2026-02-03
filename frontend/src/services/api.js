import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Generate/Get session ID for rate limiting and voting
const getSessionId = () => {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
        sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
};

// Add session ID to every request
api.interceptors.request.use((config) => {
    config.headers['x-session-id'] = getSessionId();
    return config;
});

// --- Feed & Posts API ---

/**
 * Get paginated posts feed
 * @param {number} page 
 * @param {object} filters { category, city }
 */
export const getPosts = async (page = 1, filters = {}) => {
    const params = new URLSearchParams({ page, limit: 10 });
    if (filters.category) params.append('category', filters.category);
    if (filters.city) params.append('city', filters.city);

    const response = await api.get(`/posts?${params.toString()}`);
    return response.data;
};

/**
 * Create a new post
 * @param {FormData} postData 
 */
export const createPost = async (postData) => {
    const response = await api.post('/posts', postData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

/**
 * Submit a threat vote
 * @param {string} postId 
 * @param {string} voteType 'low_risk' | 'concerning' | 'urgent' | 'critical'
 */
export const submitVote = async (postId, voteType) => {
    const response = await api.post(`/posts/${postId}/vote`, { voteType });
    return response.data;
};

/**
 * Check if user has voted on a post
 * @param {string} postId 
 */
export const checkVoteStatus = async (postId) => {
    const response = await api.get(`/posts/${postId}/vote`);
    return response.data;
};

// --- Legacy Reports & Admin API (Restored) ---

/**
 * Check report status by token (Legacy)
 * @param {string} token 
 */
export const checkReportStatus = async (token) => {
    const response = await api.get(`/reports/status/${token}`);
    return response.data;
};

/**
 * Admin: Get reports list
 */
export const getAdminReports = async (filters, adminKey) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
    });

    const response = await api.get(`/admin/reports?${params.toString()}`, {
        headers: { 'x-admin-key': adminKey }
    });
    return response.data;
};

/**
 * Admin: Get report details
 */
export const getAdminReportDetails = async (reportId, adminKey) => {
    const response = await api.get(`/admin/reports/${reportId}`, {
        headers: { 'x-admin-key': adminKey }
    });
    return response.data;
};

/**
 * Admin: Update report status
 */
export const updateReportStatus = async (reportId, data, adminKey) => {
    const response = await api.patch(`/admin/reports/${reportId}/status`, data, {
        headers: { 'x-admin-key': adminKey }
    });
    return response.data;
};

/**
 * Admin: Get stats
 */
export const getAdminStats = async (adminKey) => {
    const response = await api.get('/admin/reports/stats', {
        headers: { 'x-admin-key': adminKey }
    });
    return response.data;
};

export default api;
