import React, { useState, useEffect } from 'react';
import { usePitchDetection } from './usePitchDetection';
import GrandStaff from './GrandStaff';
import PianoKeyboard from './PianoKeyboard';
import DoubleBass from './DoubleBass';
import './NoteDetector.css';

// Convert note string to MIDI note number
const noteStringToMidiNumber = (noteString) => {
  if (!noteString || typeof noteString !== 'string') return null;
  
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  // Parse note string (e.g., "A4", "C#3")
  const match = noteString.match(/^([A-G]#?)(-?\d+)$/);
  if (!match) return null;
  
  const [, noteName, octaveStr] = match;
  const octave = parseInt(octaveStr);
  const noteIndex = noteNames.indexOf(noteName);
  
  if (noteIndex === -1) return null;
  
  // MIDI note number formula: (octave + 1) * 12 + noteIndex
  return (octave + 1) * 12 + noteIndex;
};

const convertNoteToSharp = (noteNumber) => {
  if (noteNumber === null || typeof noteNumber !== 'number') return null;
  
  const sharpNotes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const octave = Math.floor(noteNumber / 12) - 1; // Adjust for MIDI octave offset
  const noteIndex = ((noteNumber % 12) + 12) % 12;

  const noteName = sharpNotes[noteIndex];
  
  return `${noteName}${octave}`;
};

const NoteDetector = () => {
  const [isListening, setIsListening] = useState(false);
  const [displayedNote, setDisplayedNote] = useState(null);
  const [error, setError] = useState(null);
  
  const detectedNote = usePitchDetection(isListening);

  useEffect(() => {
    if (detectedNote !== null) {
      // Since usePitchDetection returns a string, we can use it directly
      // or convert it if needed for other components
      setDisplayedNote(detectedNote);
      setError(null);
    }
  }, [detectedNote]);

  const handleStart = async () => {
    try {
      setError(null);
      setIsListening(true);
      setDisplayedNote(null);
    } catch (err) {
      setError('Failed to start microphone. Please check permissions.');
      console.error('Error starting microphone:', err);
    }
  };

  const handleStop = () => {
    setIsListening(false);
    setDisplayedNote(null);
  };

  const handleClear = () => {
    setDisplayedNote(null);
  };

  return (
    <div className="note-detector">
      <h1>Musical Note Detector</h1>
      
      {error && (
        <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>
          {error}
        </div>
      )}
      
      <div className="staff-and-note-container">
        <GrandStaff note={displayedNote || '—'} />
        <p className="detected-note-display">
          Detected Note: <strong>{displayedNote || '—'}</strong>
        </p>
      </div>
      
      {/* Instrument visualizations container */}
      <div className="instruments-container" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        gap: '40px',
        flexWrap: 'wrap',
        margin: '30px 0'
      }}>
        <DoubleBass note={displayedNote || '—'} />
        <div style={{ minWidth: '300px' }}>
          <PianoKeyboard note={displayedNote || '—'} />
        </div>
      </div>
      
      <div className="instructions">
        <p>Play a note on an instrument or sing into your microphone.</p>
        <p><small>Make sure to allow microphone access when prompted.</small></p>
      </div>
      
      <div className="controls">
        <button 
          onClick={handleStart} 
          disabled={isListening}
          className={isListening ? 'disabled' : 'start-btn'}
        >
          {isListening ? 'Listening...' : 'Start Detection'}
        </button>
        
        <button 
          onClick={handleStop} 
          disabled={!isListening}
          className={!isListening ? 'disabled' : 'stop-btn'}
        >
          Stop Detection
        </button>
        
        <button 
          onClick={handleClear}
          className="clear-btn"
        >
          Clear Note
        </button>
      </div>
      
      <div className="status">
        Status: <span className={isListening ? 'listening' : 'stopped'}>
          {isListening ? '🎵 Listening' : '⏸️ Stopped'}
        </span>
      </div>
    </div>
  );
};

export default NoteDetector;