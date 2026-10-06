const API_BASE = '/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function fetchUserInfo() {
  const res = await fetch(`${API_BASE}/user-info`);
  return res.json();
}

export async function fetchVoices() {
  const res = await fetch(`${API_BASE}/voices`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to fetch voices');
  }
  return res.json();
}

export async function convertSpeechToSpeech(formData) {
  const res = await fetch(`${API_BASE}/speech-to-speech`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Speech-to-Speech conversion failed');
  }

  const blob = await res.blob();
  const latency = res.headers.get('X-Latency-Ms') || '0';
  const filename = res.headers.get('X-Audio-Filename') || 'converted.mp3';

  return {
    blob,
    audioUrl: URL.createObjectURL(blob),
    latencyMs: parseInt(latency, 10),
    filename,
  };
}

export async function convertTextToSpeech(payload) {
  const res = await fetch(`${API_BASE}/text-to-speech`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Text-to-Speech generation failed');
  }

  const blob = await res.blob();
  const latency = res.headers.get('X-Latency-Ms') || '0';
  const filename = res.headers.get('X-Audio-Filename') || 'generated.mp3';

  return {
    blob,
    audioUrl: URL.createObjectURL(blob),
    latencyMs: parseInt(latency, 10),
    filename,
  };
}

export async function cloneVoice(formData) {
  const res = await fetch(`${API_BASE}/clone-voice`, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 403 && data.plan_limitation) {
      return {
        success: false,
        planLimitation: true,
        message: data.message,
        error: data.error,
      };
    }
    throw new Error(data.detail || data.error || 'Voice cloning failed');
  }

  return data;
}

export async function deleteVoice(voiceId) {
  const res = await fetch(`${API_BASE}/voices/${voiceId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to delete voice');
  }
  return res.json();
}

export async function fetchHistory() {
  const res = await fetch(`${API_BASE}/history`);
  return res.json();
}

export async function clearHistory() {
  const res = await fetch(`${API_BASE}/history`, { method: 'DELETE' });
  return res.json();
}

export async function updateApiKey(apiKey) {
  const res = await fetch(`${API_BASE}/update-api-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: apiKey }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to update API key');
  }
  return res.json();
}
