import os
import time
import logging
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
import httpx
from dotenv import load_dotenv

# Load .env
load_dotenv()
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")
BASE_URL = "https://api.elevenlabs.io/v1"

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("VoiceConverter")

app = FastAPI(title="Instant Voice Converter", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/voices")
async def get_voices():
    """Fetch available voices for speech-to-speech."""
    headers = {"xi-api-key": ELEVENLABS_API_KEY}
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            res = await client.get(f"{BASE_URL}/voices", headers=headers)
            if res.status_code != 200:
                raise HTTPException(status_code=res.status_code, detail=res.text)
            
            data = res.json().get("voices", [])
            voices_list = [
                {
                    "voice_id": v.get("voice_id"),
                    "name": v.get("name"),
                    "gender": v.get("labels", {}).get("gender", ""),
                    "accent": v.get("labels", {}).get("accent", ""),
                    "description": v.get("labels", {}).get("description", "") or v.get("description", "")
                }
                for v in data
            ]
            return {"voices": voices_list}
    except Exception as e:
        logger.error(f"Failed to fetch voices: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/convert")
async def convert_voice(
    audio: UploadFile = File(...),
    voice_id: str = Form("JBFqnCBsd6RMkjVDRZzb"), # Default to George
    model_id: Optional[str] = Form("eleven_multilingual_sts_v2")
):
    """
    Instantly converts user recorded voice into target voice using ElevenLabs Speech-to-Speech API.
    """
    start_time = time.time()
    logger.info(f"Converting audio using voice_id={voice_id}...")

    audio_bytes = await audio.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Audio recording is empty.")

    headers = {"xi-api-key": ELEVENLABS_API_KEY}
    url = f"{BASE_URL}/speech-to-speech/{voice_id}"

    files = {
        "audio": (audio.filename or "recording.wav", audio_bytes, "audio/wav")
    }
    data = {
        "model_id": model_id,
        "remove_background_noise": "true"
    }

    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.post(url, headers=headers, files=files, data=data)
            if resp.status_code != 200:
                logger.error(f"ElevenLabs error ({resp.status_code}): {resp.text}")
                raise HTTPException(status_code=resp.status_code, detail=resp.text)

            latency_ms = int((time.time() - start_time) * 1000)
            logger.info(f"Voice converted successfully in {latency_ms}ms!")

            return Response(
                content=resp.content,
                media_type="audio/mpeg",
                headers={"X-Latency-Ms": str(latency_ms)}
            )
    except httpx.HTTPError as e:
        logger.error(f"Network error with ElevenLabs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
