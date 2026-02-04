import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ['Theft', 'Assault', 'Harassment', 'Vandalism', 'Suspicious Activity', 'Other']
    },
    city: {
        type: String,
        required: [true, 'City is required'],
        trim: true
    },
    mediaUrls: [{
        type: String
    }],
    severityScore: {
        type: Number,
        default: 0
    },
    votes: {
        low_risk: { type: Number, default: 0 },
        concerning: { type: Number, default: 0 },
        urgent: { type: Number, default: 0 },
        critical: { type: Number, default: 0 }
    }
}, {
    timestamps: true,
    versionKey: false
});

// Index for feed queries
postSchema.index({ createdAt: -1 });
postSchema.index({ category: 1 });
postSchema.index({ city: 1 });

const Post = mongoose.model('Post', postSchema);

export default Post;
