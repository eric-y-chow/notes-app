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
  const match = noteString.match(/^([A-G]#?)(-?\d+)$/);
  if (!match) return null;
  
  const [, noteName, octaveStr] = match;
  const octave = parseInt(octaveStr);
  const noteIndex = noteNames.indexOf(noteName);
  
  if (noteIndex === -1) return null;
  
  return (octave + 1) * 12 + noteIndex;
};

const convertNoteToSharp = (noteNumber) => {
  if (noteNumber === null || typeof noteNumber !== 'number') return null;
  
  const sharpNotes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const octave = Math.floor(noteNumber / 12) - 1;
  const noteIndex = ((noteNumber % 12) + 12) % 12;

  const noteName = sharpNotes[noteIndex];
  return `${noteName}${octave}`;
};

// Bass clef practice range: E2 (40) to C4 (60)
const BASS_CLEF_RANGE = { min: 40, max: 60 };

const getRandomBassNote = () => {
  const midi = Math.floor(
    Math.random() * (BASS_CLEF_RANGE.max - BASS_CLEF_RANGE.min + 1)
  ) + BASS_CLEF_RANGE.min;
  return convertNoteToSharp(midi);
};

const NoteDetectorGame = () => {
  const [isListening, setIsListening] = useState(false);
  const [detectedNote, setDetectedNote] = useState(null);
  const [targetNote, setTargetNote] = useState(null);
  const [score, setScore] = useState(0);
  const [error, setError] = useState(null);

  const pitchNote = usePitchDetection(isListening);

  // Update detected note from pitch detection
  useEffect(() => {
    if (pitchNote !== null) {
      setDetectedNote(pitchNote);
    }
  }, [pitchNote]);

  // Check if detected matches target
  useEffect(() => {
    if (!detectedNote || !targetNote) return;

    const detectedMidi = noteStringToMidiNumber(detectedNote);
    const targetMidi = noteStringToMidiNumber(targetNote);

    if (detectedMidi === targetMidi) {
      setScore((prev) => prev + 1);
      setTargetNote(getRandomBassNote());
    }
  }, [detectedNote, targetNote]);

  const handleStart = async () => {
    try {
      setError(null);
      setIsListening(true);
      setDetectedNote(null);
      setTargetNote(getRandomBassNote());
      setScore(0);
    } catch (err) {
      setError('Failed to start microphone. Please check permissions.');
      console.error('Error starting microphone:', err);
    }
  };

  const handleStop = () => {
    setIsListening(false);
  };

  return (
    <div className="note-detector">
      <h1>Bass Clef Note Game 🎶</h1>

      {error && (
        <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>
          {error}
        </div>
      )}

      <div className="staff-and-note-container">
        <GrandStaff note={targetNote || '—'} clef="bass" />
        <p>
          🎯 Target Note: <strong>{targetNote || '—'}</strong>
        </p>
        <p>
          🎤 Detected Note: <strong>{detectedNote || '—'}</strong>
        </p>
      </div>

      <div className="score">
        ⭐ Score: {score}
      </div>

      <div className="instruments-container" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        gap: '40px',
        flexWrap: 'wrap',
        margin: '30px 0'
      }}>
        <DoubleBass note={detectedNote || '—'} />
        <div style={{ minWidth: '300px' }}>
          <PianoKeyboard note={detectedNote || '—'} />
        </div>
      </div>

      <div className="controls">
        <button 
          onClick={handleStart} 
          disabled={isListening}
          className={isListening ? 'disabled' : 'start-btn'}
        >
          {isListening ? 'Listening...' : 'Start Game'}
        </button>
        
        <button 
          onClick={handleStop} 
          disabled={!isListening}
          className={!isListening ? 'disabled' : 'stop-btn'}
        >
          Stop Game
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

export default NoteDetectorGame;
