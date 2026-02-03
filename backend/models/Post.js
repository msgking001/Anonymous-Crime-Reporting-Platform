import mongoose from 'mongoose';

/**
 * Post Schema for Anonymous Crime Awareness Posts
 * Stores anonymous incident reports displayed in the public feed
 */
const postSchema = new mongoose.Schema({
    // Unique post identifier
    postId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    // Content type
    contentType: {
        type: String,
        required: true,
        enum: ['text', 'image', 'video']
    },

    // Media URL for images/videos
    mediaUrl: {
        type: String,
        default: null
    },

    // Crime category (mandatory)
    category: {
        type: String,
        required: true,
        enum: ['theft', 'harassment', 'cyber_fraud', 'stalking', 'assault', 'corruption', 'accident', 'suspicious_activity', 'other']
    },

    // Sanitized description
    description: {
        type: String,
        required: true,
        maxlength: 500
    },

    // Location (area-level only, not exact address)
    location: {
        area: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        }
    },

    // Time window of incident
    timeWindow: {
        type: String,
        default: 'Unknown'
    },

    // Initial threat level set by poster
    initialThreatLevel: {
        type: String,
        required: true,
        enum: ['low', 'concerning', 'urgent', 'critical']
    },

    // Computed threat score from community votes (0-100)
    threatScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },

    // Vote counts (not shown publicly)
    votes: {
        low_risk: { type: Number, default: 0 },
        concerning: { type: Number, default: 0 },
        urgent: { type: Number, default: 0 },
        critical: { type: Number, default: 0 }
    },

    // Total vote count
    totalVotes: {
        type: Number,
        default: 0
    },

    // AI-calculated evidence quality score (0-100)
    evidenceScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 50
    },

    // Visibility score (computed)
    visibilityScore: {
        type: Number,
        default: 0
    },

    // Moderation status
    verified: {
        type: Boolean,
        default: false
    },

    // Content moderation flags
    moderation: {
        reviewed: { type: Boolean, default: false },
        flagged: { type: Boolean, default: false },
        flagReason: { type: String, default: '' }
    },

    // Authority action status
    status: {
        type: String,
        enum: ['pending', 'under_review', 'action_taken', 'dismissed'],
        default: 'pending'
    },

    // Status message from authority (visible to public)
    statusMessage: {
        type: String,
        default: ''
    },

    // Community flagged (high threat)
    communityFlagged: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes for efficient querying
postSchema.index({ threatScore: -1 });
postSchema.index({ visibilityScore: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ category: 1, status: 1 });
postSchema.index({ 'location.city': 1 });

// Method to calculate threat score from votes
postSchema.methods.calculateThreatScore = function() {
    const weights = {
        low_risk: 10,
        concerning: 35,
        urgent: 70,
        critical: 100
    };

    if (this.totalVotes === 0) return 0;

    const weightedSum = 
        (this.votes.low_risk * weights.low_risk) +
        (this.votes.concerning * weights.concerning) +
        (this.votes.urgent * weights.urgent) +
        (this.votes.critical * weights.critical);

    return Math.round(weightedSum / this.totalVotes);
};

// Method to calculate visibility score
postSchema.methods.calculateVisibilityScore = function() {
    const hoursOld = (Date.now() - this.createdAt) / (1000 * 60 * 60);
    const recencyFactor = Math.max(0, 100 - (hoursOld * 2)); // Decays over 50 hours
    
    return Math.round(
        (this.threatScore * 0.4) +
        (this.evidenceScore * 0.2) +
        (recencyFactor * 0.3) +
        (Math.min(this.totalVotes * 2, 20) * 0.1)
    );
};

// Pre-save hook to update scores
postSchema.pre('save', function(next) {
    this.threatScore = this.calculateThreatScore();
    this.visibilityScore = this.calculateVisibilityScore();
    
    // Mark as community flagged if threat score is high
    if (this.threatScore >= 70 && this.totalVotes >= 5) {
        this.communityFlagged = true;
    }
    
    next();
});

const Post = mongoose.model('Post', postSchema);

export default Post;
