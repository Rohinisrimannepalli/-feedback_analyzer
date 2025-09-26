const express = require('express');
const Feedback = require('../models/Feedback');
const { Parser } = require('json2csv'); 
const router = express.Router();

// 1. GET /api/insights/all - Provides all data (used for the Priority List/Actionable Items)
router.get('/all', async (req, res) => {
    try {
        const feedback = await Feedback.find().sort({ uploadDate: -1 });
        res.status(200).json(feedback);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching feedback data.' });
    }
});

// 2. GET /api/insights/summary - Provides aggregated counts for charts (Sentiment & Themes)
router.get('/summary', async (req, res) => {
    try {
        // Aggregate Sentiment Breakdown (Positive, Negative, Neutral)
        const sentimentSummary = await Feedback.aggregate([
            {
                $group: {
                    _id: "$sentiment",
                    count: { $sum: 1 }
                }
            }
        ]);
        
        // Aggregate Top 5 Themes
        const themeSummary = await Feedback.aggregate([
            { $unwind: "$themes" }, // Deconstruct the themes array
            {
                $group: {
                    _id: "$themes",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        res.status(200).json({ 
            sentiment: sentimentSummary, 
            themes: themeSummary 
        });

    } catch (error) {
        res.status(500).json({ message: 'Error fetching aggregated summary.' });
    }
});


// 3. GET /api/insights/export-csv - Generates and sends a CSV file
router.get('/export-csv', async (req, res) => {
    try {
        // Fetch all fields, excluding Mongoose versioning
        const feedback = await Feedback.find().lean().select('-__v'); 

        if (feedback.length === 0) {
            return res.status(404).json({ message: 'No data found to export.' });
        }

        const fields = ['_id', 'rawText', 'sentiment', 'summary', 'themes', 'isUrgent', 'uploadDate'];
        const json2csvParser = new Parser({ fields });
        
        const csv = json2csvParser.parse(feedback);

        // Set headers for file download in the browser
        res.header('Content-Type', 'text/csv');
        res.attachment(`feedback_report_${Date.now()}.csv`);
        res.send(csv);

    } catch (error) {
        console.error('Export Error:', error);
        res.status(500).json({ message: 'Error generating CSV report.' });
    }
});

module.exports = router;