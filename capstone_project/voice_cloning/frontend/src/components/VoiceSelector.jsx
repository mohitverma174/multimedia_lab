import React, { useState, useRef } from 'react';
import { Search, Volume2, Sparkles, User, Check, Play, Square } from 'lucide-react';

export default function VoiceSelector({ voices = [], selectedVoiceId, onSelectVoice, isClonedFirst = false }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all', 'cloned', 'premade'
  const [playingPreviewId, setPlayingPreviewId] = useState(null);
  const previewAudioRef = useRef(null);

  const togglePreview = (voiceId, previewUrl, e) => {
    e.stopPropagation();
    if (!previewUrl) return;

    if (playingPreviewId === voiceId) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      setPlayingPreviewId(null);
    } else {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      const audio = new Audio(previewUrl);
      previewAudioRef.current = audio;
      setPlayingPreviewId(voiceId);
      audio.play().catch(() => setPlayingPreviewId(null));
      audio.onended = () => setPlayingPreviewId(null);
      audio.onerror = () => setPlayingPreviewId(null);
    }
  };

  const filteredVoices = voices.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.labels?.accent && v.labels.accent.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (v.labels?.gender && v.labels.gender.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (v.labels?.['use case'] && v.labels['use case'].toLowerCase().includes(searchTerm.toLowerCase())) ||
      (v.description && v.description.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (categoryFilter === 'cloned') return v.is_cloned;
    if (categoryFilter === 'premade') return !v.is_cloned;
    return true;
  });

  const selectedVoice = voices.find((v) => v.voice_id === selectedVoiceId) || voices[0];

  return (
    <div className="flex flex-col gap-3">
      {/* Current selection display */}
      {selectedVoice && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-violet-950/30 border border-violet-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-violet-500/20">
              {selectedVoice.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-100">{selectedVoice.name}</span>
                {selectedVoice.is_cloned ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/40">
                    Cloned
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400">
                    Premade
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 line-clamp-1">
                {selectedVoice.description || `${selectedVoice.labels?.gender || ''} • ${selectedVoice.labels?.accent || ''}`}
              </p>
            </div>
          </div>
          {selectedVoice.preview_url && (
            <button
              onClick={(e) => togglePreview(selectedVoice.voice_id, selectedVoice.preview_url, e)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition"
              title="Preview Voice"
            >
              {playingPreviewId === selectedVoice.voice_id ? (
                <>
                  <Square className="w-3.5 h-3.5 text-cyan-400 fill-current" />
                  <span className="text-cyan-400">Stop</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-cyan-400 fill-current" />
                  <span>Preview</span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-2">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search voice by name, accent, or mood..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition"
          />
        </div>

        {/* Categories */}
        <div className="flex items-center gap-1 w-full sm:w-auto p-1 rounded-xl bg-slate-900/90 border border-slate-800">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`flex-1 sm:flex-none px-3 py-1 rounded-lg text-xs font-medium transition ${
              categoryFilter === 'all'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({voices.length})
          </button>
          <button
            onClick={() => setCategoryFilter('cloned')}
            className={`flex-1 sm:flex-none px-3 py-1 rounded-lg text-xs font-medium transition ${
              categoryFilter === 'cloned'
                ? 'bg-violet-600/30 text-violet-300 border border-violet-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Cloned ({voices.filter((v) => v.is_cloned).length})
          </button>
          <button
            onClick={() => setCategoryFilter('premade')}
            className={`flex-1 sm:flex-none px-3 py-1 rounded-lg text-xs font-medium transition ${
              categoryFilter === 'premade'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Premade
          </button>
        </div>
      </div>

      {/* Voice Grid Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
        {filteredVoices.map((voice) => {
          const isSelected = voice.voice_id === selectedVoiceId;
          const isPlaying = playingPreviewId === voice.voice_id;

          return (
            <div
              key={voice.voice_id}
              onClick={() => onSelectVoice(voice.voice_id)}
              className={`p-3 rounded-xl cursor-pointer border transition-all text-left flex flex-col justify-between gap-2 ${
                isSelected
                  ? 'bg-gradient-to-r from-violet-950/60 to-indigo-950/50 border-violet-500 shadow-md shadow-violet-500/20'
                  : 'bg-slate-900/60 hover:bg-slate-800/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      isSelected
                        ? 'bg-violet-500 text-white'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {voice.name.slice(0, 1)}
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-slate-200 line-clamp-1">
                      {voice.name}
                    </h5>
                    <span className="text-[10px] text-slate-400 capitalize">
                      {voice.labels?.gender || ''} {voice.labels?.accent ? `• ${voice.labels.accent}` : ''}
                    </span>
                  </div>
                </div>

                {isSelected ? (
                  <div className="w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center text-white">
                    <Check className="w-3 h-3" />
                  </div>
                ) : voice.preview_url ? (
                  <button
                    onClick={(e) => togglePreview(voice.voice_id, voice.preview_url, e)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition"
                    title="Preview sample"
                  >
                    {isPlaying ? (
                      <Square className="w-3.5 h-3.5 text-cyan-400 fill-current" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current" />
                    )}
                  </button>
                ) : null}
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-1">
                {voice.labels?.['use case'] && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 font-mono">
                    {voice.labels['use case']}
                  </span>
                )}
                {voice.labels?.age && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 capitalize">
                    {voice.labels.age}
                  </span>
                )}
                {voice.is_cloned && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 font-semibold border border-violet-500/30">
                    Custom Clone
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {filteredVoices.length === 0 && (
          <div className="col-span-full py-8 text-center text-xs text-slate-500">
            No voices found matching "{searchTerm}"
          </div>
        )}
      </div>
    </div>
  );
}
