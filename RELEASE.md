# Caption Generator Pro — Production Release & Obfuscation Guide

This document describes how to generate a secure, obfuscated release build of **Caption Generator Pro** for distribution to end-users without exposing your source code or disrupting your local development setup.

---

## 🔒 Security Architecture

The automated release builder (`obfuscate-release.js`) isolates development from production:

- **Development Source (Root)**:
  - `Premiere Pro/` & `After Effects/` — Clean, un-obfuscated human-readable code.
  - Used for local editing, debugging, and testing.

- **Customer Release Build (`release/`)**:
  - `release/Premiere Pro/` & `release/After Effects/` — Production build.
  - Obfuscates **only** sensitive client-side JavaScript logic:
    - `main.js`
    - `license.js`
    - `extendscript_bridge.js`
    - `settings.js`
    - `editor.js`
    - `installer.js`
  - **Preserved Un-obfuscated**:
    - `CSInterface.js` (Adobe SDK)
    - `host/index.jsx` (ExtendScript host engine)
    - `backend/engine.py` & `backend/dependency_checker.py` (Python backend)
    - `CSXS/manifest.xml` (Extension configuration)
    - `.bat` installers & assets

---

## 🚀 How to Build a Customer Release

### Step 1: Set Your Production Keys (Optional)
Ensure your production `SUPABASE_ANON_KEY` is set at the top of:
- `Premiere Pro/client/js/license.js`
- `After Effects/client/js/license.js`

### Step 2: Run the Release Build Command
Open a terminal in the project root directory and run:

```bash
npm run build:release
```
*(or run directly with `node obfuscate-release.js`)*

### Step 3: Output & Verification
The script will:
1. Create/clean the `release/` folder.
2. Copy all extension files, installers, and assets.
3. Obfuscate all 12 client JavaScript files safely using `javascript-obfuscator` settings.
4. Print completion stats to the console.

### Step 4: Package for Distribution
Zip the contents of `release/` into a single archive (e.g. `CaptionGeneratorPro_v1.0.0.zip`).

---

## 📦 Customer Installation Instructions

Provide the following instructions to buyers:

1. Extract the downloaded ZIP file.
2. Run **`install_all.bat`** (or `install_plugin.bat` inside specific program folder).
3. Restart Adobe Premiere Pro or After Effects.
4. Open the extension via **Window -> Extensions -> Caption Generator Pro**.
5. Enter your license key in the **Settings -> License** tab and click **Activate License**.
