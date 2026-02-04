import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPost } from '../services/api';

const CATEGORIES = [
    { value: 'theft', label: 'Theft / Robbery', keywords: ['steal', 'stolen', 'robbed', 'theft', 'snatch'] },
    { value: 'harassment', label: 'Harassment', keywords: ['follow', 'harass', 'catcall', 'touch'] },
    { value: 'cyber_fraud', label: 'Cyber Fraud / Online Scam', keywords: ['scam', 'fraud', 'bank', 'phishing', 'money'] },
    { value: 'stalking', label: 'Stalking', keywords: ['stalk', 'follow', 'watch'] },
    { value: 'assault', label: 'Assault / Violence', keywords: ['hit', 'beat', 'attack', 'punch', 'weapon', 'gun', 'knife'] },
    { value: 'corruption', label: 'Corruption / Bribery', keywords: ['bribe', 'money', 'police', 'official'] },
    { value: 'suspicious_activity', label: 'Suspicious Activity', keywords: ['strange', 'suspicious', 'weird', 'loiter'] },
    { value: 'accident', label: 'Accident / Hazard', keywords: ['car', 'bike', 'crash', 'accident', 'fire'] },
    { value: 'other', label: 'Other', keywords: [] }
];

const THREAT_LEVELS = [
    { value: 'low_risk', label: 'Low Risk - Information Only' },
    { value: 'concerning', label: 'Concerning - Potential Threat' },
    { value: 'urgent', label: 'Urgent - Safety at Risk' },
    { value: 'critical', label: 'Critical - Immediate Danger' }
];

const CRITICAL_KEYWORDS = ['gun', 'knife', 'kill', 'murder', 'blood', 'weapon', 'dead', 'shoot', 'bomb'];
const URGENT_KEYWORDS = ['hurt', 'injured', 'attack', 'fight', 'scream', 'help', 'fire'];

function CreatePost() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        category: '',
        description: '',
        area: '',
        city: '',
        date: '',
        time: '',
        initialThreatLevel: 'concerning'
    });
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [certified, setCertified] = useState(false);
    const fileInputRef = useRef(null);
    const [smartSuggestion, setSmartSuggestion] = useState(null);

    // Smart threat detection logic
    useEffect(() => {
        const desc = formData.description.toLowerCase();
        let suggestedLevel = null;
        let reason = '';

        if (CRITICAL_KEYWORDS.some(k => desc.includes(k))) {
            suggestedLevel = 'critical';
            reason = 'Critical keywords detected (weapon/danger)';
        } else if (URGENT_KEYWORDS.some(k => desc.includes(k))) {
            suggestedLevel = 'urgent';
            reason = 'Urgent situation keywords detected';
        }

        if (suggestedLevel && suggestedLevel !== formData.initialThreatLevel) {
            setSmartSuggestion({ level: suggestedLevel, reason });
        } else {
            setSmartSuggestion(null);
        }
    }, [formData.description, formData.initialThreatLevel]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const applySuggestion = () => {
        if (smartSuggestion) {
            setFormData(prev => ({ ...prev, initialThreatLevel: smartSuggestion.level }));
            setSmartSuggestion(null);
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (selectedFile.size > 10 * 1024 * 1024) {
                setError('File size exceeds 10MB limit');
                return;
            }
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
            setError(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!certified) {
            setError('You must certify that this report is true.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const data = new FormData();

            // Combine date and time
            let timeWindow = 'Unknown';
            if (formData.date || formData.time) {
                timeWindow = `${formData.date || ''} ${formData.time || ''}`.trim();
            }

            // Exclude separate date/time from submission, combine into timeWindow
            const { date, time, ...rest } = formData;
            Object.keys(rest).forEach(key => data.append(key, rest[key]));
            data.append('timeWindow', timeWindow);

            if (file) data.append('media', file);

            const result = await createPost(data);
            if (result.success) {
                navigate('/');
            }
        } catch (err) {
            console.error('Submit error:', err);
            setError(err.response?.data?.error || 'Failed to create post');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container container-sm fade-in">
            <div className="page-header">
                <h1>Report an Incident</h1>
                <p>Share anonymous information with the community and authorities.</p>
            </div>

            <form onSubmit={handleSubmit} className="card">
                {error && <div className="alert alert-danger">{error}</div>}

                <div className="form-group">
                    <label>Category *</label>
                    <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Select Category</option>
                        {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                </div>

                <div className="form-group">
                    <label>Description * (What happened?)</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="5"
                        required
                        minLength="50"
                        placeholder="Provide details without naming private individuals... (Min 50 characters)"
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                        <p className={`char-count ${formData.description.length < 50 ? 'text-warning' : ''}`}>
                            {formData.description.length < 50 ? `Need ${50 - formData.description.length} more characters` : `${formData.description.length}/1000`}
                        </p>
                        <p className="char-count">Min: 50 | Max: 1000</p>
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Date of Incident</label>
                        <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <label>Approx. Time</label>
                        <input
                            type="time"
                            name="time"
                            value={formData.time}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Area / Locality *</label>
                        <input
                            name="area"
                            value={formData.area}
                            onChange={handleChange}
                            required
                            placeholder="e.g. MG Road, Sector 15"
                        />
                    </div>
                    <div className="form-group">
                        <label>City *</label>
                        <input
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            required
                            placeholder="e.g. Bangalore"
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label>Initial Threat Level *</label>
                    <select
                        name="initialThreatLevel"
                        value={formData.initialThreatLevel}
                        onChange={handleChange}
                    >
                        {THREAT_LEVELS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>

                    {smartSuggestion && (
                        <div className="alert alert-warning" style={{ marginTop: '0.5rem', padding: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span>
                                <strong>AI Suggestion:</strong> {smartSuggestion.reason}. Recommended level: {smartSuggestion.level.toUpperCase()}
                            </span>
                            <button
                                type="button"
                                className="btn btn-sm btn-secondary"
                                onClick={applySuggestion}
                            >
                                Apply
                            </button>
                        </div>
                    )}
                </div>

                <div className="form-group">
                    <label>Media Evidence (Optional - Image/Video)</label>
                    <div
                        className="file-upload-area"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {previewUrl ? (
                            file.type.startsWith('video') ?
                                <video src={previewUrl} style={{ maxWidth: '100%', maxHeight: '200px' }} /> :
                                <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px' }} />
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2">
                                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                                </svg>
                                <p>Click to upload image or video (Max 10MB)</p>
                            </div>
                        )}
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                        accept="image/*,video/*"
                    />
                </div>

                <div className="form-group" style={{ display: 'flex', gap: '10px', alignItems: 'start' }}>
                    <input
                        type="checkbox"
                        id="certify"
                        checked={certified}
                        onChange={(e) => setCertified(e.target.checked)}
                        style={{ width: '20px', height: '20px', marginTop: '3px' }}
                    />
                    <label htmlFor="certify" style={{ fontWeight: 'normal', fontSize: '0.9rem' }}>
                        I certify that the information provided is true to the best of my knowledge and I understand that submitting false reports of crimes is a serious offense.
                    </label>
                </div>

                <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Submitting...' : 'Post Report'}
                </button>
            </form>
        </div>
    );
}

export default CreatePost;
