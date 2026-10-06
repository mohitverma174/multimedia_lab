import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Upload, Sparkles, RefreshCw, Volume2, ArrowRight, Sliders, AlertCircle, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AudioRecorder } from '../utils/audioHelper';
import { convertSpeechToSpeech } from '../utils/api';
import AudioVisualizer from './AudioVisualizer';
import AudioPlayer from './AudioPlayer';
import VoiceSelector from './VoiceSelector';

export default function VoiceChanger({ voices, onRefreshVoices }) {
  // Input mode: 'record' or 'upload'
  const [inputMode, setInputMode] = useState('record');
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [recordedAudio, setRecordedAudio] = useState(null); // { blob, file, audioUrl }
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState(null);

  // Selected Target Voice
  const [selectedVoiceId, setSelectedVoiceId] = useState(voices[0]?.voice_id || '');
  useEffect(() => {
    if (!selectedVoiceId && voices.length > 0) {
      setSelectedVoiceId(voices[0].voice_id);
    }
  }, [voices, selectedVoiceId]);

  // Settings
  const [stability, setStability] = useState(0.5);
  const [similarityBoost, setSimilarityBoost] = useState(0.75);
  const [style, setStyle] = useState(0.0);
  const [removeBackgroundNoise, setRemoveBackgroundNoise] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultAudio, setResultAudio] = useState(null); // { audioUrl, latencyMs, filename }
  const [errorMessage, setErrorMessage] = useState(null);

  // Recorder ref
  const recorderRef = useRef(null);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Start recording
  const handleStartRecording = async () => {
    try {
      setErrorMessage(null);
      setResultAudio(null);
      const recorder = new AudioRecorder();
      recorderRef.current = recorder;
      await recorder.start();
      setIsRecording(true);
      setRecordDuration(0);

      timerRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error(err);
      setErrorMessage('Microphone access denied or not available. Please allow mic permissions.');
    }
  };

  // Stop recording
  const handleStopRecording = async () => {
    if (!recorderRef.current || !isRecording) return;
    clearInterval(timerRef.current);
    setIsRecording(false);

    const result = await recorderRef.current.stop();
    if (result) {
      setRecordedAudio(result);
    }
  };

  // Reset recording
  const handleResetInput = () => {
    if (recorderRef.current) recorderRef.current.cancel();
    clearInterval(timerRef.current);
    setIsRecording(false);
    setRecordedAudio(null);
    setUploadedFile(null);
    setUploadedAudioUrl(null);
    setResultAudio(null);
    setErrorMessage(null);
  };

  // Handle file upload
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setErrorMessage(null);
      setResultAudio(null);
      setUploadedFile(file);
      const url = URL.createObjectURL(file);
      setUploadedAudioUrl(url);
    }
  };

  // Convert voice (STS)
  const handleConvert = async () => {
    const audioFile = inputMode === 'record' ? recordedAudio?.file : uploadedFile;
    if (!audioFile) {
      setErrorMessage('Please record your voice or upload an audio file first.');
      return;
    }
    if (!selectedVoiceId) {
      setErrorMessage('Please select a target voice to transform into.');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage(null);

      const targetVoice = voices.find((v) => v.voice_id === selectedVoiceId);
      const targetName = targetVoice ? targetVoice.name : 'Target Voice';

      const formData = new FormData();
      formData.append('audio', audioFile);
      formData.append('voice_id', selectedVoiceId);
      formData.append('voice_name', targetName);
      formData.append('stability', stability);
      formData.append('similarity_boost', similarityBoost);
      formData.append('style', style);
      formData.append('remove_background_noise', removeBackgroundNoise);

      const res = await convertSpeechToSpeech(formData);
      setResultAudio(res);

      // Trigger celebrate confetti
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'Speech-to-Speech conversion failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const activeInputAudioUrl = inputMode === 'record' ? recordedAudio?.audioUrl : uploadedAudioUrl;
  const hasInputAudio = Boolean(activeInputAudioUrl);

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Introduction */}
      <div className="relative overflow-hidden rounded-3xl glass-panel p-6 sm:p-8 border border-violet-500/20 bg-gradient-to-r from-violet-950/40 via-slate-900/80 to-indigo-950/30">
        <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-semibold mb-3">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Instant Speech-to-Speech Engine</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Speak in your voice. <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">Hear it instantly transformed</span> into another.
          </h2>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            Record a short sentence through your microphone or upload any audio sample. ElevenLabs AI converts your pitch, emotion, and cadence into the target voice with near-zero latency.
          </p>
        </div>
      </div>

      {/* Main Grid: Input Step & Voice Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Voice Input (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="glass-panel rounded-2xl p-5 border border-slate-800">
            {/* Input Header & Mode Switch */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs">1</span>
                Your Voice Input
              </h3>
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                <button
                  onClick={() => { setInputMode('record'); handleResetInput(); }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition ${
                    inputMode === 'record' ? 'bg-violet-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" />
                  Record
                </button>
                <button
                  onClick={() => { setInputMode('upload'); handleResetInput(); }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition ${
                    inputMode === 'upload' ? 'bg-violet-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload
                </button>
              </div>
            </div>

            {/* Mode 1: Live Record */}
            {inputMode === 'record' && (
              <div className="flex flex-col items-center justify-center py-6 px-4 rounded-xl bg-slate-950/60 border border-slate-900 gap-4">
                {/* Visualizer */}
                <AudioVisualizer
                  analyser={recorderRef.current?.getAnalyser()}
                  isRecording={isRecording}
                  height={56}
                />

                {/* Status & Timer */}
                <div className="text-center">
                  {isRecording ? (
                    <div className="flex items-center gap-2 text-rose-400 text-sm font-semibold">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                      Recording... {formatTimer(recordDuration)}
                    </div>
                  ) : recordedAudio ? (
                    <div className="text-xs text-emerald-400 font-medium">
                      ✓ Audio captured successfully ({formatTimer(recordDuration)})
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400">
                      Click the microphone and speak for 3-10 seconds
                    </div>
                  )}
                </div>

                {/* Record Button */}
                <div className="flex items-center gap-3">
                  {!isRecording ? (
                    <button
                      onClick={handleStartRecording}
                      className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-violet-600/30 hover:scale-105 active:scale-95 transition-all"
                    >
                      <Mic className="w-4 h-4" />
                      {recordedAudio ? 'Record Again' : 'Start Recording'}
                    </button>
                  ) : (
                    <button
                      onClick={handleStopRecording}
                      className="flex items-center gap-2 px-6 py-3 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm shadow-lg shadow-rose-600/40 animate-pulse transition-all"
                    >
                      <Square className="w-4 h-4 fill-current" />
                      Stop Recording
                    </button>
                  )}

                  {recordedAudio && (
                    <button
                      onClick={handleResetInput}
                      className="p-3 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      title="Reset audio"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Sample Prompt Suggestion */}
                <div className="w-full mt-2 p-3 rounded-lg bg-slate-900/70 border border-slate-800 text-[11px] text-slate-400 text-center">
                  <span className="text-violet-400 font-medium">Suggested line:</span> "Welcome to my capstone project. Testing real-time voice conversion with ElevenLabs."
                </div>
              </div>
            )}

            {/* Mode 2: Upload File */}
            {inputMode === 'upload' && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed border-slate-800 hover:border-violet-500/50 hover:bg-slate-900/40 transition cursor-pointer text-center"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-violet-600/10 flex items-center justify-center text-violet-400 mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                {uploadedFile ? (
                  <div>
                    <p className="text-xs font-semibold text-slate-200">{uploadedFile.name}</p>
                    <p className="text-[11px] text-slate-400">
                      {Math.round(uploadedFile.size / 1024)} KB • Click to change
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-semibold text-slate-200">
                      Drop your audio recording here
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      WAV, MP3, M4A, OGG, or WebM (up to 20MB)
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Preview of User's Original Recording */}
            {hasInputAudio && (
              <div className="mt-4 pt-4 border-t border-slate-800">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 block">
                  Original Input Preview
                </span>
                <AudioPlayer
                  audioUrl={activeInputAudioUrl}
                  title="Your Original Voice"
                  autoPlay={false}
                  downloadFilename="my_original_voice.wav"
                />
              </div>
            )}
          </div>

          {/* Voice Tuning Parameters Toggle */}
          <div className="glass-panel rounded-2xl p-4 border border-slate-800">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="w-full flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white transition"
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>Voice Morphing Parameters</span>
              </div>
              <span className="text-[11px] text-slate-500">
                {showSettings ? 'Hide ▲' : 'Show ▼'}
              </span>
            </button>

            {showSettings && (
              <div className="space-y-4 pt-4 border-t border-slate-800/80 mt-3">
                {/* Stability */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 font-medium">Voice Stability</span>
                    <span className="text-cyan-400 font-mono">{Math.round(stability * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={stability}
                    onChange={(e) => setStability(parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded appearance-none accent-violet-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Higher values make the target voice consistent; lower values allow dramatic variation.
                  </p>
                </div>

                {/* Similarity Boost */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 font-medium">Clarity & Similarity Boost</span>
                    <span className="text-cyan-400 font-mono">{Math.round(similarityBoost * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={similarityBoost}
                    onChange={(e) => setSimilarityBoost(parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded appearance-none accent-cyan-400"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Enhances reproduction of the target speaker's unique vocal characteristics.
                  </p>
                </div>

                {/* Style */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 font-medium">Style Exaggeration</span>
                    <span className="text-cyan-400 font-mono">{Math.round(style * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={style}
                    onChange={(e) => setStyle(parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded appearance-none accent-indigo-400"
                  />
                </div>

                {/* Noise toggle */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-300">Denoise Background Mic Audio</span>
                  <input
                    type="checkbox"
                    checked={removeBackgroundNoise}
                    onChange={(e) => setRemoveBackgroundNoise(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-violet-600 focus:ring-0"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Target Voice Selection & Conversion (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center text-xs font-bold">2</span>
                  Select Target Voice
                </h3>
                <span className="text-xs text-slate-400">
                  {voices.length} voices available
                </span>
              </div>

              {/* Voice Selector Component */}
              <VoiceSelector
                voices={voices}
                selectedVoiceId={selectedVoiceId}
                onSelectVoice={setSelectedVoiceId}
              />
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Transform Action CTA */}
            <div className="mt-6 pt-4 border-t border-slate-800">
              <button
                onClick={handleConvert}
                disabled={!hasInputAudio || isProcessing}
                className={`w-full py-3.5 px-6 rounded-2xl flex items-center justify-center gap-3 text-sm font-bold shadow-xl transition-all ${
                  !hasInputAudio
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : isProcessing
                    ? 'bg-gradient-to-r from-violet-700 to-indigo-700 text-white cursor-wait animate-pulse'
                    : 'bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white shadow-violet-600/30 hover:scale-[1.01] active:scale-[0.99]'
                }`}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-cyan-300" />
                    <span>ElevenLabs AI Synthesizing Speech...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-cyan-300" />
                    <span>Instant Voice Morphing (Speech-to-Speech)</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Output Section (When conversion succeeds) */}
      {resultAudio && (
        <div className="glass-panel-glow rounded-3xl p-6 sm:p-8 border border-cyan-500/30 bg-gradient-to-b from-slate-900/90 to-slate-950">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Voice Transformed Successfully!
                </h3>
                <p className="text-xs text-slate-400">
                  Synthesized in target voice with full pitch & nuance preservation
                </p>
              </div>
            </div>

            {/* Performance badge */}
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                Latency: {resultAudio.latencyMs}ms
              </span>
            </div>
          </div>

          {/* Result Player */}
          <AudioPlayer
            audioUrl={resultAudio.audioUrl}
            title="Transformed Cloned Voice Output"
            downloadFilename={resultAudio.filename}
            autoPlay={true}
          />
        </div>
      )}
    </div>
  );
}
