import mongoose from 'mongoose';

const threatVoteSchema = new mongoose.Schema({
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    voteType: { type: String, enum: ['low_risk', 'concerning', 'urgent', 'critical'], required: true },
    sessionHash: { type: String, required: true, index: true },
    timestamp: { type: Date, default: Date.now }
});

threatVoteSchema.index({ postId: 1, sessionHash: 1 }, { unique: true });

const ThreatVote = mongoose.models.ThreatVote || mongoose.model('ThreatVote', threatVoteSchema);

export default ThreatVote;
