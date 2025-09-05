import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Settings, Play, Square } from 'lucide-react';
import * as Tone from 'tone';

const VocalEffectsProcessor = () => {
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [micPermission, setMicPermission] = useState(null);
  const [effects, setEffects] = useState({
    reverb: { enabled: false, roomSize: 0.5, wetness: 0.3 },
    chorus: { enabled: false, frequency: 1.5, depth: 0.5, wetness: 0.3 },
    autotune: { enabled: false, baseFrequency: 440, correction: 0.8 },
    harmony: { enabled: false, interval: 7, mix: 0.4 }, // 7 = perfect fifth
    pitch: { enabled: false, shift: 0 }, // semitones
    distortion: { enabled: false, amount: 0.4 },
    delay: { enabled: false, time: 0.25, feedback: 0.3, mix: 0.2 }
  });

  // Audio processing refs
  const micRef = useRef(null);
  const effectsChainRef = useRef({});
  const outputRef = useRef(null);
  const analyserRef = useRef(null);
  const pitchShifterRef = useRef(null);
  const frequencyDataRef = useRef(null);

  // Initialize audio context and effects
  const initializeAudio = useCallback(async () => {
    try {
      await Tone.start();
      
      // Create microphone input
      micRef.current = new Tone.UserMedia();
      
      // Create effects
      effectsChainRef.current = {
        reverb: new Tone.Reverb({
          roomSize: effects.reverb.roomSize,
          wet: effects.reverb.wetness
        }),
        chorus: new Tone.Chorus({
          frequency: effects.chorus.frequency,
          depth: effects.chorus.depth,
          wet: effects.chorus.wetness
        }),
        pitchShift: new Tone.PitchShift({
          pitch: effects.pitch.shift
        }),
        distortion: new Tone.Distortion({
          distortion: effects.distortion.amount,
          wet: effects.distortion.enabled ? 1 : 0
        }),
        delay: new Tone.FeedbackDelay({
          delayTime: effects.delay.time,
          feedback: effects.delay.feedback,
          wet: effects.delay.mix
        }),
        filter: new Tone.Filter(800, 'highpass'),
        compressor: new Tone.Compressor(-30, 3)
      };

      // Create analyzer for visualization
      analyserRef.current = new Tone.Analyser('fft', 256);
      frequencyDataRef.current = new Float32Array(256);

      // Create output gain
      outputRef.current = new Tone.Gain(1);

      // Connect initial chain (dry signal)
      micRef.current.connect(effectsChainRef.current.compressor);
      effectsChainRef.current.compressor.connect(analyserRef.current);
      analyserRef.current.connect(outputRef.current);
      outputRef.current.toDestination();

      return true;
    } catch (error) {
      console.error('Audio initialization failed:', error);
      return false;
    }
  }, []);

  // Update effects chain based on current settings
  const updateEffectsChain = useCallback(() => {
    if (!micRef.current || !effectsChainRef.current || !outputRef.current) return;

    try {
      // Disconnect everything
      micRef.current.disconnect();
      Object.values(effectsChainRef.current).forEach(effect => effect.disconnect());
      analyserRef.current?.disconnect();
      outputRef.current.disconnect();

      // Rebuild chain based on enabled effects
      let currentNode = micRef.current;
      
      // Always start with compressor for clean signal
      currentNode.connect(effectsChainRef.current.compressor);
      currentNode = effectsChainRef.current.compressor;

      // Add pitch shift if enabled
      if (effects.pitch.enabled && effects.pitch.shift !== 0) {
        effectsChainRef.current.pitchShift.pitch = effects.pitch.shift;
        currentNode.connect(effectsChainRef.current.pitchShift);
        currentNode = effectsChainRef.current.pitchShift;
      }

      // Add distortion if enabled
      if (effects.distortion.enabled) {
        effectsChainRef.current.distortion.wet.value = 1;
        effectsChainRef.current.distortion.distortion = effects.distortion.amount;
        currentNode.connect(effectsChainRef.current.distortion);
        currentNode = effectsChainRef.current.distortion;
      } else {
        effectsChainRef.current.distortion.wet.value = 0;
      }

      // Add chorus if enabled
      if (effects.chorus.enabled) {
        effectsChainRef.current.chorus.wet.value = effects.chorus.wetness;
        effectsChainRef.current.chorus.frequency.value = effects.chorus.frequency;
        effectsChainRef.current.chorus.depth = effects.chorus.depth;
        currentNode.connect(effectsChainRef.current.chorus);
        currentNode = effectsChainRef.current.chorus;
      } else {
        effectsChainRef.current.chorus.wet.value = 0;
      }

      // Add reverb if enabled
      if (effects.reverb.enabled) {
        effectsChainRef.current.reverb.wet.value = effects.reverb.wetness;
        currentNode.connect(effectsChainRef.current.reverb);
        currentNode = effectsChainRef.current.reverb;
      } else {
        effectsChainRef.current.reverb.wet.value = 0;
      }

      // Add delay if enabled
      if (effects.delay.enabled) {
        effectsChainRef.current.delay.wet.value = effects.delay.mix;
        effectsChainRef.current.delay.delayTime.value = effects.delay.time;
        effectsChainRef.current.delay.feedback.value = effects.delay.feedback;
        currentNode.connect(effectsChainRef.current.delay);
        currentNode = effectsChainRef.current.delay;
      } else {
        effectsChainRef.current.delay.wet.value = 0;
      }

      // Connect to analyzer and output
      currentNode.connect(analyserRef.current);
      analyserRef.current.connect(outputRef.current);
      
      // Control output volume
      outputRef.current.gain.value = isMuted ? 0 : 1;
      outputRef.current.toDestination();

    } catch (error) {
      console.error('Error updating effects chain:', error);
    }
  }, [effects, isMuted]);

  // Start/stop processing
  const toggleProcessing = async () => {
    if (!isActive) {
      try {
        const initialized = await initializeAudio();
        if (!initialized) return;

        await micRef.current.open();
        setMicPermission(true);
        updateEffectsChain();
        setIsActive(true);
      } catch (error) {
        console.error('Failed to start processing:', error);
        setMicPermission(false);
      }
    } else {
      try {
        if (micRef.current) {
          micRef.current.close();
        }
        setIsActive(false);
      } catch (error) {
        console.error('Error stopping processing:', error);
      }
    }
  };

  // Update effects when settings change
  useEffect(() => {
    if (isActive) {
      updateEffectsChain();
    }
  }, [effects, isActive, updateEffectsChain]);

  const updateEffect = (effectName, param, value) => {
    setEffects(prev => ({
      ...prev,
      [effectName]: {
        ...prev[effectName],
        [param]: value
      }
    }));
  };

  const toggleEffect = (effectName) => {
    setEffects(prev => ({
      ...prev,
      [effectName]: {
        ...prev[effectName],
        enabled: !prev[effectName].enabled
      }
    }));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Vocal Effects Processor
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-3 rounded-full transition-colors ${
                isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <button
              onClick={toggleProcessing}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                isActive 
                  ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/30' 
                  : 'bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/30'
              }`}
            >
              {isActive ? (
                <>
                  <Square size={16} className="inline mr-2" />
                  Stop Processing
                </>
              ) : (
                <>
                  <Play size={16} className="inline mr-2" />
                  Start Processing
                </>
              )}
            </button>
          </div>
        </div>

        {/* Status */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {isActive ? <Mic className="text-green-400" /> : <MicOff className="text-gray-500" />}
              <span className="text-sm">
                {isActive ? 'Processing Active' : 'Stopped'}
              </span>
            </div>
            {micPermission === false && (
              <div className="text-red-400 text-sm">
                Microphone access denied. Please allow microphone access and try again.
              </div>
            )}
          </div>
        </div>

        {/* Effects Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Pitch Shift */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Pitch Shift</h3>
              <button
                onClick={() => toggleEffect('pitch')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  effects.pitch.enabled ? 'bg-purple-600 text-white' : 'bg-gray-600 text-gray-300'
                }`}
              >
                {effects.pitch.enabled ? 'ON' : 'OFF'}
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Pitch (+/- semitones): {effects.pitch.shift}
                </label>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="1"
                  value={effects.pitch.shift}
                  onChange={(e) => updateEffect('pitch', 'shift', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Harmony */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Harmony</h3>
              <button
                onClick={() => toggleEffect('harmony')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  effects.harmony.enabled ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
                }`}
              >
                {effects.harmony.enabled ? 'ON' : 'OFF'}
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Harmony Type</label>
                <select
                  value={effects.harmony.type}
                  onChange={(e) => updateEffect('harmony', 'type', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800/60 text-white rounded-lg border border-gray-600/50 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-400/20 backdrop-blur-sm transition-all duration-200"
                >
                  <option value="thirds">Major Thirds (3rd, 5th, 8ve)</option>
                  <option value="fifths">Perfect Fifths (5th, 8ve, 12th)</option>
                  <option value="octaves">Octaves (8ve, 15ma, 22nd)</option>
                  <option value="custom">Custom Intervals</option>
                </select>
              </div>
              
              {effects.harmony.type === 'custom' && (
                <>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Voice 1: +{effects.harmony.voice1} semitones
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="24"
                      step="1"
                      value={effects.harmony.voice1}
                      onChange={(e) => updateEffect('harmony', 'voice1', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Voice 2: +{effects.harmony.voice2} semitones
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="24"
                      step="1"
                      value={effects.harmony.voice2}
                      onChange={(e) => updateEffect('harmony', 'voice2', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Voice 3: +{effects.harmony.voice3} semitones
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="24"
                      step="1"
                      value={effects.harmony.voice3}
                      onChange={(e) => updateEffect('harmony', 'voice3', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </>
              )}
              
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Harmony Mix: {(effects.harmony.mix * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={effects.harmony.mix}
                  onChange={(e) => updateEffect('harmony', 'mix', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Reverb */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Reverb</h3>
              <button
                onClick={() => toggleEffect('reverb')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  effects.reverb.enabled ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300'
                }`}
              >
                {effects.reverb.enabled ? 'ON' : 'OFF'}
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Room Size: {(effects.reverb.roomSize * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={effects.reverb.roomSize}
                  onChange={(e) => updateEffect('reverb', 'roomSize', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Mix: {(effects.reverb.wetness * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={effects.reverb.wetness}
                  onChange={(e) => updateEffect('reverb', 'wetness', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Chorus */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Chorus</h3>
              <button
                onClick={() => toggleEffect('chorus')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  effects.chorus.enabled ? 'bg-cyan-600 text-white' : 'bg-gray-600 text-gray-300'
                }`}
              >
                {effects.chorus.enabled ? 'ON' : 'OFF'}
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Rate: {effects.chorus.frequency.toFixed(1)} Hz
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={effects.chorus.frequency}
                  onChange={(e) => updateEffect('chorus', 'frequency', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Depth: {(effects.chorus.depth * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={effects.chorus.depth}
                  onChange={(e) => updateEffect('chorus', 'depth', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Mix: {(effects.chorus.wetness * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={effects.chorus.wetness}
                  onChange={(e) => updateEffect('chorus', 'wetness', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Distortion */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Distortion</h3>
              <button
                onClick={() => toggleEffect('distortion')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  effects.distortion.enabled ? 'bg-red-600 text-white' : 'bg-gray-600 text-gray-300'
                }`}
              >
                {effects.distortion.enabled ? 'ON' : 'OFF'}
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Drive: {(effects.distortion.amount * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={effects.distortion.amount}
                  onChange={(e) => updateEffect('distortion', 'amount', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Delay */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Delay</h3>
              <button
                onClick={() => toggleEffect('delay')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  effects.delay.enabled ? 'bg-yellow-600 text-white' : 'bg-gray-600 text-gray-300'
                }`}
              >
                {effects.delay.enabled ? 'ON' : 'OFF'}
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Time: {(effects.delay.time * 1000).toFixed(0)}ms
                </label>
                <input
                  type="range"
                  min="0.05"
                  max="1"
                  step="0.05"
                  value={effects.delay.time}
                  onChange={(e) => updateEffect('delay', 'time', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Feedback: {(effects.delay.feedback * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="0.9"
                  step="0.1"
                  value={effects.delay.feedback}
                  onChange={(e) => updateEffect('delay', 'feedback', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Mix: {(effects.delay.mix * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={effects.delay.mix}
                  onChange={(e) => updateEffect('delay', 'mix', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Master Controls */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Master</h3>
            <div className="space-y-4">
              <button
                onClick={() => {
                  setEffects({
                    reverb: { enabled: false, roomSize: 0.5, wetness: 0.3 },
                    chorus: { enabled: false, frequency: 1.5, depth: 0.5, wetness: 0.3 },
                    autotune: { enabled: false, baseFrequency: 440, correction: 0.8 },
                    harmony: { 
                      enabled: false, 
                      type: 'thirds', 
                      mix: 0.4,
                      voice1: 4,
                      voice2: 7,
                      voice3: 12
                    },
                    pitch: { enabled: false, shift: 0 },
                    distortion: { enabled: false, amount: 0.4 },
                    delay: { enabled: false, time: 0.25, feedback: 0.3, mix: 0.2 }
                  });
                }}
                className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
              >
                Reset All Effects
              </button>
              
              <div className="pt-2 border-t border-gray-700">
                <p className="text-sm text-gray-400">
                  💡 Click "Start Processing" and allow microphone access to begin. 
                  Toggle effects on/off and adjust parameters in real-time!
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default VocalEffectsProcessor;