import mongoose from 'mongoose';

const voteTrackSchema = new mongoose.Schema({
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    voteType: { type: String, required: true }
}, {
    timestamps: true
});

voteTrackSchema.index({ postId: 1, sessionId: 1 }, { unique: true });

const VoteTrack = mongoose.models.VoteTrack || mongoose.model('VoteTrack', voteTrackSchema);

export default VoteTrack;
