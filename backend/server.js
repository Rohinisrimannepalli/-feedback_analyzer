// backend/server.js

const dotenv = require('dotenv');
// 1. LOAD DOTENV FIRST!
dotenv.config(); 

// 2. NOW, REQUIRE EVERYTHING ELSE
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');



app.use(express.json());
app.use(cors());
// The AI Service (aiService.js) relies on process.env.GEMINI_API_KEY
const feedbackRoutes = require('./routes/feedbackRoutes'); 
const insightRoutes = require('./routes/insightRoutes');
const connectDB = require('./config/db');


// Check if the key loaded (Optional but helpful debug step)
if (!process.env.GEMINI_API_KEY) {
    console.error("FATAL ERROR: GEMINI_API_KEY not loaded from .env file.");
    process.exit(1);
} else {
    console.log("Environment variables loaded successfully.");
}


// Connect to Database
connectDB(); 


app.use('/api/feedback', feedbackRoutes);
app.use('/api/insights', insightRoutes);

app.listen(process.env.PORT || 5000, () => {
    console.log(`Server running on port ${process.env.PORT || 3000}`);
})


// ... (rest of your server.js code)