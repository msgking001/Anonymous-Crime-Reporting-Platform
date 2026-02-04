import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
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
    city: {
        type: String,
        required: true,
        index: true
    },
    mediaUrls: [{
        type: String
    }],
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

const Post = mongoose.model('Post', postSchema);

export default Post;
