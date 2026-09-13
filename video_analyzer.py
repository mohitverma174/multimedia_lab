import os
import sys
import ffmpeg

def format_file_size(size_bytes):
    """Converts bytes into a human-readable string (KB, MB, or GB)."""
    if size_bytes < 1024:
        return f"{size_bytes} Bytes"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.2f} KB"
    elif size_bytes < 1024 * 1024 * 1024:
        return f"{size_bytes / (1024 * 1024):.2f} MB"
    else:
        return f"{size_bytes / (1024 * 1024 * 1024):.2f} GB"

def format_duration(seconds):
    """Converts seconds into HH:MM:SS format."""
    try:
        seconds = float(seconds)
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = seconds % 60
        if hours > 0:
            return f"{hours:02d}:{minutes:02d}:{secs:05.2f}"
        else:
            return f"{minutes:02d}:{secs:05.2f}"
    except (TypeError, ValueError):
        return "N/A"

def format_bitrate(bitrate):
    """Converts raw bit rate to kbps or mbps string."""
    try:
        br = int(bitrate)
        if br >= 1_000_000:
            return f"{br / 1_000_000:.2f} Mbps ({br} bps)"
        elif br >= 1_000:
            return f"{br / 1_000:.2f} kbps ({br} bps)"
        return f"{br} bps"
    except (TypeError, ValueError):
        return "N/A"

def analyze_video(video_path):
    """Probes a video file and prints out the formatted metadata report."""
    if not os.path.exists(video_path):
        print(f"Error: File '{video_path}' not found.")
        return

    try:
        probe = ffmpeg.probe(video_path)
    except ffmpeg.Error as e:
        print(f"Error probing file with FFmpeg: {e.stderr.decode() if e.stderr else e}")
        return

    # Extract sections
    file_format_info = probe.get('format', {})
    streams = probe.get('streams', [])

    # General / Container Info
    file_name = os.path.basename(video_path)
    file_size_bytes = int(file_format_info.get('size', os.path.getsize(video_path)))
    file_size = format_file_size(file_size_bytes)
    container = file_format_info.get('format_long_name', file_format_info.get('format_name', 'N/A'))
    raw_duration = file_format_info.get('duration', 0)
    duration = format_duration(raw_duration)

    # Find Video and Audio Streams
    video_stream = next((s for s in streams if s['codec_type'] == 'video'), None)
    audio_stream = next((s for s in streams if s['codec_type'] == 'audio'), None)

    # Video Details
    if video_stream:
        v_resolution = f"{video_stream.get('width', 'N/A')}x{video_stream.get('height', 'N/A')}"
        v_framerate = video_stream.get('r_frame_rate', 'N/A')
        # Evaluate framerate fraction if possible (e.g., "30000/1001" -> ~29.97)
        try:
            if '/' in v_framerate:
                num, denom = map(float, v_framerate.split('/'))
                if denom != 0:
                    v_framerate = f"{num / denom:.2f} fps ({v_framerate})"
        except ValueError:
            pass
        
        v_bitrate = format_bitrate(video_stream.get('bit_rate', file_format_info.get('bit_rate', 'N/A')))
        v_codec = f"{video_stream.get('codec_long_name', 'N/A')} ({video_stream.get('codec_name', 'N/A')})"
    else:
        v_resolution, v_framerate, v_bitrate, v_codec = "N/A", "N/A", "N/A", "N/A"

    # Audio Details
    if audio_stream:
        a_codec = f"{audio_stream.get('codec_long_name', 'N/A')} ({audio_stream.get('codec_name', 'N/A')})"
        a_channels = audio_stream.get('channels', 'N/A')
        a_channel_layout = audio_stream.get('channel_layout', '')
        if a_channel_layout:
            a_channels = f"{a_channels} channels ({a_channel_layout})"
        
        sample_rate = audio_stream.get('sample_rate', 'N/A')
        a_sample_rate = f"{int(sample_rate) / 1000} kHz ({sample_rate} Hz)" if sample_rate != 'N/A' else "N/A"
        a_bitrate = format_bitrate(audio_stream.get('bit_rate', 'N/A'))
    else:
        a_codec, a_channels, a_sample_rate, a_bitrate = "N/A", "N/A", "N/A", "N/A"

    # Format-level tags (Metadata)
    tags = file_format_info.get('tags', {})

    # Print Report Layout
    print("================================")
    print("VIDEO METADATA REPORT")
    print("================================")
    print(f"File Name       : {file_name}")
    print(f"File Size       : {file_size}")
    print(f"Container       : {container}")
    print(f"Duration        : {duration}")
    print()
    print("VIDEO")
    print("--------------------------------")
    print(f"Resolution      : {v_resolution}")
    print(f"Frame Rate      : {v_framerate}")
    print(f"Bit Rate        : {v_bitrate}")
    print(f"Codec           : {v_codec}")
    print()
    print("AUDIO")
    print("--------------------------------")
    print(f"Codec           : {a_codec}")
    print(f"Channels        : {a_channels}")
    print(f"Sampling Rate   : {a_sample_rate}")
    print(f"Bit Rate        : {a_bitrate}")
    print()
    print("METADATA")
    print("--------------------------------")
    if tags:
        for key, value in tags.items():
            print(f"{key:<15} : {value}")
    else:
        print("No extra metadata tags found.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python video_analyzer.py <path_to_video>")
    else:
        analyze_video(sys.argv[1])