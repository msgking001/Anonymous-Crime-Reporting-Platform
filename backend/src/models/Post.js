import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
    postId: { type: String, unique: true, index: true },
    hashedToken: { type: String, index: true },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    category: {
        type: String,
        required: true,
        index: true
    },
    location: {
        area: String,
        city: String,
        coordinates: { lat: Number, lng: Number }
    },
    status: {
        type: String,
        enum: ['submitted', 'under_review', 'forwarded', 'closed'],
        default: 'submitted'
    },
    statusMessage: {
        type: String,
        default: 'Your report has been received and is waiting to be reviewed.'
    },
    initialThreatLevel: {
        type: String,
        enum: ['low_risk', 'concerning', 'urgent', 'critical'],
        default: 'concerning'
    },
    moderation: {
        flagged: { type: Boolean, default: false },
        reason: String
    },
    votes: {
        low_risk: { type: Number, default: 0 },
        concerning: { type: Number, default: 0 },
        urgent: { type: Number, default: 0 },
        critical: { type: Number, default: 0 }
    },
    severityScore: {
        type: Number,
        default: 0,
        index: true
    }
}, {
    timestamps: true,
    versionKey: false
});

// Compound index for feed sorting and filtering
postSchema.index({ createdAt: -1 });

// Safe compilation pattern for production
const Post = mongoose.models.Post || mongoose.model('Post', postSchema);

export default Post;
