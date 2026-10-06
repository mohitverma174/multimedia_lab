import React from 'react';
import { Waves, Key, Sparkles, ShieldCheck, Zap } from 'lucide-react';

export default function Navbar({ userInfo, onOpenSettings, activeTab, setActiveTab }) {
  const charCount = userInfo?.character_count || 0;
  const charLimit = userInfo?.character_limit || 10000;
  const usagePercent = Math.min(100, Math.round((charCount / (charLimit || 1)) * 100));
  const isCloneAllowed = userInfo?.can_use_instant_voice_cloning;

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 p-[1px] shadow-lg shadow-violet-500/20">
            <div className="w-full h-full bg-slate-950 rounded-xl flex items-center justify-center">
              <Waves className="w-6 h-6 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-violet-400 via-cyan-300 to-indigo-200 bg-clip-text text-transparent">
                EchoMorph
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                Studio
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              AI Voice Cloning & Instant Speech-to-Speech
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/70 border border-slate-800/80">
          {[
            { id: 'sts', label: 'Voice Changer (STS)', icon: Zap },
            { id: 'clone', label: 'Clone Studio', icon: Sparkles },
            { id: 'tts', label: 'Text-to-Speech', icon: Waves },
            { id: 'voices', label: 'Voice Library', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-300' : ''}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Status / User Quota & Settings */}
        <div className="flex items-center gap-3">
          {/* ElevenLabs Status Badge */}
          <div className="hidden lg:flex flex-col items-end text-right">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                API Connected
              </span>
              <span className="text-xs text-slate-400 uppercase font-mono font-medium">
                {userInfo?.tier || 'Free'} Tier
              </span>
            </div>
            {/* Usage Bar */}
            <div className="flex items-center gap-2 mt-1">
              <div className="w-24 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-violet-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(usagePercent, 2)}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {charCount.toLocaleString()} / {charLimit.toLocaleString()} chars
              </span>
            </div>
          </div>

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all text-xs font-medium shadow-sm hover:border-slate-700"
            title="Configure ElevenLabs API Key & Settings"
          >
            <Key className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </div>
    </header>
  );
}
