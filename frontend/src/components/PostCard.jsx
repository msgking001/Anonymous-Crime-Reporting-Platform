import React, { useState, useEffect } from 'react';
import { submitVote, checkVoteStatus } from '../services/api';
import ThreatButtons from './ThreatButtons';

const PostCard = ({ post }) => {
    const [voteType, setVoteType] = useState(null);
    const [isVoting, setIsVoting] = useState(false);
    const [threatLevel, setThreatLevel] = useState(post.threatLevel || post.initialThreatLevel || 'concerning');

    useEffect(() => {
        // Check if current user has voted
        const checkVote = async () => {
            try {
                const result = await checkVoteStatus(post.postId);
                if (result.success && result.data.hasVoted) {
                    setVoteType(result.data.voteType);
                }
            } catch (error) {
                console.error('Failed to check vote status', error);
            }
        };
        checkVote();
    }, [post.postId]);

    const handleVote = async (type) => {
        if (isVoting) return;
        setIsVoting(true);
        try {
            const result = await submitVote(post._id || post.postId, type);
            if (result?.success) {
                setVoteType(type);
                setThreatLevel(result.data?.threatLevel || post.threatLevel);
            }
        } catch (error) {
            console.error('Vote failed', error);
        } finally {
            setIsVoting(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    const getMediaUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        const baseUrl = import.meta.env.VITE_API_URL;
        return `${baseUrl}${url}`;
    };

    return (
        <div className={`post-card threat-${threatLevel}`}>
            {/* Header */}
            <div className="post-header">
                <div className="post-meta">
                    <span className="category-badge">{(post.category || 'Other').replace('_', ' ')}</span>
                    <span className="location-tag">📍 {post.location?.area || 'Somewhere'}, {post.location?.city || 'Nowhere'}</span>
                </div>
                <span className="post-time">{post.createdAt ? formatDate(post.createdAt) : 'Recently'}</span>
            </div>

            {/* Content */}
            <div className="post-content">
                <p className="post-description">{post.description}</p>
                {post.mediaUrl && (
                    <div className="media-container">
                        {post.contentType === 'video' ? (
                            <video controls src={getMediaUrl(post.mediaUrl)} className="post-media" />
                        ) : (
                            <img src={getMediaUrl(post.mediaUrl)} alt="Evidence" className="post-media" />
                        )}
                    </div>
                )}
            </div>

            {/* Voting Section */}
            <div className="post-footer">
                <ThreatButtons
                    onVote={handleVote}
                    currentVote={voteType}
                    isVoting={isVoting}
                />

                {post.communityFlagged && (
                    <div className="flagged-badge">
                        ⚠️ Community Flagged
                    </div>
                )}
            </div>
        </div>
    );
};

export default PostCard;
