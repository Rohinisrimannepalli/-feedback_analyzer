// services/aiService.js

const { GoogleGenAI } = require('@google/genai');

// 1. Initialize the Gemini client WITHOUT arguments.
// The SDK will automatically detect and use process.env.GEMINI_API_KEY.
const ai = new GoogleGenAI({}); 

const model = "gemini-2.5-flash"; 

/**
 * Analyzes a single piece of feedback text using the Gemini API.
 * @param {string} text - The raw student feedback text.
 * @returns {object} - Structured analysis (sentiment, summary, theme, isUrgent).
 */
async function analyzeFeedback(text) {
    // Structured prompt for consistent, parsable JSON output
    const prompt = `
        Analyze the following student feedback text. You must return a single JSON object. 
        The JSON object must have the following keys and values:
        1. 'sentiment': Must be one of 'Positive', 'Negative', or 'Neutral'.
        2. 'summary': A concise, one-sentence summary of the main point.
        3. 'theme': The single most relevant topic (e.g., 'Instructor Pace', 'Material Clarity', 'Engagement').
        4. 'isUrgent': A boolean value (true or false) indicating if the feedback contains an immediate, urgent concern.

        Feedback Text: "${text}"
    `;

    try {
        // 2. Use ai.generateContent directly (or ai.models.generateContent)
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            // Configure response to be JSON
            config: {
                responseMimeType: "application/json",
            }
        });

        // The response text should be the raw JSON string
        const jsonString = response.text.trim();
        const analysisResult = JSON.parse(jsonString);

        // Sanitize and return the result, ensuring 'themes' is an array.
        return {
            sentiment: analysisResult.sentiment || 'Neutral',
            summary: analysisResult.summary || text.substring(0, 50) + '...',
            themes: Array.isArray(analysisResult.theme) ? analysisResult.theme : [analysisResult.theme],
            isUrgent: analysisResult.isUrgent === true || analysisResult.isUrgent === 'true'
        };


    } catch (error) {
        console.error("AI Analysis Error:", error.message);
        // Return a default structure in case of API failure
        return {
            sentiment: 'Neutral',
            summary: 'Analysis failed (Check API Key/Network).',
            themes: ['Error'],
            isUrgent: false
        };
    }
}

module.exports = { analyzeFeedback };