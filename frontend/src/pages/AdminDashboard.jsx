import { useState, useEffect } from 'react';
import { getAdminReports, getAdminReportDetails, updateReportStatus, getAdminStats } from '../services/api';

// Status badge component
const StatusBadge = ({ status }) => {
    const config = {
        submitted: { bg: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' },
        under_review: { bg: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' },
        forwarded: { bg: 'rgba(139, 92, 246, 0.2)', color: '#8b5cf6' },
        closed: { bg: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }
    };
    const { bg, color } = config[status] || config.submitted;

    return (
        <span className="badge" style={{ background: bg, color }}>
            {status.replace('_', ' ')}
        </span>
    );
};

function AdminDashboard() {
    const [adminKey, setAdminKey] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authError, setAuthError] = useState('');

    const [reports, setReports] = useState([]);
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [filters, setFilters] = useState({
        category: '',
        status: '',
        assignedAuthority: '',
        sortBy: 'createdAt',
        sortOrder: 'desc',
        page: 1,
        limit: 20
    });
    const [pagination, setPagination] = useState(null);

    // Modal states
    const [selectedReport, setSelectedReport] = useState(null);
    const [isDetailLoading, setIsDetailLoading] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [updateData, setUpdateData] = useState({ status: '', statusMessage: '' });
    const [isUpdating, setIsUpdating] = useState(false);

    // Handle admin login
    const handleLogin = async (e) => {
        e.preventDefault();
        setAuthError('');

        try {
            // Test the key by fetching reports
            const result = await getAdminReports({ limit: 1 }, adminKey);
            if (result.success) {
                setIsAuthenticated(true);
                sessionStorage.setItem('adminKey', adminKey);
                loadReports();
                loadStats();
            }
        } catch (err) {
            setAuthError(err.response?.data?.error || 'Invalid admin key');
        }
    };

    // Check for stored key on mount
    useEffect(() => {
        const storedKey = sessionStorage.getItem('adminKey');
        if (storedKey) {
            setAdminKey(storedKey);
            setIsAuthenticated(true);
        }
    }, []);

    // Load reports when authenticated or filters change
    useEffect(() => {
        if (isAuthenticated) {
            loadReports();
        }
    }, [isAuthenticated, filters]);

    // Load reports
    const loadReports = async () => {
        setIsLoading(true);
        setError('');

        try {
            const result = await getAdminReports(filters, adminKey);
            if (result.success) {
                setReports(result.data.reports);
                setPagination(result.data.pagination);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load reports');
            if (err.response?.status === 401 || err.response?.status === 403) {
                handleLogout();
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Load stats
    const loadStats = async () => {
        try {
            const result = await getAdminStats(adminKey);
            if (result.success) {
                setStats(result.data);
            }
        } catch (err) {
            console.error('Failed to load stats:', err);
        }
    };

    // View report details
    const viewReportDetails = async (reportId) => {
        setIsDetailLoading(true);

        try {
            const result = await getAdminReportDetails(reportId, adminKey);
            if (result.success) {
                setSelectedReport(result.data);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load report details');
        } finally {
            setIsDetailLoading(false);
        }
    };

    // Open update modal
    const openUpdateModal = (report) => {
        setUpdateData({
            status: report.status,
            statusMessage: report.statusMessage || ''
        });
        setShowUpdateModal(true);
    };

    // Handle status update
    const handleStatusUpdate = async () => {
        if (!selectedReport) return;

        setIsUpdating(true);

        try {
            const result = await updateReportStatus(selectedReport.reportId, updateData, adminKey);
            if (result.success) {
                setShowUpdateModal(false);
                setSelectedReport({ ...selectedReport, ...updateData });
                loadReports();
                loadStats();
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update report');
        } finally {
            setIsUpdating(false);
        }
    };

    // Handle logout
    const handleLogout = () => {
        setIsAuthenticated(false);
        setAdminKey('');
        sessionStorage.removeItem('adminKey');
        setReports([]);
        setStats(null);
    };

    // Handle filter change
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    };

    // Login form
    if (!isAuthenticated) {
        return (
            <div className="container container-sm">
                <div className="page-header" style={{ marginTop: '3rem' }}>
                    <h1>Admin Dashboard</h1>
                    <p>Enter your admin key to access the dashboard.</p>
                </div>

                <div className="card">
                    <form onSubmit={handleLogin}>
                        <div className="form-group">
                            <label>Admin Key</label>
                            <input
                                type="password"
                                value={adminKey}
                                onChange={(e) => setAdminKey(e.target.value)}
                                placeholder="Enter admin key"
                            />
                        </div>

                        {authError && (
                            <div className="alert alert-danger">
                                <svg className="alert-icon" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="15" y1="9" x2="9" y2="15" />
                                    <line x1="9" y1="9" x2="15" y2="15" />
                                </svg>
                                <div>{authError}</div>
                            </div>
                        )}

                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                            Login
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="container" style={{ maxWidth: '1400px' }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem',
                marginTop: '1.5rem'
            }}>
                <h1 style={{ marginBottom: 0 }}>Admin Dashboard</h1>
                <button className="btn btn-secondary" onClick={handleLogout}>
                    Logout
                </button>
            </div>

            {/* Stats */}
            {stats && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '1rem',
                    marginBottom: '2rem'
                }}>
                    <div className="card" style={{ textAlign: 'center' }}>
                        <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Total Reports</p>
                        <p style={{ margin: '0.5rem 0 0', fontSize: '2rem', fontWeight: 600 }}>{stats.totalReports}</p>
                    </div>
                    <div className="card" style={{ textAlign: 'center' }}>
                        <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Submitted</p>
                        <p style={{ margin: '0.5rem 0 0', fontSize: '2rem', fontWeight: 600, color: '#3b82f6' }}>
                            {stats.byStatus?.submitted || 0}
                        </p>
                    </div>
                    <div className="card" style={{ textAlign: 'center' }}>
                        <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Under Review</p>
                        <p style={{ margin: '0.5rem 0 0', fontSize: '2rem', fontWeight: 600, color: '#f59e0b' }}>
                            {stats.byStatus?.under_review || 0}
                        </p>
                    </div>
                    <div className="card" style={{ textAlign: 'center' }}>
                        <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Avg Urgency</p>
                        <p style={{ margin: '0.5rem 0 0', fontSize: '2rem', fontWeight: 600 }}>
                            {Math.round(stats.avgUrgency)}
                        </p>
                    </div>
                    <div className="card" style={{ textAlign: 'center' }}>
                        <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Spam Flagged</p>
                        <p style={{ margin: '0.5rem 0 0', fontSize: '2rem', fontWeight: 600, color: '#ef4444' }}>
                            {stats.spamCount}
                        </p>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="filters">
                <div className="filter-group">
                    <label>Category</label>
                    <select
                        value={filters.category}
                        onChange={(e) => handleFilterChange('category', e.target.value)}
                    >
                        <option value="">All Categories</option>
                        <option value="theft">Theft</option>
                        <option value="harassment">Harassment</option>
                        <option value="cyber_fraud">Cyber Fraud</option>
                        <option value="stalking">Stalking</option>
                        <option value="assault">Assault</option>
                        <option value="corruption">Corruption</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div className="filter-group">
                    <label>Status</label>
                    <select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        <option value="submitted">Submitted</option>
                        <option value="under_review">Under Review</option>
                        <option value="forwarded">Forwarded</option>
                        <option value="closed">Closed</option>
                    </select>
                </div>
                <div className="filter-group">
                    <label>Authority</label>
                    <select
                        value={filters.assignedAuthority}
                        onChange={(e) => handleFilterChange('assignedAuthority', e.target.value)}
                    >
                        <option value="">All</option>
                        <option value="local_police">Local Police</option>
                        <option value="cybercrime_unit">Cybercrime Unit</option>
                    </select>
                </div>
                <div className="filter-group">
                    <label>Sort By</label>
                    <select
                        value={filters.sortBy}
                        onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    >
                        <option value="createdAt">Date</option>
                        <option value="urgencyScore">Urgency</option>
                        <option value="confidenceScore">Confidence</option>
                    </select>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="alert alert-danger">
                    <svg className="alert-icon" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    <div>{error}</div>
                </div>
            )}

            {/* Reports Table */}
            {isLoading ? (
                <div className="loader-container">
                    <div className="loader" />
                    <p>Loading reports...</p>
                </div>
            ) : (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Category</th>
                                <th>Type</th>
                                <th>Location</th>
                                <th>Threat</th>
                                <th>Urgency</th>
                                <th>Confidence</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reports.length === 0 ? (
                                <tr>
                                    <td colSpan="9" style={{ textAlign: 'center', padding: '2rem' }}>
                                        No reports found
                                    </td>
                                </tr>
                            ) : (
                                reports.map(report => (
                                    <tr key={report.reportId}>
                                        <td>{new Date(report.createdAt).toLocaleDateString()}</td>
                                        <td style={{ textTransform: 'capitalize' }}>{report.category.replace('_', ' ')}</td>
                                        <td style={{ textTransform: 'capitalize' }}>{report.crimeType}</td>
                                        <td>{report.location?.city}</td>
                                        <td>
                                            <span className={`badge badge-${report.threatLevel === 'emergency' || report.threatLevel === 'high' ? 'danger' :
                                                    report.threatLevel === 'medium' ? 'warning' : 'success'
                                                }`}>
                                                {report.threatLevel}
                                            </span>
                                        </td>
                                        <td>{report.urgencyScore}</td>
                                        <td>{report.confidenceScore}</td>
                                        <td><StatusBadge status={report.status} /></td>
                                        <td>
                                            <button
                                                className="btn btn-secondary"
                                                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                                                onClick={() => viewReportDetails(report.reportId)}
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    marginTop: '1.5rem'
                }}>
                    <button
                        className="btn btn-secondary"
                        disabled={pagination.page === 1}
                        onClick={() => handleFilterChange('page', pagination.page - 1)}
                    >
                        Previous
                    </button>
                    <span style={{
                        padding: '0.5rem 1rem',
                        display: 'flex',
                        alignItems: 'center'
                    }}>
                        Page {pagination.page} of {pagination.pages}
                    </span>
                    <button
                        className="btn btn-secondary"
                        disabled={pagination.page === pagination.pages}
                        onClick={() => handleFilterChange('page', pagination.page + 1)}
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Report Detail Modal */}
            {selectedReport && (
                <div className="modal-overlay" onClick={() => setSelectedReport(null)}>
                    <div className="modal" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 style={{ margin: 0 }}>Report Details</h3>
                            <button
                                style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '1.5rem' }}
                                onClick={() => setSelectedReport(null)}
                            >
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            {isDetailLoading ? (
                                <div className="loader-container">
                                    <div className="loader" />
                                </div>
                            ) : (
                                <>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(2, 1fr)',
                                        gap: '1rem',
                                        marginBottom: '1.5rem'
                                    }}>
                                        <div>
                                            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Report ID</p>
                                            <p style={{ margin: '0.25rem 0 0', fontFamily: 'monospace' }}>{selectedReport.reportId}</p>
                                        </div>
                                        <div>
                                            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Status</p>
                                            <StatusBadge status={selectedReport.status} />
                                        </div>
                                        <div>
                                            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Category</p>
                                            <p style={{ margin: '0.25rem 0 0', textTransform: 'capitalize' }}>{selectedReport.category.replace('_', ' ')}</p>
                                        </div>
                                        <div>
                                            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Crime Type</p>
                                            <p style={{ margin: '0.25rem 0 0', textTransform: 'capitalize' }}>{selectedReport.crimeType}</p>
                                        </div>
                                        <div>
                                            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Location</p>
                                            <p style={{ margin: '0.25rem 0 0' }}>{selectedReport.location?.area}, {selectedReport.location?.city}</p>
                                        </div>
                                        <div>
                                            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Threat Level</p>
                                            <span className={`badge badge-${selectedReport.threatLevel === 'emergency' || selectedReport.threatLevel === 'high' ? 'danger' :
                                                    selectedReport.threatLevel === 'medium' ? 'warning' : 'success'
                                                }`}>
                                                {selectedReport.threatLevel}
                                            </span>
                                        </div>
                                        <div>
                                            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Urgency Score</p>
                                            <p style={{ margin: '0.25rem 0 0', fontWeight: 600 }}>{selectedReport.urgencyScore}/100</p>
                                        </div>
                                        <div>
                                            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Confidence Score</p>
                                            <p style={{ margin: '0.25rem 0 0', fontWeight: 600 }}>{selectedReport.confidenceScore}/100</p>
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Description</p>
                                        <div style={{
                                            marginTop: '0.5rem',
                                            padding: '1rem',
                                            background: 'var(--color-bg-elevated)',
                                            borderRadius: 'var(--radius-md)',
                                            whiteSpace: 'pre-wrap'
                                        }}>
                                            {selectedReport.description}
                                        </div>
                                    </div>

                                    {selectedReport.evidenceUrls && selectedReport.evidenceUrls.length > 0 && (
                                        <div style={{ marginBottom: '1.5rem' }}>
                                            <p style={{ margin: '0 0 0.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                                                Evidence Files ({selectedReport.evidenceUrls.length})
                                            </p>
                                            {selectedReport.evidenceUrls.map((url, i) => (
                                                <span key={i} className="badge badge-neutral" style={{ marginRight: '0.5rem' }}>
                                                    {url.split('/').pop()}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {selectedReport.spamFlag && (
                                        <div className="alert alert-warning">
                                            <svg className="alert-icon" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                                                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                                                <line x1="12" y1="9" x2="12" y2="13" />
                                                <line x1="12" y1="17" x2="12.01" y2="17" />
                                            </svg>
                                            <div>This report has been flagged as potential spam or low quality.</div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setSelectedReport(null)}>
                                Close
                            </button>
                            <button className="btn btn-primary" onClick={() => openUpdateModal(selectedReport)}>
                                Update Status
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Update Status Modal */}
            {showUpdateModal && (
                <div className="modal-overlay" onClick={() => setShowUpdateModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 style={{ margin: 0 }}>Update Status</h3>
                            <button
                                style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '1.5rem' }}
                                onClick={() => setShowUpdateModal(false)}
                            >
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Status</label>
                                <select
                                    value={updateData.status}
                                    onChange={(e) => setUpdateData(prev => ({ ...prev, status: e.target.value }))}
                                >
                                    <option value="submitted">Submitted</option>
                                    <option value="under_review">Under Review</option>
                                    <option value="forwarded">Forwarded</option>
                                    <option value="closed">Closed</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Message to Reporter</label>
                                <textarea
                                    value={updateData.statusMessage}
                                    onChange={(e) => setUpdateData(prev => ({ ...prev, statusMessage: e.target.value }))}
                                    placeholder="This message will be visible when the reporter checks their status"
                                    rows={3}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowUpdateModal(false)}>
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleStatusUpdate}
                                disabled={isUpdating}
                            >
                                {isUpdating ? 'Updating...' : 'Update'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminDashboard;
