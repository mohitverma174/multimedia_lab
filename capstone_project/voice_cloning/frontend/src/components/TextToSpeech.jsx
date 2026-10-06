import React, { useState } from 'react';
import { Sparkles, Play, RefreshCw, Sliders, AlertCircle, Zap, Volume2, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { convertTextToSpeech } from '../utils/api';
import VoiceSelector from './VoiceSelector';
import AudioPlayer from './AudioPlayer';

export default function TextToSpeech({ voices }) {
  const [text, setText] = useState('Hello! This is a real-time voice synthesis demonstration. Experience how ElevenLabs captures natural emotion, cadence, and human tone.');
  const [selectedVoiceId, setSelectedVoiceId] = useState(voices[0]?.voice_id || '');
  const [modelId, setModelId] = useState('eleven_turbo_v2_5');
  const [stability, setStability] = useState(0.5);
  const [similarityBoost, setSimilarityBoost] = useState(0.75);
  const [style, setStyle] = useState(0.0);
  const [showSettings, setShowSettings] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [resultAudio, setResultAudio] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const samplePrompts = [
    {
      label: '🎙️ Podcast Intro',
      text: "Welcome back everyone to the future of sound. Today, we dive deep into neural audio synthesis and real-time voice cloning.",
    },
    {
      label: '🚀 Sci-Fi AI',
      text: "Diagnostic complete. Atmospheric levels nominal. All secondary subroutines are performing within expected parameters.",
    },
    {
      label: '📚 Storyteller',
      text: "Deep within the ancient forest, beneath towering pines that whispered in the mountain breeze, lay a secret undiscovered for centuries.",
    },
    {
      label: '⚡ Tech Keynote',
      text: "Today, we are reinventing how humans interact with digital sound. Welcome to the era of zero-latency generative voice.",
    },
  ];

  const handleSynthesize = async () => {
    if (!text.trim()) {
      setErrorMessage('Please enter text to synthesize.');
      return;
    }
    if (!selectedVoiceId) {
      setErrorMessage('Please select a voice.');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage(null);

      const targetVoice = voices.find((v) => v.voice_id === selectedVoiceId);
      const voiceName = targetVoice ? targetVoice.name : 'Target Voice';

      const res = await convertTextToSpeech({
        text: text.trim(),
        voice_id: selectedVoiceId,
        voice_name: voiceName,
        model_id: modelId,
        stability,
        similarity_boost: similarityBoost,
        style,
        use_speaker_boost: true,
      });

      setResultAudio(res);
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'TTS Generation failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-violet-500/20 bg-gradient-to-r from-violet-950/40 via-slate-900/80 to-indigo-950/30">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-semibold mb-3">
          <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>High-Fidelity Text-to-Speech Studio</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Type Script, Hear Your Voice Speak
        </h2>
        <p className="mt-2 text-sm text-slate-300 leading-relaxed">
          Type or paste any text passage to generate lifelike speech using your cloned voices or ElevenLabs curated voices with instant playback.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Script Input & Tuning (6 cols) */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col flex-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs">1</span>
                Input Script
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                {text.length} characters
              </span>
            </div>

            {/* Quick Prompt Presets */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {samplePrompts.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setText(p.text)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 transition"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Textarea */}
            <textarea
              rows={6}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type or paste what you want the voice to say..."
              className="w-full p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition resize-none flex-1 leading-relaxed"
            />

            {/* Model Selector & Fine Tuning toggle */}
            <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">ElevenLabs AI Model</span>
                <select
                  value={modelId}
                  onChange={(e) => setModelId(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
                >
                  <option value="eleven_turbo_v2_5">Eleven Turbo v2.5 (Fastest & Low Latency)</option>
                  <option value="eleven_multilingual_v2">Eleven Multilingual v2 (Richest Emotion)</option>
                  <option value="eleven_flash_v2_5">Eleven Flash v2.5 (Ultra Low Latency)</option>
                </select>
              </div>

              {/* Sliders toggle */}
              <button
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                className="w-full flex items-center justify-between text-xs font-semibold text-slate-400 hover:text-slate-200 pt-1"
              >
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  Voice Tuning Controls
                </span>
                <span>{showSettings ? '▲' : '▼'}</span>
              </button>

              {showSettings && (
                <div className="space-y-3 pt-2 text-xs">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-300">Stability ({Math.round(stability * 100)}%)</span>
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
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-300">Similarity Boost ({Math.round(similarityBoost * 100)}%)</span>
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
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Voice Selection & Generation (6 cols) */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center text-xs font-bold">2</span>
                  Select Speaking Voice
                </h3>
                <span className="text-xs text-slate-400">{voices.length} voices</span>
              </div>

              <VoiceSelector
                voices={voices}
                selectedVoiceId={selectedVoiceId}
                onSelectVoice={setSelectedVoiceId}
              />
            </div>

            {errorMessage && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Action Button */}
            <div className="mt-6 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={handleSynthesize}
                disabled={isProcessing || !text.trim()}
                className={`w-full py-3.5 px-6 rounded-2xl flex items-center justify-center gap-3 text-sm font-bold shadow-xl transition-all ${
                  !text.trim()
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : isProcessing
                    ? 'bg-gradient-to-r from-violet-700 to-indigo-700 text-white cursor-wait animate-pulse'
                    : 'bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white shadow-violet-600/30 hover:scale-[1.01] active:scale-[0.99]'
                }`}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-cyan-300" />
                    <span>Synthesizing Voice Audio...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-cyan-300" />
                    <span>Generate Speech Audio</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Output Audio Player */}
      {resultAudio && (
        <div className="glass-panel-glow rounded-3xl p-6 sm:p-8 border border-cyan-500/30 bg-gradient-to-b from-slate-900/90 to-slate-950">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Generated Speech Ready
                </h3>
                <p className="text-xs text-slate-400">
                  Synthesized in target voice with high emotional fidelity
                </p>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              Latency: {resultAudio.latencyMs}ms
            </span>
          </div>

          <AudioPlayer
            audioUrl={resultAudio.audioUrl}
            title="Generated Speech Output"
            downloadFilename={resultAudio.filename}
            autoPlay={true}
          />
        </div>
      )}
    </div>
  );
}
