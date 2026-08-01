import os
import sys
import shutil
import zipfile
import argparse
import json
import time
import ssl
import urllib.request

WHISPER_URLS = {
    "tiny": "https://openaipublic.azureedge.net/main/whisper/models/65147644a518d12f04e32d6f3b26facc3f8dd46e5390956a9424a650c0ce22b9/tiny.pt",
    "base": "https://openaipublic.azureedge.net/main/whisper/models/ed3a0b6b1c0edf879ad9b11b1af5a0e6ab5db9205f891f668f8b0e6c6326e34e/base.pt",
    "small": "https://openaipublic.azureedge.net/main/whisper/models/9ecf779972d90ba49c06d968637d720dd632c55bbf19d441fb42bf17a411e794/small.pt",
    "medium": "https://openaipublic.azureedge.net/main/whisper/models/345ae4da62f9b3d59415adc60127b97c714f32e89e936602e85993674d08dcb1/medium.pt",
    "large-v3": "https://openaipublic.azureedge.net/main/whisper/models/e5b1a55b89c1367dacf97e3e19bfd829a01529dbfdeefa8caeb59b3f1b81dadb/large-v3.pt",
    "large-v3-turbo": "https://openaipublic.azureedge.net/main/whisper/models/aff26ae408abcba5fbf8813c21e62b0941638c5f6eebfb145be0c9839262a19a/large-v3-turbo.pt"
}

class DependencyChecker:
    MODEL_INFO = {
        "tiny": {"name": "Tiny", "size": "75 MB", "desc": "Fastest execution, lower accuracy. Ideal for quick drafts.", "whisper_name": "tiny"},
        "base": {"name": "Base", "size": "145 MB", "desc": "Fast and standard accuracy. Recommended for general video audio.", "whisper_name": "base"},
        "small": {"name": "Small", "size": "480 MB", "desc": "Balanced speed and accuracy. Great for clear speech.", "whisper_name": "small"},
        "medium": {"name": "Medium", "size": "1.5 GB", "desc": "High accuracy. Excellent for complex vocabulary and podcasts.", "whisper_name": "medium"},
        "large-v3": {"name": "Large-v3", "size": "3.0 GB", "desc": "Maximum accuracy. Best for accents and multi-lingual audio.", "whisper_name": "large-v3"}
    }

    def __init__(self, base_dir=None):
        self.base_dir = base_dir or os.getcwd()
        self.bin_dir = os.path.join(self.base_dir, "bin")
        self.ffmpeg_exe = os.path.join(self.bin_dir, "ffmpeg.exe")
        self.cache_dir = os.path.expanduser("~/.cache/whisper")

    def check_python(self):
        try:
            version_str = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
            return True, version_str
        except Exception:
            return False, "Unknown"

    def check_whisper_pkg(self):
        try:
            import whisper
            return True
        except ImportError:
            return False

    def check_pytorch(self):
        try:
            import torch
            has_cuda = torch.cuda.is_available()
            return True, torch.__version__, has_cuda
        except ImportError:
            return False, "Not Installed", False

    def check_ffmpeg(self):
        if os.path.exists(self.ffmpeg_exe):
            return True
        return shutil.which("ffmpeg") is not None

    def check_cache_dir(self):
        try:
            os.makedirs(self.cache_dir, exist_ok=True)
            test_file = os.path.join(self.cache_dir, ".perm_test")
            with open(test_file, "w") as f:
                f.write("ok")
            if os.path.exists(test_file):
                os.remove(test_file)
            return True
        except Exception:
            return False

    def get_installed_models(self):
        installed = []
        for model_key in self.MODEL_INFO.keys():
            model_pt = os.path.join(self.cache_dir, f"{model_key}.pt")
            local_model = os.path.join(self.base_dir, "models", f"{model_key}.pt")
            if os.path.exists(model_pt) or os.path.exists(local_model):
                installed.append(model_key)
        return installed

    def get_models_detailed(self):
        installed = self.get_installed_models()
        models_list = []
        for key, info in self.MODEL_INFO.items():
            models_list.append({
                "key": key,
                "name": info["name"],
                "size": info["size"],
                "desc": info["desc"],
                "installed": key in installed
            })
        return models_list

    def delete_model(self, model_name):
        deleted = False
        model_pt = os.path.join(self.cache_dir, f"{model_name}.pt")
        local_model = os.path.join(self.base_dir, "models", f"{model_name}.pt")

        if os.path.exists(model_pt):
            try:
                os.remove(model_pt)
                deleted = True
            except Exception as e:
                print(f"Error removing {model_pt}: {e}")

        if os.path.exists(local_model):
            try:
                os.remove(local_model)
                deleted = True
            except Exception as e:
                print(f"Error removing {local_model}: {e}")

        return deleted

    def download_ffmpeg(self, progress_callback):
        if self.check_ffmpeg():
            progress_callback("FFmpeg binary ready.", 100)
            return

        progress_callback("Downloading FFmpeg package...", 10)
        os.makedirs(self.bin_dir, exist_ok=True)
        url = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"
        zip_path = os.path.join(self.bin_dir, "ffmpeg.zip")

        try:
            ctx = ssl._create_unverified_context()
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, context=ctx, timeout=30) as response:
                total_len = int(response.headers.get('content-length', 0))
                downloaded = 0
                start_time = time.time()

                with open(zip_path, 'wb') as f:
                    chunk_size = 256 * 1024
                    while True:
                        chunk = response.read(chunk_size)
                        if not chunk:
                            break
                        f.write(chunk)
                        downloaded += len(chunk)
                        if total_len > 0:
                            pct = int((downloaded / total_len) * 70) + 10
                            mb = downloaded / (1024 * 1024)
                            progress_callback(f"Downloading FFmpeg... {mb:.1f} MB", pct)

            progress_callback("Extracting FFmpeg binary...", 85)
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(self.bin_dir)

            for root, dirs, files in os.walk(self.bin_dir):
                if "ffmpeg.exe" in files:
                    shutil.move(os.path.join(root, "ffmpeg.exe"), self.ffmpeg_exe)
                    break

            if os.path.exists(zip_path):
                os.remove(zip_path)

            progress_callback("FFmpeg installation complete!", 100)
        except Exception as e:
            progress_callback(f"FFmpeg download failed: {str(e)}", 0)

    def download_whisper_model(self, model_name, progress_callback):
        url = None
        try:
            import whisper
            if hasattr(whisper, "_MODELS") and model_name in whisper._MODELS:
                url = whisper._MODELS[model_name]
        except Exception:
            pass

        if not url:
            url = WHISPER_URLS.get(model_name)

        if not url:
            progress_callback(f"Unknown model '{model_name}'", 0)
            return

        os.makedirs(self.cache_dir, exist_ok=True)
        dest_pt = os.path.join(self.cache_dir, f"{model_name}.pt")
        temp_pt = os.path.join(self.cache_dir, f"{model_name}.pt.tmp")

        progress_callback(f"Connecting to model server for '{model_name}'...", 5)

        try:
            ctx = ssl._create_unverified_context()
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, context=ctx, timeout=30) as response:
                total_bytes = int(response.headers.get('Content-Length', 0))
                downloaded_bytes = 0
                start_time = time.time()
                last_update_time = start_time

                with open(temp_pt, 'wb') as f:
                    chunk_size = 256 * 1024
                    while True:
                        chunk = response.read(chunk_size)
                        if not chunk:
                            break
                        f.write(chunk)
                        downloaded_bytes += len(chunk)

                        now = time.time()
                        if now - last_update_time >= 0.2 or downloaded_bytes == total_bytes:
                            last_update_time = now
                            elapsed = max(0.05, now - start_time)
                            speed_bps = downloaded_bytes / elapsed
                            speed_mbps = speed_bps / (1024 * 1024)

                            pct = int((downloaded_bytes / total_bytes) * 95) if total_bytes > 0 else 50
                            
                            downloaded_mb = downloaded_bytes / (1024 * 1024)
                            total_mb = total_bytes / (1024 * 1024) if total_bytes > 0 else 0

                            remaining_bytes = max(0, total_bytes - downloaded_bytes)
                            eta_sec = int(remaining_bytes / speed_bps) if speed_bps > 0 else 0
                            
                            if eta_sec >= 60:
                                eta_str = f"{eta_sec // 60}m {eta_sec % 60}s"
                            else:
                                eta_str = f"{eta_sec}s"

                            status_msg = f"{downloaded_mb:.1f} MB / {total_mb:.1f} MB | Speed: {speed_mbps:.1f} MB/s | ETA: {eta_str}"
                            progress_callback(status_msg, pct)

            if os.path.exists(temp_pt):
                if os.path.exists(dest_pt):
                    os.remove(dest_pt)
                os.rename(temp_pt, dest_pt)

            progress_callback(f"Whisper Model '{model_name}' ready!", 100)
        except Exception as e:
            if os.path.exists(temp_pt):
                try: os.remove(temp_pt)
                except: pass
            progress_callback(f"Error downloading model: {str(e)}", 0)

def main():
    parser = argparse.ArgumentParser(description="Dependency Checker & Installer CLI")
    parser.add_argument("--action", choices=["status", "install", "delete"], default="status")
    parser.add_argument("--base_dir", default="", help="Extension base directory")
    parser.add_argument("--models", nargs="*", default=["base"], help="List of models to install or delete")
    args = parser.parse_args()

    checker = DependencyChecker(base_dir=args.base_dir if args.base_dir else None)

    if args.action == "status":
        py_ok, py_ver = checker.check_python()
        torch_ok, torch_ver, cuda_ok = checker.check_pytorch()
        whisper_ok = checker.check_whisper_pkg()
        ffmpeg_ok = checker.check_ffmpeg()
        cache_ok = checker.check_cache_dir()

        status = {
            "python": py_ok,
            "python_version": py_ver,
            "pytorch": torch_ok,
            "pytorch_version": torch_ver,
            "cuda_available": cuda_ok,
            "whisper_pkg": whisper_ok,
            "ffmpeg": ffmpeg_ok,
            "cache_ready": cache_ok,
            "cache_dir": checker.cache_dir.replace("\\", "/"),
            "installed_models": checker.get_installed_models(),
            "models_detailed": checker.get_models_detailed()
        }
        print(json.dumps(status))
    elif args.action == "delete":
        results = {}
        for m in args.models:
            results[m] = checker.delete_model(m)
        print(json.dumps({"success": True, "deleted": results}))
    elif args.action == "install":
        def progress(msg, pct):
            print(f"PROGRESS:{pct}:{msg}")
            sys.stdout.flush()

        checker.download_ffmpeg(progress)

        for model in args.models:
            checker.download_whisper_model(model, progress)

        print("PROGRESS:100:Setup completed successfully!")

if __name__ == "__main__":
    main()
