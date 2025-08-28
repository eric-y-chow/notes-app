import React from 'react';
import NoteDetector from './components/NoteDetector'; // Import from the new location
import './App.css'; // Optional styling

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <NoteDetector />
      </header>
    </div>
  );
}

export default App;
