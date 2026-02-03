import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Generate session ID for rate limiting (no identity tracking)
const getSessionId = () => {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
        sessionId = Math.random().toString(36).substring(2, 15);
        sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
};

// Add session ID to requests
api.interceptors.request.use((config) => {
    config.headers['x-session-id'] = getSessionId();
    return config;
});

/**
 * Submit a new crime report
 */
export const submitReport = async (reportData) => {
    const response = await api.post('/reports', reportData);
    return response.data;
};

/**
 * Check report status using token
 */
export const checkReportStatus = async (token) => {
    const response = await api.get(`/reports/status/${token}`);
    return response.data;
};

/**
 * Upload evidence files
 */
export const uploadEvidence = async (files) => {
    const formData = new FormData();
    files.forEach(file => {
        formData.append('files', file);
    });

    const response = await api.post('/reports/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
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
 * Admin: Get statistics
 */
export const getAdminStats = async (adminKey) => {
    const response = await api.get('/admin/reports/stats', {
        headers: { 'x-admin-key': adminKey }
    });
    return response.data;
};

/**
 * Admin: Update report status
 */
export const updateReportStatus = async (reportId, updateData, adminKey) => {
    const response = await api.patch(`/admin/reports/${reportId}/status`, updateData, {
        headers: { 'x-admin-key': adminKey }
    });
    return response.data;
};

export default api;
