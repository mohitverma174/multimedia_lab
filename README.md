# Multimedia Metadata Analyzer Suite 🎬🖼️🎵

A collection of lightweight Python command-line tools designed to extract detailed metadata, EXIF data, streams, codecs, and technical properties from **Images**, **Videos**, and **Audio** files using Python and FFmpeg.

---

## 🚀 Features

* **Image Analyzer (`image_analyzer.py`)**: Extracts resolution, color mode, dimensions, file size, and complete EXIF tags (Camera make/model, date taken, orientation, etc.) for JPG, PNG, TIFF, WEBP, and BMP.
* **Video Analyzer (`video_analyzer.py`)**: Extracts container formats, duration, file size, video stream details (resolution, framerate, video bitrate, codec), audio stream details, and metadata tags using `ffprobe`.
* **Audio Analyzer (`audio_analyzer.py`)**: Extracts audio-specific metadata including sampling rates, channel layouts, audio bitrates, codecs, container details, and ID3 tags (Title, Artist, Album, etc.).

---

## 📋 Prerequisites & Installation

### 1. Python Dependencies
Ensure you have Python installed, then install the required libraries:
```bash
pip install Pillow ffmpeg-python
