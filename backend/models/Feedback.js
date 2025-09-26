const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    rawText: { 
        type: String, 
        required: true 
    },
    // AI-Generated Analysis
    sentiment: { 
        type: String, 
        enum: ['Positive', 'Negative', 'Neutral'], 
        default: 'Neutral' 
    }, // Differentiates good/bad feedback
    summary: { 
        type: String 
    },
    themes: [{ 
        type: String 
    }],
    isUrgent: { 
        type: Boolean, 
        default: false 
    }, 
    // Contextual Data (You can add User/Session/Batch IDs later)
    uploadDate: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);