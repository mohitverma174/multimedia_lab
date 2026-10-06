import React, { useState, useRef } from 'react';
import { Search, Volume2, Play, Square, Sparkles, Trash2, ArrowUpRight, Check } from 'lucide-react';
import { deleteVoice } from '../utils/api';

export default function VoiceLibrary({ voices, onSelectAndSwitch, onRefreshVoices }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'cloned', 'premade'
  const [playingId, setPlayingId] = useState(null);
  const audioRef = useRef(null);

  const togglePlay = (voiceId, url) => {
    if (!url) return;
    if (playingId === voiceId) {
      if (audioRef.current) audioRef.current.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(url);
      audioRef.current = audio;
      setPlayingId(voiceId);
      audio.play().catch(() => setPlayingId(null));
      audio.onended = () => setPlayingId(null);
    }
  };

  const handleDelete = async (voiceId, name) => {
    if (!window.confirm(`Are you sure you want to delete cloned voice "${name}"?`)) return;
    try {
      await deleteVoice(voiceId);
      if (onRefreshVoices) onRefreshVoices();
    } catch (err) {
      alert(`Failed to delete voice: ${err.message}`);
    }
  };

  const filtered = voices.filter((v) => {
    const term = searchTerm.toLowerCase();
    const match =
      v.name.toLowerCase().includes(term) ||
      (v.labels?.accent && v.labels.accent.toLowerCase().includes(term)) ||
      (v.labels?.gender && v.labels.gender.toLowerCase().includes(term)) ||
      (v.labels?.['use case'] && v.labels['use case'].toLowerCase().includes(term));

    if (!match) return false;
    if (filterType === 'cloned') return v.is_cloned;
    if (filterType === 'premade') return !v.is_cloned;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-violet-500/20 bg-gradient-to-r from-violet-950/40 via-slate-900/80 to-indigo-950/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Voice Library & Neural Profiles
          </h2>
          <p className="mt-1 text-sm text-slate-300">
            Browse {voices.length} high-fidelity AI voices and your custom cloned profiles.
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filterType === 'all'
                ? 'bg-violet-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            All Voices
          </button>
          <button
            onClick={() => setFilterType('cloned')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filterType === 'cloned'
                ? 'bg-violet-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            Cloned Only
          </button>
          <button
            onClick={() => setFilterType('premade')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filterType === 'premade'
                ? 'bg-violet-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            Premade
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name, accent (e.g. American, British, Australian), gender, or tone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition"
        />
      </div>

      {/* Voices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((voice) => {
          const isPlaying = playingId === voice.voice_id;

          return (
            <div
              key={voice.voice_id}
              className="glass-card rounded-2xl p-5 border border-slate-800/80 flex flex-col justify-between gap-4 group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-violet-600/20">
                      {voice.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-100 group-hover:text-cyan-300 transition">
                        {voice.name}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] text-slate-400 capitalize">
                          {voice.labels?.gender || 'Voice'}
                        </span>
                        {voice.labels?.accent && (
                          <span className="text-[11px] text-slate-500">
                            • {voice.labels.accent}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {voice.is_cloned ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/40">
                      Cloned
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400">
                      Premade
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                  {voice.description || `${voice.labels?.['use case'] || 'General'} speech profile.`}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {voice.labels?.['use case'] && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 font-mono">
                      {voice.labels['use case']}
                    </span>
                  )}
                  {voice.labels?.age && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 capitalize">
                      {voice.labels.age}
                    </span>
                  )}
                  {voice.labels?.description && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300">
                      {voice.labels.description}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800/60">
                {voice.preview_url ? (
                  <button
                    onClick={() => togglePlay(voice.voice_id, voice.preview_url)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition"
                  >
                    {isPlaying ? (
                      <>
                        <Square className="w-3.5 h-3.5 text-cyan-400 fill-current" />
                        <span className="text-cyan-400">Stop Preview</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 text-cyan-400 fill-current" />
                        <span>Listen Sample</span>
                      </>
                    )}
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-500 italic">No audio preview</span>
                )}

                <div className="flex items-center gap-2">
                  {voice.is_cloned && (
                    <button
                      onClick={() => handleDelete(voice.voice_id, voice.name)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                      title="Delete custom voice"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => onSelectAndSwitch(voice.voice_id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-600/30 hover:bg-violet-600/50 text-violet-300 text-xs font-semibold border border-violet-500/30 transition shadow-sm"
                  >
                    <span>Use Voice</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
