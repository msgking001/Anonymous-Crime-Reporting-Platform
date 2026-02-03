import React from 'react';

const THREAT_LEVELS = [
    { value: 'low_risk', label: 'Low Risk', color: '#10b981', icon: '🟢' },
    { value: 'concerning', label: 'Concerning', color: '#f59e0b', icon: '🟠' },
    { value: 'urgent', label: 'Urgent', color: '#ef4444', icon: '🔴' },
    { value: 'critical', label: 'Critical', color: '#7f1d1d', icon: '⚫' }
];

const ThreatButtons = ({ onVote, currentVote, isVoting }) => {
    return (
        <div className="threat-buttons-container">
            <p className="threat-label">Validate Threat Level:</p>
            <div className="threat-buttons-grid">
                {THREAT_LEVELS.map((level) => (
                    <button
                        key={level.value}
                        onClick={() => onVote(level.value)}
                        disabled={isVoting}
                        className={`threat-btn ${currentVote === level.value ? 'active' : ''}`}
                        style={{
                            '--btn-color': level.color,
                            opacity: currentVote && currentVote !== level.value ? 0.5 : 1
                        }}
                    >
                        <span className="threat-icon">{level.icon}</span>
                        <span className="threat-text">{level.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ThreatButtons;
