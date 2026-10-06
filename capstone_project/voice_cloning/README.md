# 🎙️ EchoMorph: Real-Time AI Voice Cloning & Speech-to-Speech Studio

**Multimedia Lab Capstone Project**  
*Powered by ElevenLabs API, FastAPI, React 19, and Tailwind CSS*

---

## 🌟 Overview

**EchoMorph** is an end-to-end web application that allows users to record or upload their voice and **instantly transform it into another cloned or curated voice** with ultra-low latency. It leverages ElevenLabs' advanced neural audio synthesis models to preserve speech timing, cadence, emotional inflections, and tone while transforming speaker identity.

---

## 🚀 Key Features

1. **⚡ Instant Speech-to-Speech (Voice Changer)**
   - Record directly from your microphone with a live Web Audio frequency visualizer or upload existing audio files (`.wav`, `.mp3`, `.m4a`, `.webm`, `.ogg`).
   - Morph your voice instantly into 20+ preset voices (e.g., George [Storyteller], Sarah [Confident], Roger [Casual], Charlie [Deep/Energetic], Laura [Quirky], etc.) or any custom cloned voice.
   - Dual player for side-by-side comparison of original input vs. transformed output.
   - Latency benchmark indicator showing roundtrip response time (typically ~400–700ms).

2. **🧬 Instant Voice Cloning Studio (IVC)**
   - Interactive guided recording booth with prompt reading passages.
   - Attach 1–5 audio clips to extract vocal characteristics.
   - One-click voice profile creation (`POST /v1/voices/add`).
   - Built-in background noise suppression.
   - *Note on ElevenLabs Tier:* Custom voice creation via `/v1/voices/add` is restricted by ElevenLabs to Starter+ accounts. The application detects this automatically and provides an informative modal, while keeping Speech-to-Speech fully functional on Free Tier accounts.

3. **📝 Text-to-Speech (TTS) Synthesis Studio**
   - Type or paste custom scripts.
   - Quick one-click prompt presets (Podcast Intro, Sci-Fi AI, Storyteller, Tech Keynote).
   - Adjustable voice stability, similarity boost, and style exaggeration.
   - Model selection between `eleven_turbo_v2_5` (ultra-fast) and `eleven_multilingual_v2` (high expression).

4. **🔊 Voice Library & Neural Explorer**
   - Searchable and categorized directory of voices (Cloned vs. Premade).
   - Audio sample preview playback for every voice.
   - Detailed tags including gender, accent, age, and recommended use case.

5. **📊 History & Analytics**
   - Persistent generation history with replay, speed adjustments, and direct MP3 downloads.
   - Real-time character usage counter and tier status indicator.

6. **🔑 Dynamic API Key Manager**
   - Live API key tester & manager in the Settings modal without needing to edit `.env` or restart servers.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   EchoMorph React Frontend                  │
│   (Vite + React 19 + Tailwind CSS + Web Audio Visualizer)   │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / Multipart Audio Streams
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI Python Backend                   │
│   (Uvicorn + Httpx + Python-Multipart + Audio Storage)      │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS (xi-api-key authenticated)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      ElevenLabs API                         │
│  • /v1/speech-to-speech/{voice_id}                          │
│  • /v1/text-to-speech/{voice_id}                            │
│  • /v1/voices                                               │
│  • /v1/voices/add                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Project Structure

```
D:\multimedia_lab\capstone_project\voice_cloning\
├── backend/
│   ├── .env                     # ElevenLabs API Key & Server Port
│   ├── config.py                # Environment configurations
│   ├── main.py                  # FastAPI REST API & Streaming Endpoints
│   ├── requirements.txt         # Python dependencies
│   ├── run_backend.py           # Python server runner
│   ├── services/
│   │   └── elevenlabs_service.py# ElevenLabs integration service
│   └── storage/
│       ├── generations/         # Saved synthesis MP3 files
│       └── history.json         # Session generation metadata
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AudioPlayer.jsx     # Audio player with scrub & download
│   │   │   ├── AudioVisualizer.jsx # Live canvas waveform & frequency bars
│   │   │   ├── HistoryList.jsx     # Generation history log
│   │   │   ├── Navbar.jsx          # Header with quota monitor & navigation
│   │   │   ├── SettingsModal.jsx   # API key & account modal
│   │   │   ├── TextToSpeech.jsx    # TTS synthesis studio
│   │   │   ├── VoiceChanger.jsx    # Speech-to-Speech conversion engine
│   │   │   ├── VoiceCloner.jsx     # Instant Voice Cloning studio
│   │   │   └── VoiceSelector.jsx   # Filterable voice browser
│   │   ├── utils/
│   │   │   ├── api.js              # REST client for backend
│   │   │   └── audioHelper.js      # MediaRecorder & Web Audio API
│   │   ├── App.jsx                 # Main layout & tab router
│   │   └── index.css               # Tailwind CSS & cyber glass styling
│   ├── vite.config.js              # Vite config with backend proxy
│   └── package.json
├── start.bat                    # One-click Windows launcher
└── README.md                    # Project documentation
```

---

## ⚡ How to Run

### Method 1: One-Click Windows Launcher (Recommended)
Simply double-click:
```bash
start.bat
```
This automatically starts the Python backend and Vite frontend, and opens your default browser at `http://localhost:3000`.

---

### Method 2: Manual Terminal Commands

#### 1. Start Backend:
```bash
cd D:\multimedia_lab\capstone_project\voice_cloning\backend
python run_backend.py
```
*Backend runs on `http://127.0.0.1:8000` (Interactive API docs at `http://127.0.0.1:8000/docs`).*

#### 2. Start Frontend:
Open a second terminal window:
```bash
cd D:\multimedia_lab\capstone_project\voice_cloning\frontend
npm run dev
```
*Frontend runs on `http://localhost:3000`.*

---

## 🔒 Security Note
Your ElevenLabs API key is stored safely on the local Python server in `backend/.env`. It is **never** exposed directly to client browsers or bundled into public frontend build assets.
