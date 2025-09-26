import React, { useState } from 'react';
import UploadForm from './components/UploadForm';
import Dashboard from './components/Dashboard';

function App() {
  const [activeView, setActiveView] = useState('upload'); // 'upload' or 'dashboard'

  return (
    <div className="App">
      <header>
        <h1>AI-Powered Feedback Platform</h1>
        <nav>
          <button onClick={() => setActiveView('upload')}>Upload Feedback</button>
          <button onClick={() => setActiveView('dashboard')}>View Dashboard</button>
        </nav>
      </header>
      <main>
        {activeView === 'upload' ? <UploadForm /> : <Dashboard />}
      </main>
    </div>
  );
}

export default App;