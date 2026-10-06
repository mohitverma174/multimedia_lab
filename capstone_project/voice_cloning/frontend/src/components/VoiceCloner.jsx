import React, { useState, useRef } from 'react';
import { Sparkles, Mic, Upload, CheckCircle2, AlertTriangle, Trash2, ShieldAlert, ArrowRight, Play, Square, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AudioRecorder } from '../utils/audioHelper';
import { cloneVoice } from '../utils/api';
import AudioVisualizer from './AudioVisualizer';

export default function VoiceCloner({ onVoiceCreated, onOpenSettings, userInfo }) {
  const [voiceName, setVoiceName] = useState('');
  const [voiceDescription, setVoiceDescription] = useState('');
  const [removeBackgroundNoise, setRemoveBackgroundNoise] = useState(true);

  // Audio samples list: array of { id, name, file, blob, url }
  const [samples, setSamples] = useState([]);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [playingSampleId, setPlayingSampleId] = useState(null);

  // Status & loading
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [planWarning, setPlanWarning] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const recorderRef = useRef(null);
  const timerRef = useRef(null);
  const previewAudioRef = useRef(null);
  const fileInputRef = useRef(null);

  // Script prompts for reading sample
  const sampleScripts = [
    "“The quick brown fox jumps over the lazy dog. In today's digital world, audio engineering and speech synthesis are unlocking new creative possibilities for storytellers everywhere.”",
    "“Artificial intelligence allows us to capture the nuances of human speech, timbre, tone, and emotional inflection, producing natural and expressive synthetic voices.”"
  ];
  const [activeScriptIdx, setActiveScriptIdx] = useState(0);

  // Record sample
  const startRecordingSample = async () => {
    try {
      setErrorMessage(null);
      const recorder = new AudioRecorder();
      recorderRef.current = recorder;
      await recorder.start();
      setIsRecording(true);
      setRecordDuration(0);

      timerRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      setErrorMessage('Microphone access was denied or is not available.');
    }
  };

  const stopRecordingSample = async () => {
    if (!recorderRef.current || !isRecording) return;
    clearInterval(timerRef.current);
    setIsRecording(false);

    const result = await recorderRef.current.stop();
    if (result) {
      const newSample = {
        id: Date.now().toString(),
        name: `Recorded Sample ${samples.length + 1} (${recordDuration}s)`,
        file: result.file,
        url: result.audioUrl,
      };
      setSamples([...samples, newSample]);
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newSamples = files.map((file, idx) => ({
      id: `${Date.now()}_${idx}`,
      name: file.name,
      file: file,
      url: URL.createObjectURL(file),
    }));

    setSamples([...samples, ...newSamples]);
  };

  const removeSample = (id) => {
    setSamples(samples.filter((s) => s.id !== id));
  };

  const togglePlaySample = (id, url) => {
    if (playingSampleId === id) {
      if (previewAudioRef.current) previewAudioRef.current.pause();
      setPlayingSampleId(null);
    } else {
      if (previewAudioRef.current) previewAudioRef.current.pause();
      const audio = new Audio(url);
      previewAudioRef.current = audio;
      setPlayingSampleId(id);
      audio.play().catch(() => setPlayingSampleId(null));
      audio.onended = () => setPlayingSampleId(null);
    }
  };

  // Submit voice clone request
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!voiceName.trim()) {
      setErrorMessage('Please enter a voice name.');
      return;
    }
    if (samples.length === 0) {
      setErrorMessage('Please provide at least one voice sample (record or upload).');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      setPlanWarning(null);
      setSuccessMessage(null);

      const formData = new FormData();
      formData.append('name', voiceName.trim());
      formData.append('description', voiceDescription.trim());
      formData.append('remove_background_noise', removeBackgroundNoise);

      samples.forEach((sample) => {
        formData.append('files', sample.file);
      });

      const res = await cloneVoice(formData);

      if (res.planLimitation) {
        setPlanWarning(res.message);
        return;
      }

      setSuccessMessage(`Voice "${voiceName}" successfully cloned!`);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });

      if (onVoiceCreated) {
        onVoiceCreated();
      }

      // Reset form
      setVoiceName('');
      setVoiceDescription('');
      setSamples([]);
    } catch (err) {
      setErrorMessage(err.message || 'Voice cloning failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-violet-500/20 bg-gradient-to-r from-violet-950/40 via-slate-900/80 to-purple-950/30">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>ElevenLabs Instant Voice Cloning (IVC)</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Create a Custom Cloned Voice
        </h2>
        <p className="mt-2 text-sm text-slate-300 leading-relaxed">
          Record a 15-30 second clear voice sample or upload clean audio clips. ElevenLabs deep neural models extract and recreate your voice characteristics for unlimited future synthesis.
        </p>
      </div>

      {/* Plan Limitation Alert Banner (if encountered or on free plan) */}
      {planWarning && (
        <div className="rounded-2xl p-5 bg-amber-500/10 border border-amber-500/30 text-amber-200">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-amber-300">
                ElevenLabs Plan Notice: Instant Voice Cloning Requires Starter Tier
              </h4>
              <p className="text-xs text-amber-200/90 leading-relaxed">
                {planWarning}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={onOpenSettings}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition"
                >
                  Enter Paid API Key in Settings
                </button>
                <span className="text-xs text-amber-300/70">
                  Tip: You can use the <strong>Voice Changer (STS)</strong> tab immediately with 20+ preset voices without upgrading!
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Cloning Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs">1</span>
            Voice Profile
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Voice Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Alex - Natural Voice, Professor Morgan"
                value={voiceName}
                onChange={(e) => setVoiceName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Voice Description / Tags
              </label>
              <input
                type="text"
                placeholder="e.g., Confident, warm tone for lectures & podcasts"
                value={voiceDescription}
                onChange={(e) => setVoiceDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition"
              />
            </div>
          </div>
        </div>

        {/* Audio Samples Section */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-5">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs">2</span>
            Provide Voice Samples ({samples.length} added)
          </h3>

          {/* Reading Passage Prompt */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-violet-400">
                Recommended Reading Passage for Recording:
              </span>
              <button
                type="button"
                onClick={() => setActiveScriptIdx((prev) => (prev + 1) % sampleScripts.length)}
                className="text-[11px] text-slate-400 hover:text-slate-200 underline"
              >
                Switch Passage
              </button>
            </div>
            <p className="text-xs text-slate-300 italic leading-relaxed">
              {sampleScripts[activeScriptIdx]}
            </p>
          </div>

          {/* Record or Upload Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Direct Microphone Recorder */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-900 flex flex-col items-center justify-center gap-3">
              <AudioVisualizer
                analyser={recorderRef.current?.getAnalyser()}
                isRecording={isRecording}
                height={48}
              />

              <div className="text-xs text-slate-400">
                {isRecording ? (
                  <span className="text-rose-400 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    Recording Sample: {recordDuration}s
                  </span>
                ) : (
                  'Record directly with microphone'
                )}
              </div>

              {!isRecording ? (
                <button
                  type="button"
                  onClick={startRecordingSample}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-md transition"
                >
                  <Mic className="w-3.5 h-3.5" />
                  Record Sample
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecordingSample}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md animate-pulse transition"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  Save Sample
                </button>
              )}
            </div>

            {/* Audio File Upload */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-6 rounded-xl border-2 border-dashed border-slate-800 hover:border-violet-500/50 hover:bg-slate-900/40 transition cursor-pointer flex flex-col items-center justify-center text-center gap-2"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Upload className="w-6 h-6 text-violet-400" />
              <p className="text-xs font-semibold text-slate-300">
                Upload Voice Samples
              </p>
              <p className="text-[11px] text-slate-500">
                WAV or MP3 with minimal background noise
              </p>
            </div>
          </div>

          {/* Attached Samples List */}
          {samples.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-xs font-semibold text-slate-400 block">
                Attached Audio Clips:
              </span>
              {samples.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => togglePlaySample(s.id, s.url)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 transition"
                    >
                      {playingSampleId === s.id ? (
                        <Square className="w-3.5 h-3.5 fill-current" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current" />
                      )}
                    </button>
                    <span className="text-slate-200 font-medium">{s.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSample(s.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Noise Removal Checkbox */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="denoise"
              checked={removeBackgroundNoise}
              onChange={(e) => setRemoveBackgroundNoise(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-violet-600 focus:ring-0"
            />
            <label htmlFor="denoise" className="text-xs text-slate-300 cursor-pointer">
              Automatically remove background noise from samples
            </label>
          </div>
        </div>

        {/* Feedback Alerts */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || samples.length === 0 || !voiceName.trim()}
          className={`w-full py-4 px-6 rounded-2xl flex items-center justify-center gap-3 text-sm font-bold shadow-xl transition-all ${
            samples.length === 0 || !voiceName.trim()
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : isSubmitting
              ? 'bg-gradient-to-r from-violet-700 to-indigo-700 text-white cursor-wait animate-pulse'
              : 'bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white shadow-violet-600/30 hover:scale-[1.01] active:scale-[0.99]'
          }`}
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-cyan-300" />
              <span>Training Instant Voice Clone with ElevenLabs...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-cyan-300" />
              <span>Clone Voice Now</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
