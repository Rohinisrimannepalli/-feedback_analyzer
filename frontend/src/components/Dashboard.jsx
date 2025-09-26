import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = {
    'Positive': '#4CAF50', // Green (Good Feedback)
    'Negative': '#F44336', // Red (Bad Feedback)
    'Neutral': '#FFC107',  // Amber
    'Error': '#9E9E9E'     // Gray
};

const Dashboard = () => {
    // State to hold aggregated data for charts and themes
    const [summaryData, setSummaryData] = useState({ sentiment: [], themes: [] });
    // State to hold filtered, actionable items (Negative or Urgent)
    const [actionableItems, setActionableItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch aggregated summary data for charts
                const summaryRes = await axios.get('http://localhost:5000/api/insights/summary');
                setSummaryData(summaryRes.data);

                // Fetch all data for filtering Priority Items
                const allDataRes = await axios.get('http://localhost:5000/api/insights/all');
                
                // Filter: Only include NEGATIVE feedback OR items flagged as URGENT
                const priority = allDataRes.data.filter(
                    // FIX: Correctly using the logical OR (||) operator
                    f => f.isUrgent || f.sentiment === 'Negative' 
                ).sort((a, b) => (b.isUrgent ? 1 : a.isUrgent ? -1 : 0)); // Sort urgent items to the top

                setActionableItems(priority);
                
            } catch (err) {
                console.error("Error fetching dashboard data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    if (loading) return <div style={{ padding: '20px' }}>Loading powerful insights... 🧠</div>;

    // Format sentiment data for PieChart
    const sentimentChartData = summaryData.sentiment.map(item => ({
        name: item._id,
        value: item.count,
        color: COLORS[item._id] || '#9E9E9E',
    }));
    
    // Format theme data for list display
    const themeDisplayData = summaryData.themes.map(t => ({
        name: t._id,
        count: t.count,
    }));


    return (
        <div style={{ padding: '20px' }}>
            <h2>Actionable Insights Dashboard 📊</h2>
            
            {/* --- EXPORT BUTTON (Triggers download from backend API) --- */}
            <a href="http://localhost:5000/api/insights/export-csv" download>
                <button style={{ 
                    padding: '10px 20px', 
                    fontSize: '16px', 
                    cursor: 'pointer',
                    backgroundColor: '#1976D2', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px',
                    marginBottom: '30px' 
                }}>
                    ⬇️ Download Full CSV Report
                </button>
            </a>
            <hr />
            {/* Layout for Charts and Themes */}
            <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '20px' }}>
                {/* 1. Sentiment Breakdown Chart (Visualizing Good vs. Bad Feedback) */}
                <div style={{ width: '45%', minWidth: '300px', height: 300, border: '1px solid #eee', padding: '10px' }}>
                    <h3>Sentiment Distribution</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={sentimentChartData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                fill="#8884d8"
                                labelLine={false}
                                // FIX: Corrected template literal syntax
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                                {sentimentChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend layout="horizontal" align="center" verticalAlign="bottom" />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* 2. Top Themes List */}
                <div style={{ width: '45%', minWidth: '300px', height: 300, border: '1px solid #eee', padding: '10px' }}>
                    <h3>Top 5 Recurring Themes</h3>
                    <ol style={{ listStyleType: 'decimal', paddingLeft: '20px' }}>
                        {themeDisplayData.map((theme, index) => (
                            <li key={index} style={{ marginBottom: '5px' }}>
                                <strong>{theme.name}</strong> ({theme.count} mentions)
                            </li>
                        ))}
                    </ol>
                </div>
            </div>

            <hr style={{ marginTop: '30px' }}/>

            // ... (inside the Dashboard component's return statement)

            {/* 3. Priority Issues List (Actionable Items) */}
            <h3>Priority Action Items ({actionableItems.length})</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
                {actionableItems.length > 0 ? (
                    actionableItems.map((item) => (
                        <li 
                            key={item._id} 
                            style={{ 
                                backgroundColor: item.isUrgent ? '#FFEBEE' : '#FFF3E0', 
                                // FIX APPLIED HERE: The entire value must be enclosed in backticks (` `)
                                borderLeft: `5px solid ${item.isUrgent ? '#D32F2F' : '#FFA000'}`,
                                padding: '10px', 
                                marginBottom: '10px',
                                borderRadius: '4px'
                            }}
                        >
                            <strong>{item.isUrgent ? '🔴 URGENT CONCERN: ' : '🟠 Negative Feedback: '}</strong>
                            {item.summary} <br />
                            <small>Theme(s): {item.themes.join(', ')} | Received: {new Date(item.uploadDate).toLocaleDateString()}</small>
                        </li>
                    ))
                ) : (
                    <p>Great job! No negative or urgent issues require immediate action.</p>
                )}
            </ul>
        </div>
    );
};

export default Dashboard;