# Caption Generator Pro - Adobe Premiere Pro & After Effects Plugin

**Caption Generator Pro** is an AI-powered extension panel for **Adobe Premiere Pro** and **Adobe After Effects**. It automates video captioning directly inside your Adobe timeline with a single click.

---

## Highlights & Features

- **1-Click Timeline Captioning**: Automatically exports audio from the active Premiere sequence or After Effects composition, transcribes it, and imports captions directly onto your timeline.
- **Selective Model Downloader with Progress Bar**: Choose which Whisper AI models to download (`Base`, `Small`, `Medium`, `Large-v3`, `Tiny`) with clear size and accuracy indicators.
- **In-Panel Subtitle Cue Editor**: View subtitle cues, edit text inline, add/delete cues, and click any timecode to jump the Premiere/AE playhead instantly to that exact frame.
- **Project Versioning Folders (`PROJECT_NAME_VER_{x}`)**: Automatically creates structured backups (`Captions_Versions/PROJECT_NAME_VER_001/`) inside your project directory containing `.srt`, `.vtt`, `.json`, and `.txt` files.
- **Kinetic & Animated Presets**: Support for Standard Subtitles, Kinetic Pop-Up (Hormozi style), and Karaoke Highlight styles.
- **AI Processing**: Built-in filler word cleaner ("um", "uh", "like"), multi-lingual speech-to-English translation, and hardware acceleration selection (GPU CUDA / CPU INT8).

---

## 🚀 1-Click Installation (Windows)

1. Double-click **`install_plugin.bat`** in the project folder.
2. Open **Adobe Premiere Pro** or **Adobe After Effects**.
3. Go to **Window -> Extensions -> Caption Generator Pro**.

---

## 📁 Repository Structure

```
CaptionGeneratorPro/
├── CSXS/
│   └── manifest.xml            # CEP Extension Manifest (Premiere Pro)
├── client/                     # Extension Panel UI (HTML5, Vanilla JS, CSS)
│   ├── index.html              # Panel layout (Transcribe, Editor, Settings)
│   ├── css/style.css           # Adobe Dark Theme stylesheet
│   └── js/                     # Panel controllers, bridge & sub-managers
├── host/                       # Adobe ExtendScript JSX Automation Scripts
│   └── index.jsx               # ES3-compatible host automation engine
├── backend/                    # Python Backend & Model Downloader
│   ├── engine.py               # Core transcription CLI engine (Whisper)
│   └── dependency_checker.py   # Model status & downloader
├── bin/                        # FFmpeg binary directory
├── install_plugin.bat          # 1-Click Installer Script for Windows
└── clean_uninstall.bat         # 1-Click Uninstaller & System Purge Script
```
