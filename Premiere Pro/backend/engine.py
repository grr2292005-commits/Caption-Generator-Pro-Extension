import os
import sys
import argparse
import json
import re
from datetime import timedelta

class CaptionBackend:
    def __init__(self, base_dir=None):
        self.base_dir = base_dir or os.getcwd()
        self.bin_dir = os.path.join(self.base_dir, "bin")
        self.ffmpeg_exe = os.path.join(self.bin_dir, "ffmpeg.exe")
        
        # Add bin directory to PATH for ffmpeg
        if os.path.exists(self.bin_dir):
            os.environ["PATH"] = self.bin_dir + os.pathsep + os.environ.get("PATH", "")
            
        self.filler_words = {"um", "uh", "hmm", "mhm", "uhh", "umm", "er", "ah", "like"}

    def get_versioned_folder(self, project_path, project_name):
        """Generates PROJECT_NAME_VER_{x} folder path."""
        if not project_path or not os.path.exists(project_path):
            base_folder = os.path.join(self.base_dir, "Captions_Export")
        else:
            base_folder = os.path.join(project_path, "Captions_Versions")
            
        os.makedirs(base_folder, exist_ok=True)
        
        version = 1
        while True:
            folder_name = f"{project_name}_VER_{version:03d}"
            ver_dir = os.path.join(base_folder, folder_name)
            if not os.path.exists(ver_dir):
                os.makedirs(ver_dir, exist_ok=True)
                return ver_dir
            version += 1

    def transcribe_audio(self, audio_path, model_name="base", device="auto", translate=False, remove_fillers=False, max_chars=42, max_dur=3.0, gap_frames=0, line_mode="double"):
        # Safe device selection with CUDA check
        try:
            import torch
            if device == "cuda" and not torch.cuda.is_available():
                print("CUDA requested but not available. Falling back to CPU mode...")
                device = "cpu"
            elif device == "auto":
                device = "cuda" if torch.cuda.is_available() else "cpu"
        except Exception:
            device = "cpu"

        print(f"Loading model '{model_name}' on device '{device}'...")
        
        cache_dir = os.path.expanduser("~/.cache/whisper")
        os.makedirs(cache_dir, exist_ok=True)

        result_segments = []

        # Try faster-whisper first for high speed CTranslate2 performance, fallback to openai-whisper
        try:
            from faster_whisper import WhisperModel
            compute_type = "float16" if device == "cuda" else "int8"
            model = WhisperModel(model_name, device=device, compute_type=compute_type, download_root=cache_dir)
            task = "translate" if translate else "transcribe"
            segments, info = model.transcribe(audio_path, word_timestamps=True, task=task)
            
            for seg in segments:
                words = []
                if hasattr(seg, 'words') and seg.words:
                    for w in seg.words:
                        words.append({"word": w.word, "start": w.start, "end": w.end})
                result_segments.append({"text": seg.text, "words": words})
        except Exception as e:
            print(f"faster-whisper unavailable or failed ({e}), falling back to standard whisper...")
            import whisper
            model = whisper.load_model(model_name, device=device, download_root=cache_dir)
            task = "translate" if translate else "transcribe"
            res = model.transcribe(audio_path, word_timestamps=True, task=task)
            result_segments = res.get("segments", [])

        # Process words into structured caption cues
        captions = []
        current_text = []
        current_start = None
        current_end = None
        gap_seconds = gap_frames * 0.033

        all_words = []
        for seg in result_segments:
            words = seg.get("words", [])
            if words:
                all_words.extend(words)
            else:
                # Fallback segment level if word timestamps missing
                all_words.append({"word": seg.get("text", "").strip(), "start": seg.get("start", 0), "end": seg.get("end", 1)})

        for word_data in all_words:
            word = word_data["word"].strip()
            
            if remove_fillers:
                clean_w = re.sub(r'[^\w\s]', '', word).lower()
                if clean_w in self.filler_words:
                    continue
                    
            if not word: 
                continue

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
                "start": current_start,
                "end": current_end
            })

        return captions

    def format_lines(self, text, mode):
        if mode == "double":
            words = text.split()
            if len(words) > 1:
                mid = len(words) // 2
                return " ".join(words[:mid]) + "\n" + " ".join(words[mid:])
        return text

    def export_files(self, captions, folder, base_name):
        os.makedirs(folder, exist_ok=True)
        results = {}

        # 1. SRT
        srt_path = os.path.join(folder, base_name + ".srt")
        with open(srt_path, 'w', encoding='utf-8') as f:
            for i, cap in enumerate(captions, 1):
                s = self.fmt_time(cap['start'], "srt")
                e = self.fmt_time(cap['end'], "srt")
                f.write(f"{i}\n{s} --> {e}\n{cap['text']}\n\n")
        results['srt'] = srt_path

        # 2. VTT
        vtt_path = os.path.join(folder, base_name + ".vtt")
        with open(vtt_path, 'w', encoding='utf-8') as f:
            f.write("WEBVTT\n\n")
            for cap in captions:
                s = self.fmt_time(cap['start'], "vtt")
                e = self.fmt_time(cap['end'], "vtt")
                f.write(f"{s} --> {e}\n{cap['text']}\n\n")
        results['vtt'] = vtt_path

        # 3. JSON
        json_path = os.path.join(folder, base_name + ".json")
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(captions, f, indent=4)
        results['json'] = json_path

        return results

    def fmt_time(self, seconds, fmt_type="srt"):
        td = timedelta(seconds=seconds)
        total_seconds = int(td.total_seconds())
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        secs = total_seconds % 60
        millis = int((seconds - int(seconds)) * 1000)

        if fmt_type == "srt":
            return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"
        else:
            return f"{hours:02d}:{minutes:02d}:{secs:02d}.{millis:03d}"

def main():
    parser = argparse.ArgumentParser(description="Caption Generator Backend CLI")
    parser.add_argument("--audio", required=True, help="Path to input audio file")
    parser.add_argument("--model", default="base", help="Whisper model (tiny, base, small, medium, large-v3)")
    parser.add_argument("--device", default="auto", help="Hardware device (cuda, cpu, auto)")
    parser.add_argument("--project_path", default="", help="Active Premiere/AE project directory")
    parser.add_argument("--project_name", default="Untitled", help="Project name for export folder")
    parser.add_argument("--remove_fillers", action="store_true", help="Remove filler words like um, uh")
    parser.add_argument("--translate", action="store_true", help="Translate non-English audio to English")
    parser.add_argument("--enable_versioning", action="store_true", help="Organize into project version folders")
    parser.add_argument("--max_chars", type=int, default=42, help="Max characters per line")
    parser.add_argument("--max_dur", type=float, default=3.0, help="Max cue duration in seconds")
    parser.add_argument("--gap_frames", type=int, default=0, help="Gap between cues in frames")
    parser.add_argument("--line_mode", default="double", choices=["single", "double"], help="Single or double line layout")

    args = parser.parse_args()

    backend = CaptionBackend()

    try:
        captions = backend.transcribe_audio(
            audio_path=args.audio,
            model_name=args.model,
            device=args.device,
            translate=args.translate,
            remove_fillers=args.remove_fillers,
            max_chars=args.max_chars,
            max_dur=args.max_dur,
            gap_frames=args.gap_frames,
            line_mode=args.line_mode
        )

        output_dir = backend.get_versioned_folder(args.project_path, args.project_name)
        file_paths = backend.export_files(captions, output_dir, "captions")

        res = {
            "success": True,
            "export_folder": output_dir,
            "files": file_paths,
            "captions": captions
        }

        print("---RESULT_JSON_START---")
        print(json.dumps(res))
        print("---RESULT_JSON_END---")

    except Exception as e:
        err_res = {
            "success": False,
            "error": str(e)
        }
        print("---RESULT_JSON_START---")
        print(json.dumps(err_res))
        print("---RESULT_JSON_END---")
        sys.exit(1)

if __name__ == "__main__":
    main()
