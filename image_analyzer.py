import os
import sys
from PIL import Image
from PIL.ExifTags import TAGS

def get_exif_data(image):
    """Extracts and decodes EXIF metadata from an image."""
    exif_data = {}
    try:
        exif = image._getexif()
        if exif:
            for tag_id, value in exif.items():
                tag = TAGS.get(tag_id, tag_id)
                exif_data[tag] = value
    except (AttributeError, KeyError, IndexError, TypeError):
        pass
    return exif_data

def format_file_size(size_bytes):
    """Converts bytes into a human-readable string (KB or MB)."""
    if size_bytes < 1024:
        return f"{size_bytes} Bytes"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.2f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.2f} MB"

def analyze_image(image_path):
    """Analyzes an image file and prints a formatted metadata report."""
    if not os.path.exists(image_path):
        print(f"Error: File '{image_path}' not found.")
        return

    try:
        with Image.open(image_path) as img:
            file_name = os.path.basename(image_path)
            file_size_bytes = os.path.getsize(image_path)
            file_size = format_file_size(file_size_bytes)
            file_format = img.format or "Unknown"
            width, height = img.size
            
            # Resolution (DPI) extraction if available
            dpi = img.info.get('dpi')
            resolution = f"{dpi[0]} x {dpi[1]} DPI" if dpi else "N/A"
            
            color_mode = img.mode

            # Extract EXIF metadata
            exif_data = get_exif_data(img)
            
            make = str(exif_data.get('Make', '')).strip()
            model = str(exif_data.get('Model', '')).strip()
            camera = f"{make} {model}".strip() if (make or model) else "N/A"
            
            date_taken = exif_data.get('DateTimeOriginal', exif_data.get('DateTime', 'N/A'))
            orientation = exif_data.get('Orientation', 'N/A')

            # Print Report matching requested format
            print("================================")
            print("IMAGE METADATA REPORT")
            print("================================")
            print(f"File Name       : {file_name}")
            print(f"File Size       : {file_size}")
            print(f"File Format     : {file_format}")
            print(f"Width           : {width} px")
            print(f"Height          : {height} px")
            print(f"Resolution      : {resolution}")
            print(f"Color Mode      : {color_mode}")
            print()
            print("EXIF Metadata")
            print("-------------------------------")
            print(f"Camera          : {camera}")
            print(f"Date Taken      : {date_taken}")
            print(f"Orientation     : {orientation}")
            
            # Optional extra EXIF fields if available
            extra_tags = ['ExposureTime', 'FNumber', 'ISOSpeedRatings', 'FocalLength']
            for tag in extra_tags:
                if tag in exif_data:
                    print(f"{tag:<15} : {exif_data[tag]}")

    except Exception as e:
        print(f"Error processing image: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python image_analyzer.py <path_to_image>")
    else:
        analyze_image(sys.argv[1])