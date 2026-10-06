import React, { useState, useEffect, useRef } from 'react';
import { History, Play, Square, Download, Trash2, Clock, Zap, RefreshCw } from 'lucide-react';
import { fetchHistory, clearHistory } from '../utils/api';

export default function HistoryList() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState(null);
  const audioRef = useRef(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchHistory();
      if (res.success) {
        setHistory(res.history || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTogglePlay = (item) => {
    if (playingId === item.id) {
      if (audioRef.current) audioRef.current.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(item.audio_url);
      audioRef.current = audio;
      setPlayingId(item.id);
      audio.play().catch(() => setPlayingId(null));
      audio.onended = () => setPlayingId(null);
    }
  };

  const handleClear = async () => {
    if (!window.confirm('Clear all session history?')) return;
    try {
      await clearHistory();
      setHistory([]);
    } catch (err) {
      console.error(err);
    }
  };

  const formatTimestamp = (ts) => {
    if (!ts) return '';
    const d = new Date(ts * 1000);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-slate-200">
            Recent Generations ({history.length})
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Refresh history"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          {history.length > 0 && (
            <button
              onClick={handleClear}
              className="text-xs text-rose-400 hover:text-rose-300 transition flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-6 text-center text-xs text-slate-500">Loading history...</div>
      ) : history.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500">
          No voice generations recorded in this session yet.
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {history.map((item) => {
            const isPlaying = playingId === item.id;
            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 text-xs transition"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleTogglePlay(item)}
                    className="p-2 rounded-lg bg-violet-600/20 text-violet-300 hover:bg-violet-600/40 transition"
                  >
                    {isPlaying ? (
                      <Square className="w-3.5 h-3.5 fill-current text-cyan-400" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current text-cyan-400" />
                    )}
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200">
                        {item.voice_name}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-mono bg-slate-800 text-slate-400">
                        {item.type === 'speech_to_speech' ? 'STS' : 'TTS'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      {item.input_label}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {item.latency_ms}ms
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {formatTimestamp(item.timestamp)}
                  </span>
                  <a
                    href={item.audio_url}
                    download={`generation_${item.id}.mp3`}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    title="Download audio"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
