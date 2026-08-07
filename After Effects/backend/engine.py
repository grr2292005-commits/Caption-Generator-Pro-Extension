import os
import sys
import argparse
import json
import re
from datetime import timedelta

def translate_text(text, target_lang):
    if not text or not target_lang or target_lang in ["none", "auto"]:
        return text

    target_code = target_lang.lower().strip()
    if target_code in ["hindi", "hi_in", "hi-in"]:
        target_code = "hi"
    elif target_code in ["spanish", "es_es", "es-es"]:
        target_code = "es"

    # 1. Try deep_translator if available
    try:
        from deep_translator import GoogleTranslator
        res = GoogleTranslator(source='auto', target=target_code).translate(text)
        if res and res.strip():
            return res.strip()
    except Exception:
        pass

    # 2. Standard library fallback via Google Translate GTX API
    try:
        import urllib.request
        import urllib.parse
        url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=" + target_code + "&dt=t&q=" + urllib.parse.quote(text)
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if data and isinstance(data, list) and len(data) > 0 and data[0]:
                translated_parts = [item[0] for item in data[0] if item and item[0]]
                if translated_parts:
                    return "".join(translated_parts).strip()
    except Exception as err:
        print(f"Google translate gtx fallback error: {err}")

    # 3. Alternate Google Translate dict-chrome endpoint fallback
    try:
        import urllib.request
        import urllib.parse
        url = "https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=auto&tl=" + target_code + "&q=" + urllib.parse.quote(text)
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if data and isinstance(data, list) and len(data) > 0:
                if isinstance(data[0], str):
                    return data[0].strip()
                elif isinstance(data[0], list) and len(data[0]) > 0:
                    return str(data[0][0]).strip()
    except Exception as errAlt:
        print(f"Google translate dict-chrome fallback error: {errAlt}")

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
        """Synthesizes active composition timeline audio from manifest JSON using FFmpeg with single-clip fallback."""
        import subprocess
        import shutil

        if not os.path.exists(manifest_path):
            raise RuntimeError(f"Comp manifest file missing at: {manifest_path}")

        file_size = os.path.getsize(manifest_path)
        if file_size == 0:
            raise RuntimeError(f"Comp manifest file at '{manifest_path}' is empty (0 bytes).")

        try:
            with open(manifest_path, 'r', encoding='utf-8-sig') as f:
                content = f.read().strip()
        except Exception as eRead:
            raise RuntimeError(f"Failed to read comp manifest file at '{manifest_path}' (size: {file_size} bytes): {eRead}")

        if not content:
            raise RuntimeError(f"Comp manifest file at '{manifest_path}' is empty after trimming whitespace (size: {file_size} bytes).")

        try:
            manifest = json.loads(content)
        except Exception as err:
            preview = content[:120].replace('\n', ' ').replace('\r', '')
            raise RuntimeError(f"Failed to parse comp manifest JSON at '{manifest_path}' (size: {file_size} bytes): {err}. Content preview: '{preview}'")

        clips = manifest.get("clips", [])
        if not clips:
            raise RuntimeError("No footage or audio layers found in comp manifest JSON.")

        temp_dir = os.path.dirname(manifest_path)
        master_wav = os.path.join(temp_dir, "cgp_comp_master.wav")

        # Resolve FFmpeg binary path
        ffmpeg_bin = self.ffmpeg_exe
        if not os.path.exists(ffmpeg_bin):
            ffmpeg_bin = shutil.which("ffmpeg") or "ffmpeg"

        # Check FFmpeg availability
        try:
            res = subprocess.run([ffmpeg_bin, "-version"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            if res.returncode != 0:
                raise RuntimeError(f"FFmpeg check failed with code {res.returncode}")
        except Exception as eFf:
            raise RuntimeError(f"FFmpeg binary missing or unavailable at expected path '{ffmpeg_bin}'. ({eFf})")

        # 1. Extract 16kHz mono PCM WAV segment from each layer
        seg_files = []
        trim_errors = []

        for idx, clip in enumerate(clips):
            m_path = clip.get("mediaPath", "")
            if not m_path or not os.path.exists(m_path):
                trim_errors.append(f"Layer {idx} source file missing: '{m_path}'")
                continue

            c_in = clip.get("mediaCutIn", 0.0)
            dur = clip.get("cutDuration", 1.0)
            seg_path = os.path.join(temp_dir, f"cgp_ae_seg_{idx}.wav")

            # Extract 16kHz mono 16-bit PCM WAV segment (-vn -sn to ignore video/subtitle streams)
            cmd_trim = [
                ffmpeg_bin, "-y",
                "-ss", str(c_in),
                "-t", str(dur),
                "-i", m_path,
                "-vn", "-sn",
                "-ar", "16000",
                "-ac", "1",
                "-c:a", "pcm_s16le",
                seg_path
            ]
            try:
                rTrim = subprocess.run(cmd_trim, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                if rTrim.returncode == 0 and os.path.exists(seg_path) and os.path.getsize(seg_path) > 500:
                    seg_files.append((seg_path, clip.get("relSeqStart", 0.0)))
                else:
                    err_msg = rTrim.stderr.decode("utf-8", errors="ignore") if rTrim.stderr else "Unknown trim error"
                    trim_errors.append(f"Layer {idx} extract failed: {err_msg[:200]}")
            except Exception as eTrim:
                trim_errors.append(f"Layer {idx} exception: {eTrim}")

        # Safe Fallback: If multi-layer extractions failed completely
        if not seg_files:
            err_details = "; ".join(trim_errors) if trim_errors else "No valid audio tracks found on comp layers."
            raise RuntimeError(f"Failed to extract comp timeline audio. ({err_details})")

        # Single layer starting at 0.0s -> direct return
        if len(seg_files) == 1 and seg_files[0][1] == 0:
            return seg_files[0][0]

        # 2. Multi-layer comp audio mix using FFmpeg filter_complex
        cmd_mix = [ffmpeg_bin, "-y"]
        filter_parts = []
        for idx, (s_path, rel_start) in enumerate(seg_files):
            cmd_mix.extend(["-i", s_path])
            delay_ms = max(0, int(rel_start * 1000))
            filter_parts.append(f"[{idx}:a]adelay={delay_ms}|{delay_ms}[a{idx}]")

        inputs_str = "".join([f"[a{i}]" for i in range(len(seg_files))])
        mix_filter = f"{';'.join(filter_parts)};{inputs_str}amix=inputs={len(seg_files)}:duration=longest:dropout_transition=0,aformat=sample_fmts=s16:sample_rates=16000:channel_layouts=mono[out]"

        cmd_mix.extend([
            "-filter_complex", mix_filter,
            "-map", "[out]",
            master_wav
        ])

        try:
            rMix = subprocess.run(cmd_mix, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            if rMix.returncode == 0 and os.path.exists(master_wav) and os.path.getsize(master_wav) > 1000:
                for s_path, _ in seg_files:
                    try: os.remove(s_path)
                    except Exception: pass
                return master_wav
            else:
                mix_err = rMix.stderr.decode("utf-8", errors="ignore") if rMix.stderr else "Unknown mix error"
                print(f"Multi-layer FFmpeg mix failed ({mix_err[:200]}), returning primary layer segment fallback...")
                return seg_files[0][0]
        except Exception as eMix:
            print(f"FFmpeg mix exception ({eMix}), returning primary layer segment fallback...")
            return seg_files[0][0]

    def process_single_clip_audio(self, audio_file_path, model_obj, is_faster_whisper, task, whisper_lang, remove_fillers, max_chars, max_dur, gap_frames, line_mode, target_language):
        """Transcribes a single WAV file using preloaded Whisper model and returns (captions, words, warning)."""
        result_segments = []
        if is_faster_whisper:
            segments, info = model_obj.transcribe(audio_file_path, word_timestamps=True, task=task, language=whisper_lang)
            for seg in segments:
                words = []
                if hasattr(seg, 'words') and seg.words:
                    for w in seg.words:
                        words.append({"word": w.word, "start": w.start, "end": w.end})
                result_segments.append({"text": seg.text, "words": words, "start": seg.start, "end": seg.end})
        else:
            kwargs = {"word_timestamps": True, "task": task}
            if whisper_lang:
                kwargs["language"] = whisper_lang
            res = model_obj.transcribe(audio_file_path, **kwargs)
            result_segments = res.get("segments", [])

        captions = []
        words_output = []

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

        cue_idx = 0
        current_words = []

        def ends_with_sentence_punct(w_str):
            return bool(re.search(r'[.!?|।]\s*$', w_str))

        def ends_with_clause_punct(w_str):
            return bool(re.search(r'[,;:—\-]\s*$', w_str))

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

            if not current_words:
                w_obj["cue_index"] = cue_idx
                current_words = [w_obj]
            else:
                prev_w = current_words[-1]["word"]
                cand_text = " ".join([w["word"] for w in current_words] + [word])
                cand_dur = end - current_words[0]["start"]

                has_sentence_end = ends_with_sentence_punct(prev_w)
                has_clause_end = ends_with_clause_punct(prev_w)
                pause_gap = start - current_words[-1]["end"]

                should_split = False

                # 1. Split on strong sentence boundaries (. ! ? ।) when current cue is meaningful
                if has_sentence_end and (len(" ".join([w["word"] for w in current_words])) >= 10 or cand_dur > (max_dur * 0.4) or pause_gap >= 0.2):
                    should_split = True
                # 2. Exceeding max_chars or max_dur limits
                elif len(cand_text) > max_chars or cand_dur > max_dur:
                    should_split = True
                # 3. Audio pause > 0.5s between words
                elif pause_gap > 0.5 and len(" ".join([w["word"] for w in current_words])) >= 12:
                    should_split = True

                if should_split:
                    cue_start = current_words[0]["start"]
                    cue_end = current_words[-1]["end"]
                    cue_text = " ".join([w["word"] for w in current_words])

                    captions.append({
                        "text": self.format_lines(cue_text, line_mode),
                        "start": round(cue_start, 3),
                        "end": round(cue_end, 3)
                    })
                    words_output.extend(current_words)

                    cue_idx += 1
                    w_obj["cue_index"] = cue_idx
                    current_words = [w_obj]
                else:
                    w_obj["cue_index"] = cue_idx
                    current_words.append(w_obj)

        if current_words:
            cue_start = current_words[0]["start"]
            cue_end = current_words[-1]["end"]
            cue_text = " ".join([w["word"] for w in current_words])

            captions.append({
                "text": self.format_lines(cue_text, line_mode),
                "start": round(cue_start, 3),
                "end": round(cue_end, 3)
            })
            words_output.extend(current_words)

        # Obvious hallucination phrases commonly generated by Whisper on silence/short audio
        hallucinations = {
            "thank you for watching", "subtitles by", "amara.org", "mbc", 
            "subscribe", "like and subscribe", "captioned by", "thanks for watching",
            "uncensored", "transcribed by", "copyright", "all rights reserved"
        }

        # Filter out empty/hallucinated cues and short duration noise
        valid_caps = []
        valid_words = []

        for cap in captions:
            text_str = cap.get("text", "").strip()
            # 1. Drop cues with empty / whitespace-only text
            if not text_str:
                continue

            txt_clean = re.sub(r'[^\w\s]', '', text_str).strip()
            # 1b. Drop cues if clean alphanumeric text is completely empty
            if not txt_clean:
                continue

            dur = cap.get("end", 0.0) - cap.get("start", 0.0)
            # 2. Drop cues shorter than 0.2s unless they contain real text (>=2 chars)
            if dur < 0.2 and len(txt_clean) < 2:
                continue

            # 3. Trim obvious hallucinated fragments when text contains hallucination phrase
            lower_clean = txt_clean.lower()
            if any(h in lower_clean for h in hallucinations) and (len(txt_clean) < 35 or dur > 6.0):
                continue

            valid_caps.append(cap)

        # Retain words that correspond to valid kept cues
        for w_item in words_output:
            w_str = w_item.get("word", "").strip()
            if not w_str:
                continue
            w_clean = re.sub(r'[^\w\s]', '', w_str).strip()
            if not w_clean:
                continue
            valid_words.append(w_item)

        captions = valid_caps
        words_output = valid_words

        # Non-English Target Translation: Translate Cues and Words
        translation_warning = None
        if target_language not in ["none", "en"]:
            try:
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

                for w_item in words_output:
                    if w_item.get("word"):
                        w_raw = w_item["word"].strip()
                        if w_raw:
                            t_w = translate_text(w_raw, target_language)
                            if t_w:
                                w_item["word"] = t_w
            except Exception as tr_err:
                translation_warning = f"Translation to '{target_language}' failed ({str(tr_err)}). Using original audio text."

        return captions, words_output, translation_warning

    def transcribe_audio(self, audio_path, model_name="base", device="auto", language="auto", target_language="none", remove_fillers=False, max_chars=42, max_dur=3.0, gap_frames=0, line_mode="double"):
        import subprocess
        import shutil

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

        print(f"Loading Whisper model '{model_name}' on device '{device}'...")
        cache_dir = os.path.expanduser("~/.cache/whisper")
        os.makedirs(cache_dir, exist_ok=True)

        task = "translate" if (target_language == "en") else "transcribe"
        whisper_lang = None if (language == "auto" or not language) else language

        # Load Whisper model ONCE for high efficiency
        is_faster_whisper = False
        model_obj = None
        try:
            from faster_whisper import WhisperModel
            compute_type = "float16" if device == "cuda" else "int8"
            model_obj = WhisperModel(model_name, device=device, compute_type=compute_type, download_root=cache_dir)
            is_faster_whisper = True
        except Exception as e:
            print(f"faster-whisper unavailable ({e}), loading standard whisper...")
            import whisper
            model_obj = whisper.load_model(model_name, device=device, download_root=cache_dir)

        # Resolve FFmpeg binary
        ffmpeg_bin = self.ffmpeg_exe
        if not os.path.exists(ffmpeg_bin):
            ffmpeg_bin = shutil.which("ffmpeg") or "ffmpeg"

        master_captions = []
        master_words = []
        warnings_list = []

        # If audio_path is comp manifest JSON: PER-CLIP TRANSCRIPTION
        if audio_path.endswith(".json") and os.path.exists(audio_path):
            file_size = os.path.getsize(audio_path)
            if file_size == 0:
                raise RuntimeError(f"Comp manifest file at '{audio_path}' is empty (0 bytes).")

            with open(audio_path, 'r', encoding='utf-8-sig') as f:
                manifest_data = json.load(f)

            clips = manifest_data.get("clips", [])
            if not clips:
                raise RuntimeError("No footage or audio layers found in comp manifest JSON.")

            temp_dir = os.path.dirname(audio_path)
            print(f"Starting Per-Clip Transcription for {len(clips)} layer(s)...")

            for idx, clip in enumerate(clips):
                m_path = clip.get("mediaPath", "")
                if not m_path or not os.path.exists(m_path):
                    warnings_list.append(f"Skipped layer {idx+1}: Media file missing '{m_path}'")
                    continue

                c_in = clip.get("mediaCutIn", 0.0)
                dur = clip.get("cutDuration", 1.0)
                rel_start = clip.get("relSeqStart", 0.0)
                c_name = clip.get("clipName", f"Layer_{idx+1}")

                seg_path = os.path.join(temp_dir, f"cgp_ae_seg_{idx}.wav")
                cmd_trim = [
                    ffmpeg_bin, "-y",
                    "-ss", str(c_in),
                    "-t", str(dur),
                    "-i", m_path,
                    "-vn", "-sn",
                    "-ar", "16000",
                    "-ac", "1",
                    "-c:a", "pcm_s16le",
                    seg_path
                ]
                try:
                    rTrim = subprocess.run(cmd_trim, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                    if rTrim.returncode != 0 or not os.path.exists(seg_path) or os.path.getsize(seg_path) <= 500:
                        warnings_list.append(f"Skipped layer {idx+1} ({c_name}): Audio extraction failed")
                        continue
                except Exception as eExtract:
                    warnings_list.append(f"Skipped layer {idx+1} ({c_name}): {eExtract}")
                    continue

                # Per-Clip Whisper Pass (Auto language detects per clip if source language is 'auto')
                try:
                    c_caps, c_words, c_warn = self.process_single_clip_audio(
                        seg_path, model_obj, is_faster_whisper, task, whisper_lang,
                        remove_fillers, max_chars, max_dur, gap_frames, line_mode, target_language
                    )
                    if c_warn: warnings_list.append(f"Layer {idx+1} ({c_name}): {c_warn}")

                    # Apply layer relative comp start offset to all cue & word timestamps
                    for cap in c_caps:
                        cap["start"] = round(cap["start"] + rel_start, 3)
                        cap["end"] = round(cap["end"] + rel_start, 3)
                        master_captions.append(cap)

                    for w in c_words:
                        w["start"] = round(w["start"] + rel_start, 3)
                        w["end"] = round(w["end"] + rel_start, 3)
                        master_words.append(w)

                except Exception as eClipTr:
                    warnings_list.append(f"Skipped layer {idx+1} ({c_name}): Transcription error ({eClipTr})")
                finally:
                    try: os.remove(seg_path)
                    except Exception: pass

        else:
            # Single audio WAV file transcription
            c_caps, c_words, c_warn = self.process_single_clip_audio(
                audio_path, model_obj, is_faster_whisper, task, whisper_lang,
                remove_fillers, max_chars, max_dur, gap_frames, line_mode, target_language
            )
            if c_warn: warnings_list.append(c_warn)
            master_captions = c_caps
            master_words = c_words

        if not master_captions:
            err_msg = "; ".join(warnings_list) if warnings_list else "No speech detected in timeline audio."
            raise RuntimeError(f"Transcription yielded no subtitle cues. ({err_msg})")

        # 4. Ensure merged captions & words are sorted strictly by start time (then end time)
        master_captions.sort(key=lambda x: (x["start"], x["end"]))
        master_words.sort(key=lambda x: (x["start"], x["end"]))

        # 5. Keep word-level data aligned after merge & reassign cue_index sequentially
        aligned_words = []
        for w in master_words:
            w_start = w["start"]
            found_cue = -1
            for idx, cap in enumerate(master_captions):
                if cap["start"] <= w_start <= cap["end"]:
                    found_cue = idx
                    break
                elif cap["start"] <= w_start + 0.15 and w_start <= cap["end"] + 0.15:
                    found_cue = idx
                    break

            if found_cue != -1:
                w["cue_index"] = found_cue
                aligned_words.append(w)
            elif master_captions:
                closest_idx = 0
                min_diff = 999999
                for idx, cap in enumerate(master_captions):
                    diff = min(abs(w_start - cap["start"]), abs(w_start - cap["end"]))
                    if diff < min_diff:
                        min_diff = diff
                        closest_idx = idx
                if min_diff <= 0.5:
                    w["cue_index"] = closest_idx
                    aligned_words.append(w)

        master_words = aligned_words
        combined_warning = "; ".join(warnings_list) if warnings_list else None
        return master_captions, master_words, combined_warning

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
