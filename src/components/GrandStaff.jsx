import React, { useEffect, useRef } from 'react';
import VexFlow from 'vexflow';

// More compatible VexFlow destructuring
const Renderer = VexFlow.Renderer || VexFlow.Flow.Renderer;
const Stave = VexFlow.Stave || VexFlow.Flow.Stave;
const StaveNote = VexFlow.StaveNote || VexFlow.Flow.StaveNote;
const Formatter = VexFlow.Formatter || VexFlow.Flow.Formatter;
const Voice = VexFlow.Voice || VexFlow.Flow.Voice;
const Accidental = VexFlow.Accidental || VexFlow.Flow.Accidental;
const StaveConnector = VexFlow.StaveConnector || VexFlow.Flow.StaveConnector;

// This function transposes a note string by a given number of semitones
const transposeNote = (note, semitones) => {
  const noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  
  // Handle both sharp and flat notes
  let pitchWithoutOctave = note.slice(0, -1);
  const octave = parseInt(note.slice(-1), 10);
  
  // Convert flats to sharps for calculation
  const flatToSharp = {
    'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#'
  };
  
  if (flatToSharp[pitchWithoutOctave]) {
    pitchWithoutOctave = flatToSharp[pitchWithoutOctave];
  }
  
  const noteIndex = noteStrings.indexOf(pitchWithoutOctave);
  
  if (noteIndex === -1 || isNaN(octave)) return note; // Return original if invalid note

  const totalSemitones = (octave + 1) * 12 + noteIndex + semitones;
  const newNoteIndex = ((totalSemitones % 12) + 12) % 12;
  const newOctave = Math.floor(totalSemitones / 12) - 1;

  return `${noteStrings[newNoteIndex]}${newOctave}`;
};

const GrandStaff = ({ note }) => {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  
  const staffColor = "white";
  const noteColor = "white";

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous content
    containerRef.current.innerHTML = '';

    try {
      // Create new renderer each time to avoid state issues
      const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG);
      renderer.resize(400, 200);
      const context = renderer.getContext();

      // Set staff styling
      context.setStrokeStyle(staffColor);
      context.setFillStyle(staffColor);

      // Create staves
      const staveTreble = new Stave(10, 40, 380);
      staveTreble.addClef("treble").addTimeSignature("4/4");
      staveTreble.setContext(context).draw();

      const staveBass = new Stave(10, 120, 380);
      staveBass.addClef("bass").addTimeSignature("4/4");
      staveBass.setContext(context).draw();

      // Connect staves
      const connector = new StaveConnector(staveTreble, staveBass);
      connector.setType(StaveConnector.type.BRACE);
      connector.setContext(context).draw();

      const singleBar = new StaveConnector(staveTreble, staveBass);
      singleBar.setType(StaveConnector.type.SINGLE);
      singleBar.setContext(context).draw();

      // Handle note display
      if (!note || note === '—' || !note.match(/^[A-G][#b]?\d+$/)) {
        // Display rest notes on both staves
        const trebleVoice = new Voice({ num_beats: 1, beat_value: 4 }).setMode(Voice.Mode.SOFT);
        const bassVoice = new Voice({ num_beats: 1, beat_value: 4 }).setMode(Voice.Mode.SOFT);
        
        const trebleRest = new StaveNote({ clef: 'treble', keys: ['d/5'], duration: 'qr' });
        const bassRest = new StaveNote({ clef: 'bass', keys: ['d/3'], duration: 'qr' });
        
        trebleRest.setStyle({ fillStyle: noteColor, strokeStyle: noteColor });
        bassRest.setStyle({ fillStyle: noteColor, strokeStyle: noteColor });
        
        trebleVoice.addTickables([trebleRest]);
        bassVoice.addTickables([bassRest]);
        
        new Formatter().joinVoices([trebleVoice]).formatToStave([trebleVoice], staveTreble);
        new Formatter().joinVoices([bassVoice]).formatToStave([bassVoice], staveBass);
        
        trebleVoice.draw(context, staveTreble);
        bassVoice.draw(context, staveBass);
      } else {
        // Transpose note up an octave for better visibility
        const transposedNote = transposeNote(note, 12);
        
        let pitchWithoutOctave = transposedNote.slice(0, -1);
        const octave = parseInt(transposedNote.slice(-1), 10);
        
        // Determine which staff to use
        const clef = octave >= 4 ? 'treble' : 'bass';
        
        // Handle accidentals
        let accidental = null;
        let vexFlowNoteName = pitchWithoutOctave;
        
        if (pitchWithoutOctave.includes('#')) {
          accidental = '#';
          vexFlowNoteName = pitchWithoutOctave.replace('#', '');
        } else if (pitchWithoutOctave.includes('b')) {
          accidental = 'b';
          vexFlowNoteName = pitchWithoutOctave.replace('b', '');
        }
        
        const vexFlowKey = `${vexFlowNoteName.toLowerCase()}/${octave}`;

        // Create and style the note
        const staveNote = new StaveNote({ 
          clef, 
          keys: [vexFlowKey], 
          duration: 'q' 
        });
        
        staveNote.setStyle({ 
          fillStyle: noteColor, 
          strokeStyle: noteColor 
        });
        
        // Add accidental if present
        if (accidental) {
          staveNote.addModifier(new Accidental(accidental));
        }

        // Create voice and add note
        const voice = new Voice({ num_beats: 1, beat_value: 4 }).setMode(Voice.Mode.SOFT);
        voice.addTickables([staveNote]);
        
        // Format and draw on appropriate staff
        const targetStave = clef === 'treble' ? staveTreble : staveBass;
        new Formatter().joinVoices([voice]).formatToStave([voice], targetStave);
        voice.draw(context, targetStave);
      }
    } catch (error) {
      console.error('Error rendering staff:', error);
      // Fallback: display error message
      containerRef.current.innerHTML = `<p style="color: ${noteColor}">Staff rendering error</p>`;
    }
  }, [note, staffColor, noteColor]);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        backgroundColor: 'transparent',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: '8px',
        padding: '10px'
      }} 
    />
  );
};

export default GrandStaff;