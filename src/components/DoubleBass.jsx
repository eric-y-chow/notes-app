import React from 'react';

const DoubleBass = ({ note }) => {
  // Standard double bass tuning and fingering positions
  const bassStrings = [
    { 
      note: 'E', 
      octave: 1, 
      openString: 'E1', 
      color: '#ff4444', 
      position: 30,
      fingerings: [
        { fret: 0, note: 'E1', finger: 'Open' },
        { fret: 1, note: 'F1', finger: '1' },
        { fret: 2, note: 'F#1', finger: '2' },
        { fret: 3, note: 'G1', finger: '3' },
        { fret: 4, note: 'G#1', finger: '4' },
        { fret: 5, note: 'A1', finger: '1' },
        { fret: 6, note: 'A#1', finger: '2' },
        { fret: 7, note: 'B1', finger: '3' },
        { fret: 8, note: 'C2', finger: '4' }
      ]
    },
    { 
      note: 'A', 
      octave: 1, 
      openString: 'A1', 
      color: '#44ff44', 
      position: 60,
      fingerings: [
        { fret: 0, note: 'A1', finger: 'Open' },
        { fret: 1, note: 'A#1', finger: '1' },
        { fret: 2, note: 'B1', finger: '2' },
        { fret: 3, note: 'C2', finger: '3' },
        { fret: 4, note: 'C#2', finger: '4' },
        { fret: 5, note: 'D2', finger: '1' },
        { fret: 6, note: 'D#2', finger: '2' },
        { fret: 7, note: 'E2', finger: '3' },
        { fret: 8, note: 'F2', finger: '4' }
      ]
    },
    { 
      note: 'D', 
      octave: 2, 
      openString: 'D2', 
      color: '#4444ff', 
      position: 90,
      fingerings: [
        { fret: 0, note: 'D2', finger: 'Open' },
        { fret: 1, note: 'D#2', finger: '1' },
        { fret: 2, note: 'E2', finger: '2' },
        { fret: 3, note: 'F2', finger: '3' },
        { fret: 4, note: 'F#2', finger: '4' },
        { fret: 5, note: 'G2', finger: '1' },
        { fret: 6, note: 'G#2', finger: '2' },
        { fret: 7, note: 'A2', finger: '3' },
        { fret: 8, note: 'A#2', finger: '4' }
      ]
    },
    { 
      note: 'G', 
      octave: 2, 
      openString: 'G2', 
      color: '#ffff44', 
      position: 120,
      fingerings: [
        { fret: 0, note: 'G2', finger: 'Open' },
        { fret: 1, note: 'G#2', finger: '1' },
        { fret: 2, note: 'A2', finger: '2' },
        { fret: 3, note: 'A#2', finger: '3' },
        { fret: 4, note: 'B2', finger: '4' },
        { fret: 5, note: 'C3', finger: '1' },
        { fret: 6, note: 'C#3', finger: '2' },
        { fret: 7, note: 'D3', finger: '3' },
        { fret: 8, note: 'D#3', finger: '4' }
      ]
    },
  ];

  // Extract note name for comparison
  const detectedNote = note && note !== '—' ? note : null;

  // Find which string and fret matches the detected note
  const findFingering = (detectedNote) => {
    if (!detectedNote) return null;
    
    for (let string of bassStrings) {
      for (let fingering of string.fingerings) {
        if (fingering.note === detectedNote) {
          return { 
            string: string, 
            fingering: fingering,
            stringIndex: bassStrings.indexOf(string)
          };
        }
      }
    }
    return null;
  };

  const currentFingering = findFingering(detectedNote);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      margin: '20px 0',
      padding: '20px',
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '15px',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      <h3 style={{ color: 'white', marginBottom: '20px', fontSize: '1.2rem' }}>
        Double Bass Fingerings
      </h3>
      
      <svg width="150" height="400" viewBox="0 0 150 400" style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}>
        {/* Neck background */}
        <rect 
          x="20" 
          y="50" 
          width="110" 
          height="300" 
          fill="url(#neckGradient)" 
          stroke="#8B4513" 
          strokeWidth="2"
          rx="8"
        />
        
        {/* Fret lines */}
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(fret => (
          <line
            key={fret}
            x1="25"
            y1={60 + fret * 32}
            x2="125"
            y2={60 + fret * 32}
            stroke="#666"
            strokeWidth={fret === 0 ? "4" : "2"}
            opacity="0.8"
          />
        ))}
        
        {/* Position markers */}
        {[3, 5, 7].map(fret => (
          <circle
            key={fret}
            cx="75"
            cy={76 + fret * 32}
            r="4"
            fill="#DDD"
            opacity="0.6"
          />
        ))}
        
        {/* Strings */}
        {bassStrings.map((string, stringIndex) => {
          const isStringActive = currentFingering && currentFingering.stringIndex === stringIndex;
          return (
            <line
              key={string.openString}
              x1={string.position}
              y1="55"
              x2={string.position}
              y2="345"
              stroke={isStringActive ? string.color : '#C0C0C0'}
              strokeWidth={isStringActive ? "4" : "3"}
              opacity={isStringActive ? 1 : 0.7}
              style={{
                filter: isStringActive ? `drop-shadow(0 0 8px ${string.color})` : 'none',
                transition: 'all 0.3s ease'
              }}
            />
          );
        })}
        
        {/* Fingering position indicator */}
        {currentFingering && (
          <>
            {/* Glowing background circle */}
            <circle
              cx={currentFingering.string.position}
              cy={76 + currentFingering.fingering.fret * 32}
              r="12"
              fill={currentFingering.string.color}
              opacity="0.3"
              style={{ filter: `blur(4px)` }}
            />
            {/* Main fingering circle */}
            <circle
              cx={currentFingering.string.position}
              cy={76 + currentFingering.fingering.fret * 32}
              r="8"
              fill={currentFingering.string.color}
              stroke="white"
              strokeWidth="2"
              style={{
                filter: `drop-shadow(0 0 8px ${currentFingering.string.color})`
              }}
            />
            {/* Finger number */}
            <text
              x={currentFingering.string.position}
              y={81 + currentFingering.fingering.fret * 32}
              textAnchor="middle"
              fill="white"
              fontSize="12"
              fontWeight="bold"
            >
              {currentFingering.fingering.finger === 'Open' ? '0' : currentFingering.fingering.finger}
            </text>
          </>
        )}
        
        {/* String labels at the top */}
        {bassStrings.map((string, index) => (
          <text
            key={`label-${index}`}
            x={string.position}
            y="40"
            textAnchor="middle"
            fill="white"
            fontSize="14"
            fontWeight="bold"
          >
            {string.openString}
          </text>
        ))}
        
        {/* Fret numbers on the side */}
        {[1, 2, 3, 4, 5, 6, 7, 8].map(fret => (
          <text
            key={`fret-${fret}`}
            x="10"
            y={81 + fret * 32}
            textAnchor="middle"
            fill="#CCC"
            fontSize="12"
            fontWeight="bold"
          >
            {fret}
          </text>
        ))}
        
        {/* Gradients */}
        <defs>
          <linearGradient id="neckGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8B4513" />
            <stop offset="50%" stopColor="#A0522D" />
            <stop offset="100%" stopColor="#8B4513" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Current fingering information */}
      <div style={{
        textAlign: 'center',
        marginTop: '15px',
        color: 'white',
        fontSize: '14px'
      }}>
        <div>
          Detected: <strong style={{ 
            color: note && note !== '—' ? '#ffeb3b' : '#666',
            fontSize: '16px'
          }}>
            {note || '—'}
          </strong>
        </div>
        
        {currentFingering && (
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#CCC' }}>
            String: <span style={{ color: currentFingering.string.color, fontWeight: 'bold' }}>
              {currentFingering.string.openString}
            </span> | 
            Finger: <strong>{currentFingering.fingering.finger}</strong> | 
            Fret: <strong>{currentFingering.fingering.fret}</strong>
          </div>
        )}
      </div>
      
      {/* Tuning reference */}
      <div style={{
        textAlign: 'center',
        marginTop: '10px',
        fontSize: '11px',
        color: '#999',
        opacity: 0.8
      }}>
        Standard Tuning: E1 - A1 - D2 - G2
      </div>
    </div>
  );
};

export default DoubleBass;