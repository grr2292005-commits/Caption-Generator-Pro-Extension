import os
import sys
import shutil
import zipfile
import subprocess
import requests
import json
import re
from datetime import timedelta
import whisper

class DependencyManager:
    """Handles the installation of AI Engine (FFmpeg only)"""
    def __init__(self):
        # Determine the base path correctly whether running as python or .exe
        if getattr(sys, 'frozen', False):
            self.base_dir = os.path.dirname(sys.executable)
        else:
            self.base_dir = os.getcwd()
            
        self.bin_dir = os.path.join(self.base_dir, "bin")
        self.ffmpeg_exe = os.path.join(self.bin_dir, "ffmpeg.exe")

    def check_requirements(self):
        # We assume Whisper is bundled inside the .exe, so we only check FFmpeg
        return os.path.exists(self.ffmpeg_exe)

    def install_ai_engine(self, progress_callback):
        # Only download FFmpeg. Whisper is already packed in the app!
        if not os.path.exists(self.ffmpeg_exe):
            progress_callback("Downloading FFmpeg (This is large)...")
            os.makedirs(self.bin_dir, exist_ok=True)
            url = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"
            zip_path = os.path.join(self.bin_dir, "ffmpeg.zip")
            
            with requests.get(url, stream=True) as r:
                r.raise_for_status()
                with open(zip_path, 'wb') as f:
                    for chunk in r.iter_content(chunk_size=8192):
                        f.write(chunk)

            progress_callback("Extracting FFmpeg...")
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(self.bin_dir)
            
            for root, dirs, files in os.walk(self.bin_dir):
                if "ffmpeg.exe" in files:
                    shutil.move(os.path.join(root, "ffmpeg.exe"), self.ffmpeg_exe)
                    break
            
            if os.path.exists(zip_path): os.remove(zip_path)
            
        progress_callback("AI Engine Ready!")

class CaptionEngine:
    def __init__(self):
        if getattr(sys, 'frozen', False):
            self.base_dir = os.path.dirname(sys.executable)
        else:
            self.base_dir = os.getcwd()
            
        self.ffmpeg_path = os.path.join(self.base_dir, "bin", "ffmpeg.exe")
        os.environ["PATH"] += os.pathsep + os.path.join(self.base_dir, "bin")
        self.model = None 
        self.model_size = None
        self.filler_words = {"um", "uh", "hmm", "mhm", "uhh", "umm", "er", "ah"}

    def load_model(self, model_size):
        if self.model is None or self.model_size != model_size:
            self.model = whisper.load_model(model_size)
            self.model_size = model_size

    def generate(self, video_path, model_choice, max_chars, max_dur, gap_frames, line_mode, translate=False, remove_fillers=False):
        size = "base" if model_choice == "faster" else "medium"
        self.load_model(size)
        
        task_mode = "translate" if translate else "transcribe"
        result = self.model.transcribe(video_path, word_timestamps=True, task=task_mode)
        
        captions = []
        current_text = []
        current_start = None
        current_end = None
        gap_seconds = gap_frames * 0.033
        
        all_words = []
        for seg in result["segments"]:
            if "words" in seg: 
                all_words.extend(seg["words"])

        for word_data in all_words:
            word = word_data["word"].strip()
            
            if remove_fillers:
                clean_w = re.sub(r'[^\w\s]', '', word).lower()
                if clean_w in self.filler_words:
                    continue 
            
            if not word: continue
            
            start, end = word_data["start"], word_data["end"]

            if current_start is None:
                current_start, current_end, current_text = start, end, [word]
            else:
                temp_text = " ".join(current_text + [word])
                duration = end - current_start
                
                if len(temp_text) > max_chars or duration > max_dur:
                    captions.append({
                        "text": self.format_lines(" ".join(current_text), line_mode),
                        "start": current_start, 
                        "end": current_end
                    })
                    current_start, current_end, current_text = start + gap_seconds, end, [word]
                else:
                    current_text.append(word)
                    current_end = end
        
        if current_text:
            captions.append({
                "text": self.format_lines(" ".join(current_text), line_mode),
                "start": current_start, "end": current_end
            })
        return captions

    def format_lines(self, text, mode):
        if mode == "double":
            words = text.split()
            if len(words) > 1:
                mid = len(words) // 2
                return " ".join(words[:mid]) + "\n" + " ".join(words[mid:])
        return text

    def save_files(self, captions, folder, base_name, formats):
        saved_paths = []
        
        if 'srt' in formats:
            path = os.path.join(folder, base_name + ".srt")
            with open(path, 'w', encoding='utf-8') as f:
                for i, cap in enumerate(captions, 1):
                    s = self.fmt_time(cap['start'], "srt")
                    e = self.fmt_time(cap['end'], "srt")
                    f.write(f"{i}\n{s} --> {e}\n{cap['text']}\n\n")
            saved_paths.append(path)

        if 'vtt' in formats:
            path = os.path.join(folder, base_name + ".vtt")
            with open(path, 'w', encoding='utf-8') as f:
                f.write("WEBVTT\n\n")
                for cap in captions:
                    s = self.fmt_time(cap['start'], "vtt")
                    e = self.fmt_time(cap['end'], "vtt")
                    f.write(f"{s} --> {e}\n{cap['text']}\n\n")
            saved_paths.append(path)

        if 'json' in formats:
            path = os.path.join(folder, base_name + ".json")
            with open(path, 'w', encoding='utf-8') as f:
                json.dump(captions, f, indent=4)
            saved_paths.append(path)

        if 'txt' in formats:
            path = os.path.join(folder, base_name + ".txt")
            full_text = " ".join([c['text'].replace('\n', ' ') for c in captions])
            with open(path, 'w', encoding='utf-8') as f:
                f.write(full_text)
            saved_paths.append(path)

        return saved_paths

    def fmt_time(self, seconds, fmt):
        td = timedelta(seconds=seconds)
        total = int(td.total_seconds())
        h, m, s = total//3600, (total%3600)//60, total%60
        ms = int(td.microseconds/1000)
        sep = "," if fmt == "srt" else "."
        return f"{h:02}:{m:02}:{s:02}{sep}{ms:03}"