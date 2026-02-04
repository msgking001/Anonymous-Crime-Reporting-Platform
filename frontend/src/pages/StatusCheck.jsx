import { useState } from 'react';
import { checkReportStatus } from '../services/api';

// Status configurations
const STATUS_CONFIG = {
    submitted: {
        icon: '📝',
        label: 'Submitted',
        color: '#3b82f6',
        bg: 'rgba(59, 130, 246, 0.2)',
        description: 'Your report has been received and is waiting to be reviewed.'
    },
    under_review: {
        icon: '🔍',
        label: 'Under Review',
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.2)',
        description: 'Your report is currently being reviewed by the assigned authority.'
    },
    forwarded: {
        icon: '📤',
        label: 'Forwarded',
        color: '#8b5cf6',
        bg: 'rgba(139, 92, 246, 0.2)',
        description: 'Your report has been forwarded to the appropriate unit for action.'
    },
    closed: {
        icon: '✓',
        label: 'Closed',
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.2)',
        description: 'This report has been closed. Thank you for your submission.'
    }
};

function StatusCheck() {
    const [token, setToken] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [reportData, setReportData] = useState(null);

    const handleTokenChange = (e) => {
        // Only allow alphanumeric, max 16 chars
        const value = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 16);
        setToken(value);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (token.length !== 16) {
            setError('Token must be exactly 16 characters');
            return;
        }

        setIsLoading(true);
        setError('');
        setReportData(null);

        try {
            const result = await checkReportStatus(token);

            if (result.success) {
                setReportData(result.data);
            } else {
                setError(result.error || 'Report not found');
            }
        } catch (err) {
            console.error('Status check error:', err);
            setError(err.response?.data?.error || 'Failed to check status. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const statusConfig = reportData ? STATUS_CONFIG[reportData.status] : null;

    return (
        <div className="container container-sm">
            <div className="page-header" style={{ marginTop: '2rem' }}>
                <h1>Check Report Status</h1>
                <p>
                    Enter your anonymous token to check the current status of your report.
                </p>
            </div>

            {/* Token Input Form */}
            <div className="card">
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Your Anonymous Token</label>
                        <input
                            type="text"
                            value={token}
                            onChange={handleTokenChange}
                            placeholder="Enter your 16-character token"
                            style={{
                                textAlign: 'center',
                                fontFamily: 'Monaco, Consolas, monospace',
                                letterSpacing: '2px',
                                fontSize: '1.1rem'
                            }}
                        />
                        <p style={{
                            textAlign: 'center',
                            fontSize: '0.85rem',
                            color: 'var(--color-text-muted)',
                            marginTop: '0.5rem'
                        }}>
                            {token.length}/16 characters
                        </p>
                    </div>

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

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                        disabled={isLoading || token.length !== 16}
                    >
                        {isLoading ? (
                            <>
                                <span className="loader" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
                                Checking...
                            </>
                        ) : (
                            'Check Status'
                        )}
                    </button>
                </form>
            </div>

            {/* Status Display */}
            {reportData && (
                <div className="card fade-in" style={{ marginTop: '1.5rem' }}>
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            margin: '0 auto 1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: statusConfig?.bg || 'rgba(0,0,0,0.1)',
                            borderRadius: '50%',
                            fontSize: '40px'
                        }}>
                            {statusConfig?.icon || '📄'}
                        </div>
                        <span className="badge" style={{
                            background: statusConfig?.bg || 'var(--color-bg-elevated)',
                            color: statusConfig?.color || 'var(--color-text)',
                            fontSize: '0.9rem',
                            padding: '0.5rem 1rem'
                        }}>
                            {statusConfig?.label || 'Processing'}
                        </span>
                    </div>

                    <p style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        {statusConfig?.description || 'Loading status details...'}
                    </p>

                    {/* Report Details */}
                    <div style={{
                        background: 'var(--color-bg-elevated)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '1.5rem'
                    }}>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                            gap: '1.5rem'
                        }}>
                            <div>
                                <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                                    Report ID
                                </p>
                                <p style={{ margin: '0.25rem 0 0', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                                    {reportData.reportId.slice(0, 8)}...
                                </p>
                            </div>
                            <div>
                                <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                                    Category
                                </p>
                                <p style={{ margin: '0.25rem 0 0', textTransform: 'capitalize' }}>
                                    {reportData.category.replace('_', ' ')}
                                </p>
                            </div>
                            <div>
                                <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                                    Assigned To
                                </p>
                                <p style={{ margin: '0.25rem 0 0' }}>
                                    {reportData.assignedAuthority === 'cybercrime_unit' ? 'Cybercrime Unit' : 'Local Police'}
                                </p>
                            </div>
                            <div>
                                <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                                    Submitted
                                </p>
                                <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
                                    {new Date(reportData.submittedAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Status Message from Authority */}
                    {reportData.statusMessage && reportData.statusMessage !== 'Your report has been received.' && (
                        <div className="alert alert-info" style={{ marginTop: '1.5rem' }}>
                            <svg className="alert-icon" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                            </svg>
                            <div>
                                <strong>Message from Authority</strong>
                                <p style={{ margin: '0.25rem 0 0' }}>{reportData.statusMessage}</p>
                            </div>
                        </div>
                    )}

                    <p style={{
                        textAlign: 'center',
                        color: 'var(--color-text-muted)',
                        fontSize: '0.85rem',
                        marginTop: '1.5rem',
                        marginBottom: 0
                    }}>
                        Last updated: {new Date(reportData.lastUpdated).toLocaleString()}
                    </p>
                </div>
            )}

            {/* Help Section */}
            <div className="card" style={{ marginTop: '1.5rem' }}>
                <h4 style={{ marginBottom: '1rem' }}>Lost Your Token?</h4>
                <p style={{ margin: 0, fontSize: '0.95rem' }}>
                    Unfortunately, we cannot recover lost tokens as we don't store any identifying information
                    about you. This is by design to protect your anonymity. If you've lost your token,
                    you will need to submit a new report.
                </p>
            </div>
        </div>
    );
}

export default StatusCheck;
