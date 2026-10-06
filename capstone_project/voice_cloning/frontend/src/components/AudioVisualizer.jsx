import React, { useEffect, useRef } from 'react';

export default function AudioVisualizer({ analyser, isRecording, isPlaying, height = 64 }) {
  const canvasRef = useRef(null);
  const animFrameIdRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const h = canvas.height;

    let bufferLength = analyser ? analyser.frequencyBinCount : 64;
    let dataArray = analyser ? new Uint8Array(bufferLength) : new Uint8Array(64);

    const render = () => {
      animFrameIdRef.current = requestAnimationFrame(render);

      ctx.clearRect(0, 0, width, h);

      if (isRecording && analyser) {
        analyser.getByteFrequencyData(dataArray);

        const barWidth = (width / 40) - 2;
        let x = 0;

        for (let i = 0; i < 40; i++) {
          const sampleIndex = Math.floor(i * (bufferLength / 40));
          const value = dataArray[sampleIndex] || 0;
          const barHeight = Math.max(4, (value / 255) * (h - 8));

          // Gradient bar
          const gradient = ctx.createLinearGradient(0, h, 0, 0);
          gradient.addColorStop(0, '#8b5cf6');
          gradient.addColorStop(0.5, '#6366f1');
          gradient.addColorStop(1, '#06b6d4');

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(x, (h - barHeight) / 2, Math.max(barWidth, 3), barHeight, 3);
          ctx.fill();

          x += barWidth + 3;
        }
      } else if (isPlaying) {
        // Simulated responsive waveform
        const time = Date.now() / 200;
        const barWidth = (width / 36) - 2;
        let x = 0;

        for (let i = 0; i < 36; i++) {
          const sinVal = Math.sin(time + i * 0.4);
          const cosVal = Math.cos(time * 0.7 + i * 0.2);
          const barHeight = Math.max(6, Math.abs(sinVal * cosVal) * (h - 10));

          const gradient = ctx.createLinearGradient(0, h, 0, 0);
          gradient.addColorStop(0, '#06b6d4');
          gradient.addColorStop(1, '#38bdf8');

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(x, (h - barHeight) / 2, Math.max(barWidth, 3), barHeight, 3);
          ctx.fill();

          x += barWidth + 3;
        }
      } else {
        // Idle gentle wave
        ctx.fillStyle = 'rgba(71, 85, 105, 0.4)';
        const barWidth = (width / 32) - 2;
        let x = 0;
        for (let i = 0; i < 32; i++) {
          const barHeight = 4 + (i % 3) * 2;
          ctx.beginPath();
          ctx.roundRect(x, (h - barHeight) / 2, Math.max(barWidth, 2), barHeight, 2);
          ctx.fill();
          x += barWidth + 3;
        }
      }
    };

    render();

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [analyser, isRecording, isPlaying]);

  return (
    <div className="w-full flex items-center justify-center p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
      <canvas
        ref={canvasRef}
        width={360}
        height={height}
        className="w-full max-w-md h-full rounded"
      />
    </div>
  );
}
