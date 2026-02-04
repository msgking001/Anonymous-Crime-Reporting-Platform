import axios from "axios";

/**
 * BASE URL
 * MUST exist in Vercel Environment Variables
 * Example:
 * VITE_API_URL = https://your-backend.onrender.com
 */
const API_BASE_URL = import.meta.env.VITE_API_URL;

if (!API_BASE_URL) {
    throw new Error("VITE_API_URL is not defined. Check Vercel env vars.");
}

// Axios instance
const api = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    headers: {
        "Content-Type": "application/json",
    },
});

// ---------------- SESSION ID (RATE LIMIT / VOTE CONTROL) ----------------

const getSessionId = () => {
    let sessionId = sessionStorage.getItem("sessionId");
    if (!sessionId) {
        sessionId =
            crypto.randomUUID?.() ||
            Math.random().toString(36).substring(2) +
            Math.random().toString(36).substring(2);
        sessionStorage.setItem("sessionId", sessionId);
    }
    return sessionId;
};

api.interceptors.request.use((config) => {
    config.headers["x-session-id"] = getSessionId();
    return config;
});

// ---------------- PUBLIC FEED (REPORTS) ----------------

/**
 * Get paginated reports feed
 * @param {number} page
 * @param {object} filters { category, city }
 */
export const getPosts = async (page = 1, filters = {}) => {
    const params = new URLSearchParams({
        page,
        limit: 10,
    });

    if (filters.category) params.append("category", filters.category);
    if (filters.city) params.append("city", filters.city);

    const response = await api.get(`/posts?${params.toString()}`);
    return response.data;
};

/**
 * Create a new anonymous report
 * @param {FormData} postData
 */
export const createPost = async (postData) => {
    const response = await api.post(`/report/create`, postData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return response.data;
};

// ---------------- VOTING ----------------

/**
 * Submit a threat vote
 * @param {string} reportId
 * @param {string} voteType
 */
export const submitVote = async (reportId, voteType) => {
    const response = await api.post(`/posts/${reportId}/vote`, {
        voteType,
    });
    return response.data;
};

/**
 * Check if user has voted
 * @param {string} reportId
 */
export const checkVoteStatus = async (reportId) => {
    const response = await api.get(`/posts/${reportId}/vote`);
    return response.data;
};

// ---------------- LEGACY STATUS CHECK ----------------

/**
 * Check report status by token
 * @param {string} token
 */
export const checkReportStatus = async (token) => {
    const response = await api.get(`/reports/status/${token}`);
    return response.data;
};

// ---------------- ADMIN ----------------

export const getAdminReports = async (filters = {}, adminKey) => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
    });

    const response = await api.get(`/admin/reports?${params.toString()}`, {
        headers: { "x-admin-key": adminKey },
    });

    return response.data;
};

export const getAdminReportDetails = async (reportId, adminKey) => {
    const response = await api.get(`/admin/reports/${reportId}`, {
        headers: { "x-admin-key": adminKey },
    });
    return response.data;
};

export const updateReportStatus = async (reportId, data, adminKey) => {
    const response = await api.patch(
        `/admin/reports/${reportId}/status`,
        data,
        {
            headers: { "x-admin-key": adminKey },
        }
    );
    return response.data;
};

export const getAdminStats = async (adminKey) => {
    const response = await api.get(`/admin/reports/stats`, {
        headers: { "x-admin-key": adminKey },
    });
    return response.data;
};

export default api;
