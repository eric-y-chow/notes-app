import React from 'react';
import './PianoKeyboard.css';

const PianoKeyboard = ({ note }) => {
  const detectedNoteName = note && note !== '—' ? note.slice(0, -1) : null;

  const octaves = [3, 4, 5]; // C3 to B5
  const chromaticNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  const allKeys = [];
  octaves.forEach(octave => {
    chromaticNotes.forEach(keyName => {
      allKeys.push({
        name: keyName,
        fullName: `${keyName}${octave}`,
        octave,
      });
    });
  });

  const isKeyHighlighted = (key) => {
    return key.name === detectedNoteName;
  };

  // Create a mapping for black key positions relative to white keys
  const blackKeyPositions = {
    'C#': 0.5,  // Between C and D
    'D#': 1.5,  // Between D and E
    'F#': 3.5,  // Between F and G
    'G#': 4.5,  // Between G and A
    'A#': 5.5   // Between A and B
  };

  return (
    <div className="piano-container" style={{ textAlign: 'center', width: '100%' }}>
      <h3 style={{ color: 'white', marginBottom: '20px', fontSize: '1.2rem' }}>
        Piano Keyboard
      </h3>
      
      <div className="piano">
        {allKeys.map((key, index) => {
          const isWhiteKey = !key.name.includes('#');
          
          let keyStyle;
          
          if (isWhiteKey) {
            // Calculate position for white keys
            const whiteKeyIndex = Math.floor(index / 12) * 7 + ['C', 'D', 'E', 'F', 'G', 'A', 'B'].indexOf(key.name);
            keyStyle = {
              left: `${whiteKeyIndex * 41}px`, // 40px width + 1px border
            };
          } else {
            // Calculate position for black keys
            const octaveIndex = Math.floor(index / 12);
            const basePosition = blackKeyPositions[key.name];
            const whiteKeyIndex = octaveIndex * 7 + basePosition;
            keyStyle = {
              left: `${whiteKeyIndex * 41 }px`, // Center the black key between white keys
            };
          }
          
          return (
            <div
              key={key.fullName}
              className={`key ${isWhiteKey ? 'white' : 'black'} ${isKeyHighlighted(key) ? 'highlight' : ''}`}
              style={keyStyle}
            >
              {isWhiteKey && <div className="key-label">{key.name}</div>}
              {!isWhiteKey && <div className="key-label black-key-label">{key.name}</div>}
            </div>
          );
        })}
      </div>
      
      {/* Current note display */}
      <div style={{
        textAlign: 'center',
        marginTop: '15px',
        color: 'white',
        fontSize: '14px'
      }}>
        Current Note: <strong style={{ 
          color: note && note !== '—' ? '#ffeb3b' : '#666',
          fontSize: '16px'
        }}>
          {note || '—'}
        </strong>
      </div>
    </div>
  );
};

export default PianoKeyboard;