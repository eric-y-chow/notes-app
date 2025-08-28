import { useState, useEffect, useRef } from 'react';

export const usePitchDetection = (isListening) => {
  const [note, setNote] = useState(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const rafIdRef = useRef(null);
  const streamRef = useRef(null); // Add stream ref for cleanup

  useEffect(() => {
    const cleanup = () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      
      setNote(null);
    };

    if (!isListening) {
      cleanup();
      return;
    }

    if (!navigator.mediaDevices || !window.AudioContext) {
      console.error('Web Audio API or MediaDevices not supported.');
      return;
    }

    const startMicrophone = async () => {
      try {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: false,
            autoGainControl: false,
            noiseSuppression: false,
            sampleRate: 44100
          } 
        });
        
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
          sampleRate: 44100
        });
        
        // Resume audio context if suspended
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }
        
        const source = audioContextRef.current.createMediaStreamSource(streamRef.current);

        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 4096; // Increased for better frequency resolution
        analyserRef.current.smoothingTimeConstant = 0.8;
        source.connect(analyserRef.current);

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const detectPitch = () => {
          if (!analyserRef.current || !audioContextRef.current || !isListening) return;

          analyserRef.current.getByteFrequencyData(dataArray);
          
          // Find the frequency with the highest amplitude
          let maxAmplitude = 0;
          let maxIndex = 0;
          
          // Look for peaks in the lower frequency range (80Hz - 2000Hz for human voice)
          const minFreq = 80;
          const maxFreq = 2000;
          const sampleRate = audioContextRef.current.sampleRate;
          const minIndex = Math.floor(minFreq * bufferLength / (sampleRate / 2));
          const maxIndexLimit = Math.floor(maxFreq * bufferLength / (sampleRate / 2));
          
          for (let i = minIndex; i < maxIndexLimit; i++) {
            if (dataArray[i] > maxAmplitude && dataArray[i] > 50) { // Minimum threshold
              maxAmplitude = dataArray[i];
              maxIndex = i;
            }
          }

          if (maxAmplitude > 50) { // Only detect if amplitude is significant
            const frequency = maxIndex * sampleRate / (2 * bufferLength);
            const noteName = frequencyToNote(frequency);
            setNote(noteName);
          } else {
            setNote(null);
          }

          rafIdRef.current = requestAnimationFrame(detectPitch);
        };

        detectPitch();
      } catch (err) {
        console.error('Error accessing the microphone:', err);
        setNote(null);
      }
    };

    startMicrophone();

    return cleanup;
  }, [isListening]);

  return note;
};

const frequencyToNote = (frequency) => {
  if (frequency <= 0) return null;
  
  const noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const A4 = 440;
  const A4_NOTE_NUMBER = 57;
  
  const noteNumber = 12 * Math.log2(frequency / A4) + A4_NOTE_NUMBER;
  const roundedNoteNumber = Math.round(noteNumber);
  
  // Ensure we're in a reasonable octave range
  if (roundedNoteNumber < 0 || roundedNoteNumber > 120) return null;
  
  const noteIndex = ((roundedNoteNumber % 12) + 12) % 12;
  const octave = Math.floor(roundedNoteNumber / 12);
  
  return `${noteStrings[noteIndex]}${octave}`;
};