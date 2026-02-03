import mongoose from 'mongoose';

/**
 * ThreatVote Schema
 * Tracks anonymous threat level votes on posts
 * One vote per session per post
 */
const threatVoteSchema = new mongoose.Schema({
    // Reference to the post
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true,
        index: true
    },

    // Vote type
    voteType: {
        type: String,
        required: true,
        enum: ['low_risk', 'concerning', 'urgent', 'critical']
    },

    // Hashed session ID (for one vote per session)
    sessionHash: {
        type: String,
        required: true,
        index: true
    },

    // Timestamp
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Compound index to ensure one vote per session per post
threatVoteSchema.index({ postId: 1, sessionHash: 1 }, { unique: true });

const ThreatVote = mongoose.model('ThreatVote', threatVoteSchema);

export default ThreatVote;
