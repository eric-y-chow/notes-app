import React, { useState } from 'react';
import NoteDetector from './components/NoteDetector';
import VocalEffectsProcessor from './components/VocalEffectsProcessor';
import './App.css'; // Optional styling

function App() {
  const [activeComponent, setActiveComponent] = useState('noteDetector'); // Default to NoteDetector

  const renderActiveComponent = () => {
    switch (activeComponent) {
      case 'noteDetector':
        return <NoteDetector />;
      case 'vocalEffects':
        return <VocalEffectsProcessor />;
      default:
        return <NoteDetector />;
    }
  };

  return (
    <div className="App">
      {/* Navigation Header */}
      <nav className="app-navigation">
        <div className="nav-container">
          <h1 className="app-title">Audio Toolkit</h1>
          <div className="nav-buttons">
            <button
              onClick={() => setActiveComponent('noteDetector')}
              className={`nav-button ${activeComponent === 'noteDetector' ? 'active' : ''}`}
            >
              🎵 Note Detector
            </button>
            <button
              onClick={() => setActiveComponent('vocalEffects')}
              className={`nav-button ${activeComponent === 'vocalEffects' ? 'active' : ''}`}
            >
              🎤 Vocal Effects
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="app-main">
        {renderActiveComponent()}
      </main>
    </div>
  );
}

export default App;