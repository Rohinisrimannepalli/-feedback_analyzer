import React, { useState } from 'react';
import axios from 'axios';

const UploadForm = () => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage('Please select an Excel or CSV file.');
      return;
    }

    const formData = new FormData();
    formData.append('feedbackFile', file); 

    setMessage('Uploading and analyzing file... This may take a moment.');

    try {
      // Send file to your backend API
      const response = await axios.post('http://localhost:5000/api/feedback/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setMessage(`Successfully analyzed ${response.data.count} feedback entries! View the dashboard.`);
      setFile(null);

    } catch (error) {
      setMessage(`Error during analysis: ${error.response?.data?.message || error.message}`);
    }
  };

  return (
    <div>
      <h2>Upload Feedback File</h2>
      <form onSubmit={handleSubmit}>
        <input 
          type="file" 
          accept=".xlsx, .xls, .csv" 
          onChange={handleFileChange} 
          name='feedbackfile'
        />
        <button type="submit" disabled={!file}>
          Analyze & Save
        </button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default UploadForm;