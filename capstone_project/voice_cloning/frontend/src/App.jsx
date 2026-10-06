import React, { useState, useEffect, useRef } from 'react';
import { Mic, Volume2, Sparkles, RefreshCw, Play, Square, Zap, Info } from 'lucide-react';

export default function App() {
  const [voices, setVoices] = useState([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lastAudioUrl, setLastAudioUrl] = useState(null);
  const [latency, setLatency] = useState(null);
  const [error, setError] = useState(null);

  // References
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const currentAudioPlayerRef = useRef(null);
  const isHoldingSpaceRef = useRef(false);
  const isRecordingRef = useRef(false);

  // Keep ref in sync with state
  isRecordingRef.current = isRecording;

  // Load voices on mount
  useEffect(() => {
    fetch('/api/voices')
      .then((res) => res.json())
      .then((data) => {
        if (data.voices && data.voices.length > 0) {
          setVoices(data.voices);
          // Default to George or first voice
          const defaultVoice = data.voices.find((v) => v.name.toLowerCase().includes('george')) || data.voices[0];
          setSelectedVoiceId(defaultVoice.voice_id);
        }
      })
      .catch((err) => {
        console.error('Failed to load voices:', err);
        setError('Could not connect to backend. Please ensure the Python server is running.');
      });
  }, []);

  // Start recording
  const startRecording = async () => {
    if (isRecordingRef.current || isConverting) return;
    setError(null);

    // Stop currently playing audio if any
    if (currentAudioPlayerRef.current) {
      currentAudioPlayerRef.current.pause();
      setIsPlaying(false);
    }

    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      let options = {};
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options = { mimeType: 'audio/webm;codecs=opus' };
      } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        options = { mimeType: 'audio/ogg;codecs=opus' };
      }

      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.start(50);
      setIsRecording(true);
    } catch (err) {
      console.error('Mic error:', err);
      setError('Microphone access denied. Please allow microphone permissions in your browser.');
    }
  };

  // Stop recording & convert immediately
  const stopRecordingAndConvert = () => {
    if (!mediaRecorderRef.current || !isRecordingRef.current) return;
    setIsRecording(false);

    const recorder = mediaRecorderRef.current;

    recorder.onstop = async () => {
      // Clean up microphone stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const mimeType = recorder.mimeType || 'audio/webm';
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

      if (audioBlob.size < 1000) {
        setError('Audio was too short. Hold the spacebar a bit longer while speaking!');
        return;
      }

      // Send to backend immediately
      await sendToElevenLabs(audioBlob);
    };

    recorder.stop();
  };

  // Send to backend /api/convert
  const sendToElevenLabs = async (audioBlob) => {
    try {
      setIsConverting(true);
      setError(null);

      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice.webm');
      formData.append('voice_id', selectedVoiceId);

      const res = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Conversion failed');
      }

      const latencyMs = res.headers.get('X-Latency-Ms') || '450';
      setLatency(latencyMs);

      const blob = await res.blob();
      const audioUrl = URL.createObjectURL(blob);
      setLastAudioUrl(audioUrl);

      // Play instantly!
      playAudio(audioUrl);
    } catch (err) {
      console.error('Conversion error:', err);
      setError(`ElevenLabs API Error: ${err.message}`);
    } finally {
      setIsConverting(false);
    }
  };

  // Play audio helper
  const playAudio = (url) => {
    if (currentAudioPlayerRef.current) {
      currentAudioPlayerRef.current.pause();
    }
    const audio = new Audio(url);
    currentAudioPlayerRef.current = audio;
    setIsPlaying(true);

    audio.play().catch((e) => console.log('Autoplay prevented:', e));

    audio.onended = () => {
      setIsPlaying(false);
    };
    audio.onerror = () => {
      setIsPlaying(false);
    };
  };

  // Keyboard Event Listeners for Spacebar Push-to-Talk
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only trigger on Spacebar
      if (e.code === 'Space') {
        // Prevent default browser scrolling
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
          e.preventDefault();
        }
        if (!isHoldingSpaceRef.current && !isConverting) {
          isHoldingSpaceRef.current = true;
          startRecording();
        }
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
          e.preventDefault();
        }
        if (isHoldingSpaceRef.current) {
          isHoldingSpaceRef.current = false;
          stopRecordingAndConvert();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedVoiceId, isConverting]);

  const selectedVoice = voices.find((v) => v.voice_id === selectedVoiceId);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col items-center justify-between p-4 sm:p-8 font-sans select-none">
      {/* Top Header */}
      <header className="w-full max-w-xl flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-400 p-[1px] shadow-lg shadow-violet-500/20">
            <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-violet-300 via-cyan-200 to-indigo-100 bg-clip-text text-transparent">
              EchoMorph Push-to-Talk
            </h1>
            <p className="text-xs text-slate-400">Instant Voice Cloning via ElevenLabs</p>
          </div>
        </div>

        {/* Target Voice Selector */}
        <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5 shadow-sm">
          <span className="text-xs text-slate-400 font-medium">Speak as:</span>
          <select
            value={selectedVoiceId}
            onChange={(e) => setSelectedVoiceId(e.target.value)}
            disabled={isRecording || isConverting}
            className="bg-transparent text-xs font-semibold text-cyan-300 focus:outline-none cursor-pointer"
          >
            {voices.map((v) => (
              <option key={v.voice_id} value={v.voice_id} className="bg-slate-900 text-slate-200">
                {v.name} {v.gender ? `(${v.gender})` : ''}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Center Interactive Orb */}
      <main className="w-full max-w-md flex flex-col items-center justify-center my-auto py-12 gap-8 text-center">
        {/* Glowing Orb Button */}
        <div className="relative flex items-center justify-center">
          {/* Outer Pulsing Waves when recording */}
          {isRecording && (
            <>
              <div className="absolute w-64 h-64 rounded-full bg-rose-500/20 animate-ping pointer-events-none" />
              <div className="absolute w-52 h-52 rounded-full bg-rose-500/30 animate-pulse pointer-events-none" />
            </>
          )}

          {/* Outer Pulsing Waves when playing */}
          {isPlaying && (
            <>
              <div className="absolute w-64 h-64 rounded-full bg-cyan-500/20 animate-ping pointer-events-none" />
              <div className="absolute w-52 h-52 rounded-full bg-cyan-500/30 animate-pulse pointer-events-none" />
            </>
          )}

          {/* Interactive Button */}
          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecordingAndConvert}
            onTouchStart={startRecording}
            onTouchEnd={stopRecordingAndConvert}
            disabled={isConverting}
            className={`relative w-44 h-44 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-2xl cursor-pointer ${
              isRecording
                ? 'scale-110 bg-gradient-to-tr from-rose-600 to-pink-500 shadow-rose-500/50'
                : isConverting
                ? 'bg-gradient-to-tr from-violet-700 to-indigo-800 shadow-violet-500/30 cursor-wait'
                : isPlaying
                ? 'scale-105 bg-gradient-to-tr from-cyan-600 to-teal-500 shadow-cyan-500/40'
                : 'bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 hover:scale-105 active:scale-95 shadow-violet-600/30'
            }`}
          >
            {isConverting ? (
              <RefreshCw className="w-14 h-14 text-white animate-spin" />
            ) : isRecording ? (
              <Square className="w-12 h-12 text-white fill-current animate-pulse" />
            ) : isPlaying ? (
              <Volume2 className="w-14 h-14 text-white animate-bounce" />
            ) : (
              <Mic className="w-14 h-14 text-white" />
            )}

            <span className="text-[11px] font-bold uppercase tracking-wider text-white/90 mt-2 font-mono">
              {isConverting
                ? 'Converting...'
                : isRecording
                ? 'Listening...'
                : isPlaying
                ? 'Playing...'
                : 'Hold To Speak'}
            </span>
          </button>
        </div>

        {/* Instructions & Status */}
        <div className="space-y-2">
          {isRecording ? (
            <div className="flex items-center justify-center gap-2 text-rose-400 font-semibold text-sm animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              Recording your voice... Release spacebar to convert!
            </div>
          ) : isConverting ? (
            <div className="flex items-center justify-center gap-2 text-violet-400 font-semibold text-sm animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
              ElevenLabs AI synthesizing target voice...
            </div>
          ) : isPlaying ? (
            <div className="flex items-center justify-center gap-2 text-cyan-400 font-semibold text-sm">
              <Volume2 className="w-4 h-4 text-cyan-300" />
              Playing in {selectedVoice?.name || 'cloned voice'}!
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium">
                <span className="px-2 py-0.5 rounded bg-violet-600 text-[10px] font-bold text-white uppercase tracking-wider">
                  SPACEBAR
                </span>
                <span>Hold spacebar to talk, release for instant voice</span>
              </div>
              <p className="text-[11px] text-slate-500">
                (or click and hold the button with your mouse)
              </p>
            </div>
          )}

          {/* Latency badge */}
          {latency && !isConverting && !isRecording && (
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                <Zap className="w-3 h-3 text-emerald-400" />
                Response Latency: {latency}ms
              </span>
            </div>
          )}
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs max-w-sm">
            {error}
          </div>
        )}

        {/* Replay Button if audio exists */}
        {lastAudioUrl && !isRecording && !isConverting && (
          <button
            onClick={() => playAudio(lastAudioUrl)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition"
          >
            <Play className="w-3.5 h-3.5 text-cyan-400 fill-current" />
            <span>Replay Last Output</span>
          </button>
        )}
      </main>

      {/* Minimal Footer */}
      <footer className="text-center text-xs text-slate-500 pb-2">
        <span>Powered by </span>
        <strong className="text-slate-400">ElevenLabs Speech-to-Speech API</strong>
        <span> • Fast, Instant, Push-to-Talk</span>
      </footer>
    </div>
  );
}
