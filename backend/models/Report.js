import mongoose from 'mongoose';

/**
 * Report Schema for Crime Reports
 * Stores anonymous crime reports with encrypted sensitive data
 */
const reportSchema = new mongoose.Schema({
    // Unique report identifier
    reportId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    // SHA256 hashed token for anonymous reporter access
    hashedToken: {
        type: String,
        required: true,
        index: true
    },

    // Crime category
    category: {
        type: String,
        required: true,
        enum: ['theft', 'harassment', 'cyber_fraud', 'stalking', 'assault', 'corruption', 'other']
    },

    // Type of crime
    crimeType: {
        type: String,
        required: true,
        enum: ['physical', 'cyber']
    },

    // Encrypted description of the crime
    description: {
        type: String,
        required: true
    },

    // Location information
    location: {
        area: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        coordinates: {
            lat: Number,
            lng: Number
        }
    },

    // Time of incident
    incidentTime: {
        date: Date,
        timeRange: {
            start: String,
            end: String
        },
        approximate: {
            type: Boolean,
            default: false
        }
    },

    // Threat level assessment
    threatLevel: {
        type: String,
        required: true,
        enum: ['low', 'medium', 'high', 'emergency']
    },

    // AI-calculated confidence score (0-100)
    confidenceScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 50
    },

    // AI-calculated urgency score (0-100)
    urgencyScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 50
    },

    // Evidence file URLs
    evidenceUrls: [{
        type: String
    }],

    // Assigned authority for handling
    assignedAuthority: {
        type: String,
        enum: ['cybercrime_unit', 'local_police'],
        default: 'local_police'
    },

    // Report status
    status: {
        type: String,
        enum: ['submitted', 'under_review', 'forwarded', 'closed'],
        default: 'submitted'
    },

    // Status message from authority (visible to reporter)
    statusMessage: {
        type: String,
        default: ''
    },

    // Spam/low-quality flag
    spamFlag: {
        type: Boolean,
        default: false
    },

    // Admin notes (not visible to reporter)
    adminNotes: {
        type: String,
        default: ''
    }
}, {
    timestamps: true // Adds createdAt and updatedAt
});

// Index for efficient querying
reportSchema.index({ category: 1, status: 1 });
reportSchema.index({ urgencyScore: -1 });
reportSchema.index({ createdAt: -1 });

const Report = mongoose.model('Report', reportSchema);

export default Report;
