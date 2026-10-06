import json
import logging
from typing import Optional, List, Dict, Any
import httpx
from config import ELEVENLABS_API_KEY, ELEVENLABS_BASE_URL, DEFAULT_STS_MODEL, DEFAULT_TTS_MODEL

logger = logging.getLogger(__name__)

class ElevenLabsService:
    def __init__(self, default_api_key: str = ELEVENLABS_API_KEY):
        self.default_api_key = default_api_key
        self.base_url = ELEVENLABS_BASE_URL

    def _get_headers(self, custom_api_key: Optional[str] = None) -> Dict[str, str]:
        key = (custom_api_key.strip() if custom_api_key else "") or self.default_api_key
        if not key:
            raise ValueError("ElevenLabs API Key is missing. Please configure it in .env or pass it in request headers.")
        return {"xi-api-key": key}

    async def get_user_profile(self, api_key: Optional[str] = None) -> Dict[str, Any]:
        """Fetch ElevenLabs user account info & subscription stats."""
        headers = self._get_headers(api_key)
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(f"{self.base_url}/user", headers=headers)
            if resp.status_code != 200:
                raise httpx.HTTPStatusError(
                    f"Failed to fetch user profile: {resp.text}",
                    request=resp.request,
                    response=resp
                )
            data = resp.json()
            sub = data.get("subscription", {})
            return {
                "tier": sub.get("tier", "unknown"),
                "character_count": sub.get("character_count", 0),
                "character_limit": sub.get("character_limit", 10000),
                "can_use_instant_voice_cloning": sub.get("can_use_instant_voice_cloning", False),
                "can_use_professional_voice_cloning": sub.get("can_use_professional_voice_cloning", False),
                "status": sub.get("status", "active"),
                "voice_limit": sub.get("voice_limit", 0),
                "allowed_to_extend_character_limit": sub.get("allowed_to_extend_character_limit", False),
            }

    async def get_voices(self, api_key: Optional[str] = None) -> List[Dict[str, Any]]:
        """Fetch all available voices with metadata, category, and preview URLs."""
        headers = self._get_headers(api_key)
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.get(f"{self.base_url}/voices", headers=headers)
            if resp.status_code != 200:
                raise httpx.HTTPStatusError(
                    f"Failed to fetch voices: {resp.text}",
                    request=resp.request,
                    response=resp
                )
            data = resp.json()
            raw_voices = data.get("voices", [])

            processed = []
            for v in raw_voices:
                processed.append({
                    "voice_id": v.get("voice_id"),
                    "name": v.get("name"),
                    "category": v.get("category", "premade"),
                    "description": v.get("description") or (v.get("labels", {}).get("description") if v.get("labels") else ""),
                    "labels": v.get("labels", {}) or {},
                    "preview_url": v.get("preview_url"),
                    "settings": v.get("settings", {}),
                    "is_cloned": v.get("category") in ["cloned", "instant", "professional"]
                })
            return processed

    async def speech_to_speech(
        self,
        audio_bytes: bytes,
        filename: str,
        voice_id: str,
        model_id: str = DEFAULT_STS_MODEL,
        voice_settings: Optional[Dict[str, Any]] = None,
        remove_background_noise: bool = True,
        api_key: Optional[str] = None
    ) -> bytes:
        """Convert input audio voice into target voice using ElevenLabs Speech-to-Speech API."""
        headers = self._get_headers(api_key)
        url = f"{self.base_url}/speech-to-speech/{voice_id}"

        # Setup multipart form-data
        files = {
            "audio": (filename or "input.wav", audio_bytes, "audio/wav")
        }
        data = {
            "model_id": model_id or DEFAULT_STS_MODEL,
            "remove_background_noise": str(remove_background_noise).lower()
        }
        if voice_settings:
            data["voice_settings"] = json.dumps(voice_settings)

        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(url, headers=headers, files=files, data=data)
            if resp.status_code != 200:
                logger.error(f"Speech-to-Speech failed ({resp.status_code}): {resp.text}")
                raise httpx.HTTPStatusError(
                    f"Speech-to-Speech conversion failed: {resp.text}",
                    request=resp.request,
                    response=resp
                )
            return resp.content

    async def text_to_speech(
        self,
        text: str,
        voice_id: str,
        model_id: str = DEFAULT_TTS_MODEL,
        voice_settings: Optional[Dict[str, Any]] = None,
        api_key: Optional[str] = None
    ) -> bytes:
        """Convert text into speech using chosen voice."""
        headers = self._get_headers(api_key)
        headers["Content-Type"] = "application/json"
        url = f"{self.base_url}/text-to-speech/{voice_id}"

        payload: Dict[str, Any] = {
            "text": text,
            "model_id": model_id or DEFAULT_TTS_MODEL,
        }
        if voice_settings:
            payload["voice_settings"] = voice_settings

        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code != 200:
                logger.error(f"Text-to-Speech failed ({resp.status_code}): {resp.text}")
                raise httpx.HTTPStatusError(
                    f"Text-to-Speech generation failed: {resp.text}",
                    request=resp.request,
                    response=resp
                )
            return resp.content

    async def clone_voice(
        self,
        name: str,
        description: str,
        files: List[tuple],
        remove_background_noise: bool = True,
        api_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create Instant Voice Clone using ElevenLabs Instant Voice Cloning API."""
        headers = self._get_headers(api_key)
        url = f"{self.base_url}/voices/add"

        data = {
            "name": name,
            "description": description or f"Cloned voice created for {name}",
            "remove_background_noise": str(remove_background_noise).lower()
        }

        async with httpx.AsyncClient(timeout=90.0) as client:
            resp = await client.post(url, headers=headers, files=files, data=data)
            if resp.status_code != 200:
                logger.error(f"Voice Clone failed ({resp.status_code}): {resp.text}")
                raise httpx.HTTPStatusError(
                    f"Voice cloning failed: {resp.text}",
                    request=resp.request,
                    response=resp
                )
            return resp.json()

    async def delete_voice(self, voice_id: str, api_key: Optional[str] = None) -> Dict[str, Any]:
        """Delete a cloned or custom voice."""
        headers = self._get_headers(api_key)
        url = f"{self.base_url}/voices/{voice_id}"

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.delete(url, headers=headers)
            if resp.status_code != 200:
                raise httpx.HTTPStatusError(
                    f"Failed to delete voice: {resp.text}",
                    request=resp.request,
                    response=resp
                )
            return resp.json()
