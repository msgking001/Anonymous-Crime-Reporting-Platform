import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
    reportId: { type: String, required: true, unique: true },
    hashedToken: { type: String, required: true, index: true },
    category: { type: String, required: true },
    crimeType: { type: String, required: true },
    description: { type: String, required: true },
    location: {
        area: String,
        city: String,
        coordinates: {
            lat: Number,
            lng: Number
        }
    },
    threatLevel: { type: String, enum: ['low', 'concerning', 'urgent', 'critical'], default: 'low' },
    incidentTime: { type: Date, default: Date.now },
    evidenceUrls: [String],
    status: { type: String, enum: ['submitted', 'reviewing', 'verified', 'resolved', 'dismissed'], default: 'submitted' },
    statusMessage: String,
    assignedAuthority: String,
    confidenceScore: { type: Number, default: 0 },
    urgencyScore: { type: Number, default: 0 },
    spamFlag: { type: Boolean, default: false }
}, {
    timestamps: true,
    versionKey: false
});

const Report = mongoose.models.Report || mongoose.model('Report', reportSchema);

export default Report;
