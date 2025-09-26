const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const Feedback = require('../models/Feedback');
const { analyzeFeedback } = require('../services/aiService');

const router = express.Router();

// Configure Multer to store the uploaded file temporarily in memory
const upload = multer({ storage: multer.memoryStorage() });

// POST route to upload, analyze, and save feedback
router.post('/upload', upload.single('feedbackFile'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }

    try {
        // --- 1. PARSE FILE ---
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const rawFeedbackArray = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
        // !!! CRITICAL FIX: The column name MUST be updated to match your Excel file header!
        const FEEDBACK_COLUMN_NAME = 'Student Comment'; // Assuming this is your actual column name
        
        let feedbackToSave = [];
        let errorCount = 0;
        
        // --- 2. ANALYZE AND COLLECT (Iterate) ---
        for (const item of rawFeedbackArray) {
            const rawText = item[FEEDBACK_COLUMN_NAME];

            if (rawText && typeof rawText === 'string' && rawText.trim().length > 0) {
                
                // Call the AI service for analysis
                const analysisResult = await analyzeFeedback(rawText);

                // If AI analysis returned an error status, increment error count but still log the entry
                if (analysisResult.sentiment === 'Error') {
                    errorCount++;
                }
                
                // --- 3. PREPARE DOCUMENT FOR BATCH INSERT ---
                feedbackToSave.push({
                    rawText: rawText,
                    // Use spread operator to quickly map the analysis results
                    sentiment: analysisResult.sentiment,
                    summary: analysisResult.summary,
                    // Ensure the themes result is handled as an array
                    themes: Array.isArray(analysisResult.themes) ? analysisResult.themes : [analysisResult.theme || 'General'],
                    isUrgent: analysisResult.isUrgent === true || analysisResult.isUrgent === 'true'
                });

            }
        }
        console.log(feedbackToSave)
        
        // --- 4. SAVE TO MONGODB (Use insertMany for better efficiency) ---
        const savedDocs = await Feedback.insertMany(feedbackToSave);
        console.log(`Saved ${savedDocs.length} feedback entries to the database.`);
        
        let statusMessage = `Feedback successfully analyzed and saved. Total saved: ${savedDocs.length}.`;
        if (errorCount > 0) {
            statusMessage += ` (Note: ${errorCount} entries failed AI analysis.)`;
        }

        console.log('statusMessage:', statusMessage);
        console.log("Returning success response to client")

        return res.status(200).json({ 
            message: statusMessage, 
            count: savedDocs.length 
        });

    } catch (error) {
        // Log the full stack trace on the server for debugging
        console.error('CRITICAL FILE PROCESSING ERROR:', error); 
        
        return res.status(500).json({ 
            message: 'Internal server error during file processing or AI analysis. Check backend logs.',
            error: error.message 
        });
    }
});

module.exports = router;