import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { submitReport, uploadEvidence } from '../services/api';

// Crime categories
const CATEGORIES = [
    { value: 'theft', label: 'Theft / Robbery' },
    { value: 'harassment', label: 'Harassment' },
    { value: 'cyber_fraud', label: 'Cyber Fraud / Online Scam' },
    { value: 'stalking', label: 'Stalking' },
    { value: 'assault', label: 'Assault / Violence' },
    { value: 'corruption', label: 'Corruption / Bribery' },
    { value: 'other', label: 'Other' }
];

const THREAT_LEVELS = [
    { value: 'low', label: 'Low - No immediate danger', color: '#10b981' },
    { value: 'medium', label: 'Medium - Potential threat', color: '#f59e0b' },
    { value: 'high', label: 'High - Serious concern', color: '#ef4444' },
    { value: 'emergency', label: 'Emergency - Immediate danger', color: '#dc2626' }
];

// Shield Lock Icon
const ShieldLockIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <rect x="9" y="10" width="6" height="5" rx="1" />
        <path d="M10 10V8a2 2 0 114 0v2" />
    </svg>
);

// Copy Icon
const CopyIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="9" y="9" width="13" height="13" rx="2" />
        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
);

// Upload Icon
const UploadIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
);

function ReportForm() {
    const [formData, setFormData] = useState({
        category: '',
        crimeType: 'physical',
        description: '',
        location: { area: '', city: '', coordinates: { lat: null, lng: null } },
        threatLevel: 'medium',
        incidentTime: { date: '', approximate: false }
    });

    const [files, setFiles] = useState([]);
    const [uploadedUrls, setUploadedUrls] = useState([]);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionResult, setSubmissionResult] = useState(null);
    const [copied, setCopied] = useState(false);
    const fileInputRef = useRef(null);

    // Form validation
    const validateForm = () => {
        const newErrors = {};

        if (!formData.category) {
            newErrors.category = 'Please select a crime category';
        }

        if (formData.description.length < 50) {
            newErrors.description = `Description must be at least 50 characters (${formData.description.length}/50)`;
        } else if (formData.description.length > 1000) {
            newErrors.description = `Description must not exceed 1000 characters (${formData.description.length}/1000)`;
        }

        if (!formData.location.area) {
            newErrors.area = 'Please enter the area/locality';
        }

        if (!formData.location.city) {
            newErrors.city = 'Please enter the city';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle input changes
    const handleChange = (field, value) => {
        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: { ...prev[parent], [child]: value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [field]: value }));
        }

        // Clear error when user starts typing
        if (errors[field.split('.').pop()]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field.split('.').pop()];
                return newErrors;
            });
        }
    };

    // Handle file selection
    const handleFileSelect = async (e) => {
        const selectedFiles = Array.from(e.target.files);
        const validFiles = selectedFiles.filter(file => {
            const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'audio/mpeg', 'audio/wav'];
            const maxSize = 10 * 1024 * 1024; // 10MB
            return validTypes.includes(file.type) && file.size <= maxSize;
        });

        if (validFiles.length < selectedFiles.length) {
            setErrors(prev => ({ ...prev, files: 'Some files were skipped (invalid type or size > 10MB)' }));
        }

        setFiles(prev => [...prev, ...validFiles].slice(0, 5)); // Max 5 files
    };

    // Remove file
    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsSubmitting(true);
        setErrors({});

        try {
            // Upload files first if any
            let evidenceUrls = [];
            if (files.length > 0) {
                const uploadResult = await uploadEvidence(files);
                if (uploadResult.success) {
                    evidenceUrls = uploadResult.data.urls;
                    setUploadedUrls(evidenceUrls);
                }
            }

            // Submit report
            const reportData = {
                ...formData,
                evidenceUrls
            };

            const result = await submitReport(reportData);

            if (result.success) {
                setSubmissionResult(result.data);
            } else {
                setErrors({ submit: result.error || 'Failed to submit report' });
            }
        } catch (error) {
            console.error('Submission error:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Failed to submit report. Please try again.';
            setErrors({ submit: errorMessage });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Copy token to clipboard
    const copyToken = async () => {
        if (submissionResult?.token) {
            await navigator.clipboard.writeText(submissionResult.token);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Success view
    if (submissionResult) {
        return (
            <div className="container container-sm">
                <div className="card status-card fade-in" style={{ marginTop: '3rem' }}>
                    <div className="status-icon" style={{
                        background: 'rgba(16, 185, 129, 0.2)',
                        color: '#10b981'
                    }}>
                        ✓
                    </div>
                    <h2>Report Submitted Successfully</h2>
                    <p style={{ color: 'var(--color-text-secondary)' }}>
                        Your report has been received and will be reviewed by the appropriate authority.
                    </p>

                    <div className="token-display">
                        <p style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                            Your Anonymous Token
                        </p>
                        <div className="token-value">{submissionResult.token}</div>
                        <button
                            className="btn btn-secondary token-copy-btn"
                            onClick={copyToken}
                        >
                            <CopyIcon />
                            {copied ? 'Copied!' : 'Copy Token'}
                        </button>
                    </div>

                    <div className="alert alert-warning" style={{ textAlign: 'left', margin: '1.5rem 0' }}>
                        <svg className="alert-icon" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        <div>
                            <strong>Save your token!</strong>
                            <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
                                This is the only way to track your report. We cannot recover it for you.
                            </p>
                        </div>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '1rem',
                        padding: '1rem',
                        background: 'var(--color-bg-elevated)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '1.5rem'
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Assigned To</p>
                            <p style={{ margin: '0.25rem 0 0', fontWeight: 500 }}>
                                {submissionResult.assignedAuthority === 'cybercrime_unit' ? 'Cybercrime Unit' : 'Local Police'}
                            </p>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Status</p>
                            <p style={{ margin: '0.25rem 0 0', fontWeight: 500, color: '#3b82f6' }}>
                                Submitted
                            </p>
                        </div>
                    </div>

                    <p style={{
                        fontSize: '0.9rem',
                        color: 'var(--color-text-muted)',
                        marginBottom: '1.5rem'
                    }}>
                        {submissionResult.disclaimer}
                    </p>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <Link to="/status" className="btn btn-primary">
                            Check Status
                        </Link>
                        <Link to="/" className="btn btn-secondary">
                            Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container container-sm">
            <div className="page-header" style={{ marginTop: '2rem' }}>
                <h1>Submit Crime Report</h1>
                <p>
                    Fill out the form below to submit an anonymous crime report.
                    All fields marked with * are required.
                </p>
            </div>

            {/* Anonymous Notice */}
            <div className="anonymous-notice">
                <div className="icon">
                    <ShieldLockIcon />
                </div>
                <div className="text">
                    <strong>You are completely anonymous</strong>
                    <span>We don't collect your name, email, phone, or IP address.</span>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="card">
                {/* Crime Category */}
                <div className="form-group">
                    <label>Crime Category *</label>
                    <select
                        value={formData.category}
                        onChange={(e) => handleChange('category', e.target.value)}
                        className={errors.category ? 'error' : ''}
                    >
                        <option value="">Select a category</option>
                        {CATEGORIES.map(cat => (
                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                    </select>
                    {errors.category && <p className="form-error">{errors.category}</p>}
                </div>

                {/* Crime Type */}
                <div className="form-group">
                    <label>Crime Type *</label>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        {['physical', 'cyber'].map(type => (
                            <label
                                key={type}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.75rem 1.25rem',
                                    background: formData.crimeType === type ? 'rgba(99, 102, 241, 0.15)' : 'var(--color-bg-elevated)',
                                    border: `1px solid ${formData.crimeType === type ? 'var(--color-accent-primary)' : 'var(--color-border)'}`,
                                    borderRadius: 'var(--radius-md)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <input
                                    type="radio"
                                    name="crimeType"
                                    value={type}
                                    checked={formData.crimeType === type}
                                    onChange={(e) => handleChange('crimeType', e.target.value)}
                                    style={{ display: 'none' }}
                                />
                                <span style={{
                                    width: '18px',
                                    height: '18px',
                                    borderRadius: '50%',
                                    border: `2px solid ${formData.crimeType === type ? 'var(--color-accent-primary)' : 'var(--color-text-muted)'}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {formData.crimeType === type && (
                                        <span style={{
                                            width: '10px',
                                            height: '10px',
                                            borderRadius: '50%',
                                            background: 'var(--color-accent-primary)'
                                        }} />
                                    )}
                                </span>
                                <span style={{ textTransform: 'capitalize' }}>{type} Crime</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Description */}
                <div className="form-group">
                    <label>Description of Incident *</label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        placeholder="Provide a detailed description of what happened. Include relevant details like time, circumstances, and any identifying information about perpetrators."
                        rows={6}
                        className={errors.description ? 'error' : ''}
                    />
                    <p className={`char-count ${formData.description.length < 50 ? 'warning' :
                            formData.description.length > 1000 ? 'error' : ''
                        }`}>
                        {formData.description.length}/1000 characters (minimum 50)
                    </p>
                    {errors.description && <p className="form-error">{errors.description}</p>}
                </div>

                {/* Location */}
                <div className="form-row">
                    <div className="form-group">
                        <label>Area / Locality *</label>
                        <input
                            type="text"
                            value={formData.location.area}
                            onChange={(e) => handleChange('location.area', e.target.value)}
                            placeholder="e.g., MG Road, Sector 15"
                            className={errors.area ? 'error' : ''}
                        />
                        {errors.area && <p className="form-error">{errors.area}</p>}
                    </div>
                    <div className="form-group">
                        <label>City *</label>
                        <input
                            type="text"
                            value={formData.location.city}
                            onChange={(e) => handleChange('location.city', e.target.value)}
                            placeholder="e.g., Mumbai, Delhi"
                            className={errors.city ? 'error' : ''}
                        />
                        {errors.city && <p className="form-error">{errors.city}</p>}
                    </div>
                </div>

                {/* Threat Level */}
                <div className="form-group">
                    <label>Threat Level *</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                        {THREAT_LEVELS.map(level => (
                            <label
                                key={level.value}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '0.75rem 1rem',
                                    background: formData.threatLevel === level.value ? `${level.color}15` : 'var(--color-bg-elevated)',
                                    border: `1px solid ${formData.threatLevel === level.value ? level.color : 'var(--color-border)'}`,
                                    borderRadius: 'var(--radius-md)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <input
                                    type="radio"
                                    name="threatLevel"
                                    value={level.value}
                                    checked={formData.threatLevel === level.value}
                                    onChange={(e) => handleChange('threatLevel', e.target.value)}
                                    style={{ display: 'none' }}
                                />
                                <span style={{
                                    width: '12px',
                                    height: '12px',
                                    borderRadius: '50%',
                                    background: formData.threatLevel === level.value ? level.color : 'transparent',
                                    border: `2px solid ${level.color}`
                                }} />
                                <span style={{ fontSize: '0.9rem' }}>{level.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Incident Date */}
                <div className="form-group">
                    <label>Incident Date (Optional)</label>
                    <div className="form-row">
                        <input
                            type="date"
                            value={formData.incidentTime.date}
                            onChange={(e) => handleChange('incidentTime.date', e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                        />
                        <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginBottom: 0,
                            cursor: 'pointer'
                        }}>
                            <input
                                type="checkbox"
                                checked={formData.incidentTime.approximate}
                                onChange={(e) => handleChange('incidentTime.approximate', e.target.checked)}
                                style={{ width: 'auto' }}
                            />
                            <span>Date is approximate</span>
                        </label>
                    </div>
                </div>

                {/* Evidence Upload */}
                <div className="form-group">
                    <label>Evidence (Optional)</label>
                    <div
                        className="file-upload-area"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <UploadIcon />
                        <p style={{ margin: '1rem 0 0.5rem' }}>
                            Click to upload or drag and drop
                        </p>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                            Images, videos, or audio files (max 10MB each, up to 5 files)
                        </p>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*,video/*,audio/*"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                    />
                    {files.length > 0 && (
                        <div className="file-list">
                            {files.map((file, index) => (
                                <div key={index} className="file-item">
                                    <span>{file.name}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeFile(index)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: 'var(--color-danger)',
                                            cursor: 'pointer',
                                            padding: '0.25rem'
                                        }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    {errors.files && <p className="form-error">{errors.files}</p>}
                </div>

                {/* Submit Error */}
                {errors.submit && (
                    <div className="alert alert-danger">
                        <svg className="alert-icon" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                        <div>{errors.submit}</div>
                    </div>
                )}

                {/* Disclaimer */}
                <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
                    <svg className="alert-icon" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    <div style={{ fontSize: '0.9rem' }}>
                        This report will be analyzed and routed to the appropriate authority
                        (local police or cybercrime unit) based on the crime type and category.
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <>
                            <span className="loader" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
                            Submitting...
                        </>
                    ) : (
                        'Submit Anonymous Report'
                    )}
                </button>
            </form>
        </div>
    );
}

export default ReportForm;
