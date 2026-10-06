import React, { useState } from 'react';
import { X, Key, CheckCircle2, AlertCircle, RefreshCw, Shield, Zap } from 'lucide-react';
import { updateApiKey } from '../utils/api';

export default function SettingsModal({ isOpen, onClose, userInfo, onUserInfoUpdated }) {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSaveKey = async (e) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;

    try {
      setIsUpdating(true);
      setError(null);
      setMessage(null);

      const res = await updateApiKey(apiKeyInput.trim());
      setMessage('ElevenLabs API Key successfully verified and saved!');
      setApiKeyInput('');
      if (onUserInfoUpdated) {
        onUserInfoUpdated();
      }
    } catch (err) {
      setError(err.message || 'Failed to validate API Key');
    } finally {
      setIsUpdating(false);
    }
  };

  const charCount = userInfo?.character_count || 0;
  const charLimit = userInfo?.character_limit || 10000;
  const usagePercent = Math.min(100, Math.round((charCount / (charLimit || 1)) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-lg glass-panel-glow rounded-3xl p-6 sm:p-7 border border-violet-500/30 bg-slate-900/95 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-600/20 text-cyan-400 flex items-center justify-center">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">ElevenLabs API & Account</h3>
              <p className="text-xs text-slate-400">Manage credentials and monitor quotas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Account Status Card */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Subscription Tier</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase font-mono bg-violet-500/20 text-violet-300 border border-violet-500/30">
              {userInfo?.tier || 'Free'} Plan
            </span>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Character Quota Used</span>
              <span className="text-slate-200 font-mono font-medium">
                {charCount.toLocaleString()} / {charLimit.toLocaleString()} ({usagePercent}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-violet-500 rounded-full transition-all"
                style={{ width: `${Math.max(usagePercent, 2)}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 text-xs">
            <span className="text-slate-400">Instant Voice Cloning (IVC)</span>
            <span
              className={`font-semibold ${
                userInfo?.can_use_instant_voice_cloning ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {userInfo?.can_use_instant_voice_cloning ? '✓ Enabled' : 'Requires Starter+'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Speech-to-Speech (Voice Changer)</span>
            <span className="text-emerald-400 font-semibold">✓ Active & Working</span>
          </div>
        </div>

        {/* API Key Input Form */}
        <form onSubmit={handleSaveKey} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Change / Update ElevenLabs API Key
            </label>
            <input
              type="password"
              placeholder="Paste new sk_... key"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500 transition font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              The key is securely verified on the local backend and written to your .env file.
            </p>
          </div>

          {message && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating || !apiKeyInput.trim()}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white transition flex items-center gap-2 ${
                !apiKeyInput.trim() || isUpdating
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-violet-600 hover:bg-violet-500 shadow-md shadow-violet-600/30'
              }`}
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Validating Key...</span>
                </>
              ) : (
                <span>Verify & Save Key</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
