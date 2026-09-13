import os
import sys
import ffmpeg

def format_file_size(size_bytes):
    """Converts bytes into a human-readable string (KB or MB)."""
    if size_bytes < 1024:
        return f"{size_bytes} Bytes"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.2f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.2f} MB"

def format_duration(seconds):
    """Converts seconds into MM:SS or HH:MM:SS format."""
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
    """Converts raw bit rate to kbps string."""
    try:
        br = int(bitrate)
        if br >= 1_000:
            return f"{br / 1_000:.2f} kbps ({br} bps)"
        return f"{br} bps"
    except (TypeError, ValueError):
        return "N/A"

def analyze_audio(audio_path):
    """Probes an audio file and prints out the formatted metadata report."""
    if not os.path.exists(audio_path):
        print(f"Error: File '{audio_path}' not found.")
        return

    try:
        probe = ffmpeg.probe(audio_path)
    except ffmpeg.Error as e:
        print(f"Error probing file with FFmpeg: {e.stderr.decode() if e.stderr else e}")
        return

    file_format_info = probe.get('format', {})
    streams = probe.get('streams', [])

    # General / Container Info
    file_name = os.path.basename(audio_path)
    file_size_bytes = int(file_format_info.get('size', os.path.getsize(audio_path)))
    file_size = format_file_size(file_size_bytes)
    container = file_format_info.get('format_long_name', file_format_info.get('format_name', 'N/A'))
    raw_duration = file_format_info.get('duration', 0)
    duration = format_duration(raw_duration)

    # Find Audio Stream
    audio_stream = next((s for s in streams if s['codec_type'] == 'audio'), None)

    # Audio Details
    if audio_stream:
        codec_name = audio_stream.get('codec_name', 'N/A')
        codec_long = audio_stream.get('codec_long_name', '')
        a_codec = f"{codec_long} ({codec_name})" if codec_long else codec_name
        
        channels = audio_stream.get('channels', 'N/A')
        channel_layout = audio_stream.get('channel_layout', '')
        if channel_layout:
            a_channels = f"{channels} channels ({channel_layout})"
        else:
            a_channels = str(channels)

        sample_rate = audio_stream.get('sample_rate', 'N/A')
        a_sample_rate = f"{int(sample_rate) / 1000} kHz ({sample_rate} Hz)" if sample_rate != 'N/A' else "N/A"
        
        # Fallback stream bitrate to format bitrate if stream bitrate is missing
        stream_bitrate = audio_stream.get('bit_rate', file_format_info.get('bit_rate', 'N/A'))
        a_bitrate = format_bitrate(stream_bitrate)
    else:
        a_codec, a_channels, a_sample_rate, a_bitrate = "N/A", "N/A", "N/A", "N/A"

    # Tags / Metadata (e.g., ID3 tags like title, artist, album)
    tags = file_format_info.get('tags', {})

    # Print Report Layout
    print("================================")
    print("AUDIO METADATA REPORT")
    print("================================")
    print(f"File Name       : {file_name}")
    print(f"File Size       : {file_size}")
    print(f"Container       : {container}")
    print(f"Duration        : {duration}")
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
        print("Usage: python audio_analyzer.py <path_to_audio>")
    else:
        analyze_audio(sys.argv[1])