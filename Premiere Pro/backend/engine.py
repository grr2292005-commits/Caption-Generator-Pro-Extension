import os
import sys
import argparse
import json
import re
from datetime import timedelta

def translate_text(text, target_lang):
    if not text or not target_lang or target_lang in ["none", "auto"]:
        return text
    # 1. Try deep_translator if available
    try:
        from deep_translator import GoogleTranslator
        res = GoogleTranslator(source='auto', target=target_lang).translate(text)
        if res:
            return res
    except Exception:
        pass

    # 2. Standard library fallback via Google Translate API
    try:
        import urllib.request
        import urllib.parse
        url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=" + target_lang + "&dt=t&q=" + urllib.parse.quote(text)
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if data and isinstance(data, list) and len(data) > 0 and data[0]:
                translated_parts = [item[0] for item in data[0] if item and item[0]]
                if translated_parts:
                    return "".join(translated_parts)
    except Exception as err:
        print(f"Google translate fallback error: {err}")
    
    return text

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

    def synthesize_sequence_audio(self, manifest_path):
        """Synthesizes active sequence audio from sequence manifest JSON using FFmpeg."""
        import subprocess
        try:
            with open(manifest_path, 'r', encoding='utf-8') as f:
                manifest = json.load(f)
        except Exception as err:
            print(f"Error reading sequence manifest: {err}")
            return manifest_path

        clips = manifest.get("clips", [])
        if not clips:
            print("No clips found in sequence manifest.")
            return manifest_path

        duration = float(manifest.get("duration", 0.0))
        temp_dir = os.path.dirname(manifest_path)
        master_wav = os.path.join(temp_dir, "cgp_sequence_master.wav")

        ffmpeg_bin = self.ffmpeg_exe if os.path.exists(self.ffmpeg_exe) else "ffmpeg"

        # 1. Extract audio segment from each clip in manifest
        seg_files = []
        for idx, clip in enumerate(clips):
            m_path = clip["mediaPath"]
            c_in = clip["mediaCutIn"]
            dur = clip["cutDuration"]
            seg_path = os.path.join(temp_dir, f"cgp_seg_{idx}.wav")

            cmd_trim = [
                ffmpeg_bin, "-y",
                "-ss", str(c_in),
                "-t", str(dur),
                "-i", m_path,
                "-ar", "16000",
                "-ac", "1",
                seg_path
            ]
            try:
                subprocess.run(cmd_trim, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
                seg_files.append((seg_path, clip["relSeqStart"]))
            except Exception as eTrim:
                print(f"Segment extraction error for clip {idx}: {eTrim}")

        if not seg_files:
            print("No audio segments successfully extracted.")
            return manifest_path

        if len(seg_files) == 1 and seg_files[0][1] == 0:
            return seg_files[0][0]

        # 2. Blend segments into master_wav with ffmpeg filter_complex
        cmd_mix = [ffmpeg_bin, "-y"]
        filter_parts = []
        for idx, (s_path, rel_start) in enumerate(seg_files):
            cmd_mix.extend(["-i", s_path])
            delay_ms = int(rel_start * 1000)
            filter_parts.append(f"[{idx}:a]adelay={delay_ms}|{delay_ms}[a{idx}]")

        inputs_str = "".join([f"[a{i}]" for i in range(len(seg_files))])
        mix_filter = f"{';'.join(filter_parts)};{inputs_str}amix=inputs={len(seg_files)}:duration=longest:dropout_transition=0[out]"

        cmd_mix.extend([
            "-filter_complex", mix_filter,
            "-map", "[out]",
            "-ar", "16000",
            "-ac", "1",
            master_wav
        ])

        try:
            subprocess.run(cmd_mix, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
            return master_wav
        except Exception as eMix:
            print(f"FFmpeg sequence mix failed ({eMix}), returning first segment...")
            return seg_files[0][0]

    def transcribe_audio(self, audio_path, model_name="base", device="auto", language="auto", target_language="none", remove_fillers=False, max_chars=42, max_dur=3.0, gap_frames=0, line_mode="double"):
        # Synthesize sequence timeline audio if sequence manifest JSON is provided
        if audio_path.endswith(".json") and os.path.exists(audio_path):
            print(f"Synthesizing sequence timeline audio from manifest '{audio_path}'...")
            audio_path = self.synthesize_sequence_audio(audio_path)

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
        task = "translate" if (target_language == "en") else "transcribe"
        whisper_lang = None if (language == "auto" or not language) else language

        # Try faster-whisper first for high speed CTranslate2 performance, fallback to openai-whisper
        try:
            from faster_whisper import WhisperModel
            compute_type = "float16" if device == "cuda" else "int8"
            model = WhisperModel(model_name, device=device, compute_type=compute_type, download_root=cache_dir)
            segments, info = model.transcribe(audio_path, word_timestamps=True, task=task, language=whisper_lang)
            
            for seg in segments:
                words = []
                if hasattr(seg, 'words') and seg.words:
                    for w in seg.words:
                        words.append({"word": w.word, "start": w.start, "end": w.end})
                result_segments.append({"text": seg.text, "words": words, "start": seg.start, "end": seg.end})
        except Exception as e:
            print(f"faster-whisper unavailable or failed ({e}), falling back to standard whisper...")
            try:
                import whisper
                model = whisper.load_model(model_name, device=device, download_root=cache_dir)
                kwargs = {"word_timestamps": True, "task": task}
                if whisper_lang:
                    kwargs["language"] = whisper_lang
                res = model.transcribe(audio_path, **kwargs)
                result_segments = res.get("segments", [])
            except Exception as e2:
                print(f"Standard whisper failed: {e2}")
                raise e2

        # Process words into structured caption cues AND word-level timestamps
        captions = []
        words_output = []

        try:
            all_words = []
            for seg in result_segments:
                words = seg.get("words", [])
                if words:
                    all_words.extend(words)
                else:
                    seg_text = seg.get("text", "").strip()
                    if seg_text:
                        all_words.append({
                            "word": seg_text,
                            "start": seg.get("start", 0.0),
                            "end": seg.get("end", 1.0)
                        })

            current_text = []
            current_start = None
            current_end = None
            current_cue_words = []
            gap_seconds = gap_frames * 0.033
            cue_idx = 0

            for word_data in all_words:
                raw_w = word_data.get("word", "")
                word = raw_w.strip()
                
                if remove_fillers:
                    clean_w = re.sub(r'[^\w\s]', '', word).lower()
                    if clean_w in self.filler_words:
                        continue
                        
                if not word: 
                    continue

                start = float(word_data.get("start", 0.0))
                end = float(word_data.get("end", 0.0))

                w_obj = {
                    "word": word,
                    "start": round(start, 3),
                    "end": round(end, 3),
                    "cue_index": cue_idx
                }

                if current_start is None:
                    current_start, current_end = start, end
                    current_text = [word]
                    current_cue_words = [w_obj]
                else:
                    temp_text = " ".join(current_text + [word])
                    duration = end - current_start

                    if len(temp_text) > max_chars or duration > max_dur:
                        captions.append({
                            "text": self.format_lines(" ".join(current_text), line_mode),
                            "start": round(current_start, 3),
                            "end": round(current_end, 3)
                        })
                        words_output.extend(current_cue_words)

                        cue_idx += 1
                        current_start, current_end = start + gap_seconds, end
                        current_text = [word]
                        w_obj["cue_index"] = cue_idx
                        current_cue_words = [w_obj]
                    else:
                        current_text.append(word)
                        current_end = end
                        w_obj["cue_index"] = cue_idx
                        current_cue_words.append(w_obj)

            if current_text:
                captions.append({
                    "text": self.format_lines(" ".join(current_text), line_mode),
                    "start": round(current_start, 3),
                    "end": round(current_end, 3)
                })
                words_output.extend(current_cue_words)

        except Exception as proc_err:
            print(f"Word processing error: {proc_err}. Falling back to cue-only segment list.")
            captions = []
            words_output = []
            for seg in result_segments:
                txt = seg.get("text", "").strip()
                if txt:
                    captions.append({
                        "text": self.format_lines(txt, line_mode),
                        "start": round(float(seg.get("start", 0.0)), 3),
                        "end": round(float(seg.get("end", 1.0)), 3)
                    })

        # Non-English Target Translation: Translate Cues and Words
        translation_warning = None
        if target_language not in ["none", "en"]:
            print(f"Translating captions and words to target language '{target_language}'...")
            try:
                # 1. Translate caption cues
                for cap in captions:
                    if cap.get("text"):
                        lines = cap["text"].split("\n")
                        t_lines = []
                        for line in lines:
                            l_str = line.strip()
                            if l_str:
                                t_res = translate_text(l_str, target_language)
                                t_lines.append(t_res if t_res else l_str)
                            else:
                                t_lines.append("")
                        cap["text"] = "\n".join(t_lines)

                # 2. Translate word array items
                for w_item in words_output:
                    if w_item.get("word"):
                        w_raw = w_item["word"].strip()
                        if w_raw:
                            t_w = translate_text(w_raw, target_language)
                            if t_w:
                                w_item["word"] = t_w
            except Exception as tr_err:
                print(f"Target language translation to '{target_language}' failed: {tr_err}")
                translation_warning = f"Translation to '{target_language}' failed ({str(tr_err)}). Using original audio text."

        return captions, words_output, translation_warning

    def format_lines(self, text, mode):
        if mode == "double":
            words = text.split()
            if len(words) > 1:
                mid = len(words) // 2
                return " ".join(words[:mid]) + "\n" + " ".join(words[mid:])
        return text

    def export_files(self, captions, folder, base_name, words=None):
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
            json_data = {
                "captions": captions,
                "words": words if words is not None else []
            }
            json.dump(json_data, f, indent=4)
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
    parser.add_argument("--language", default="auto", help="Source audio language (auto, en, es, hi, etc.)")
    parser.add_argument("--target_language", default="none", help="Target translation language (none, en, es, hi, etc.)")
    parser.add_argument("--project_path", default="", help="Active Premiere/AE project directory")
    parser.add_argument("--project_name", default="Untitled", help="Project name for export folder")
    parser.add_argument("--remove_fillers", action="store_true", help="Remove filler words like um, uh")
    parser.add_argument("--translate", action="store_true", help="Backward compatible flag for translate to English")
    parser.add_argument("--enable_versioning", action="store_true", help="Organize into project version folders")
    parser.add_argument("--max_chars", type=int, default=42, help="Max characters per line")
    parser.add_argument("--max_dur", type=float, default=3.0, help="Max cue duration in seconds")
    parser.add_argument("--gap_frames", type=int, default=0, help="Gap between cues in frames")
    parser.add_argument("--line_mode", default="double", choices=["single", "double"], help="Single or double line layout")

    args = parser.parse_args()

    # Backward compatibility for --translate flag
    target_lang = args.target_language
    if args.translate and target_lang == "none":
        target_lang = "en"

    backend = CaptionBackend()

    try:
        captions, words_list, tr_warning = backend.transcribe_audio(
            audio_path=args.audio,
            model_name=args.model,
            device=args.device,
            language=args.language,
            target_language=target_lang,
            remove_fillers=args.remove_fillers,
            max_chars=args.max_chars,
            max_dur=args.max_dur,
            gap_frames=args.gap_frames,
            line_mode=args.line_mode
        )

        output_dir = backend.get_versioned_folder(args.project_path, args.project_name)
        file_paths = backend.export_files(captions, output_dir, "captions", words=words_list)

        res = {
            "success": True,
            "export_folder": output_dir,
            "files": file_paths,
            "captions": captions,
            "words": words_list
        }
        if tr_warning:
            res["warning"] = tr_warning

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
