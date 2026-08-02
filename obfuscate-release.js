const fs = require("fs");
const path = require("path");
const JavaScriptObfuscator = require("javascript-obfuscator");

const ROOT_DIR = __dirname;
const RELEASE_DIR = path.join(ROOT_DIR, "release");

const OBFUSCATE_FILES = [
    "main.js",
    "license.js",
    "extendscript_bridge.js",
    "settings.js",
    "editor.js",
    "installer.js"
];

const OBFUSCATOR_OPTIONS = {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.5,
    stringArray: true,
    stringArrayEncoding: ["base64"],
    renameGlobals: false,
    selfDefending: false
};

function copyRecursiveSync(src, dest) {
    var exists = fs.existsSync(src);
    var stats = exists && fs.statSync(src);
    var isDirectory = exists && stats.isDirectory();
    if (isDirectory) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        fs.readdirSync(src).forEach(function(childItemName) {
            if (childItemName === "node_modules" || childItemName === ".git" || childItemName === "release" || childItemName === "package-lock.json") {
                return;
            }
            copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
        });
    } else {
        var destDir = path.dirname(dest);
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }
        fs.copyFileSync(src, dest);
    }
}

console.log("=================================================");
console.log("  CAPTION GENERATOR PRO - CUSTOMER RELEASE BUILD ");
console.log("=================================================");

if (fs.existsSync(RELEASE_DIR)) {
    console.log("🧹 Cleaning old release directory...");
    fs.rmSync(RELEASE_DIR, { recursive: true, force: true });
}
fs.mkdirSync(RELEASE_DIR, { recursive: true });

console.log("📁 Copying extension source folders to release/ ...");

const targets = ["Premiere Pro", "After Effects"];

targets.forEach(function(item) {
    const srcPath = path.join(ROOT_DIR, item);
    const destPath = path.join(RELEASE_DIR, item);
    if (fs.existsSync(srcPath)) {
        copyRecursiveSync(srcPath, destPath);
    }
});

console.log("🔒 Obfuscating client JS files in release folder...");

let obfuscatedCount = 0;

function processDirectory(dirPath) {
    const items = fs.readdirSync(dirPath);
    items.forEach(function(item) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (stat.isFile()) {
            const fileName = path.basename(fullPath);
            const relativePath = path.relative(RELEASE_DIR, fullPath).replace(/\\/g, "/");

            if (OBFUSCATE_FILES.includes(fileName)) {
                if (relativePath.includes("client/js/") && !relativePath.includes("client/js/lib/")) {
                    console.log("  ⚡ Obfuscated: " + relativePath);
                    const rawCode = fs.readFileSync(fullPath, "utf-8");
                    const obfuscatedResult = JavaScriptObfuscator.obfuscate(rawCode, OBFUSCATOR_OPTIONS);
                    fs.writeFileSync(fullPath, obfuscatedResult.getObfuscatedCode(), "utf-8");
                    obfuscatedCount++;
                }
            }
        }
    });
}

processDirectory(RELEASE_DIR);

console.log("📄 Generating customer installer scripts & setup guide...");

// 1. install.bat
const installBatContent = `@echo off
TITLE Caption Generator Pro - 1-Click Installer

cd /d "%~dp0"

color 0A
echo ================================================================
echo       CAPTION GENERATOR PRO - 1-CLICK ALL EXTENSIONS INSTALLER
echo ================================================================
echo.

set "TARGET_PP=%APPDATA%\\Adobe\\CEP\\extensions\\CaptionGeneratorPro"
set "TARGET_AE=%APPDATA%\\Adobe\\CEP\\extensions\\CaptionGeneratorProAE"

echo 1. Enabling Adobe Debug Mode (CSXS 4 - 20)...
REG ADD "HKCU\\Software\\Adobe\\CSXS.4" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
REG ADD "HKCU\\Software\\Adobe\\CSXS.5" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
REG ADD "HKCU\\Software\\Adobe\\CSXS.6" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
REG ADD "HKCU\\Software\\Adobe\\CSXS.7" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
REG ADD "HKCU\\Software\\Adobe\\CSXS.8" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
REG ADD "HKCU\\Software\\Adobe\\CSXS.9" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
REG ADD "HKCU\\Software\\Adobe\\CSXS.10" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
REG ADD "HKCU\\Software\\Adobe\\CSXS.11" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
REG ADD "HKCU\\Software\\Adobe\\CSXS.12" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
REG ADD "HKCU\\Software\\Adobe\\CSXS.13" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
REG ADD "HKCU\\Software\\Adobe\\CSXS.14" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
REG ADD "HKCU\\Software\\Adobe\\CSXS.15" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
REG ADD "HKCU\\Software\\Adobe\\CSXS.16" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
REG ADD "HKCU\\Software\\Adobe\\CSXS.17" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
REG ADD "HKCU\\Software\\Adobe\\CSXS.18" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
REG ADD "HKCU\\Software\\Adobe\\CSXS.19" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
REG ADD "HKCU\\Software\\Adobe\\CSXS.20" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1

echo.
echo 2. Installing Premiere Pro Extension to AppData...
if not exist "%APPDATA%\\Adobe\\CEP\\extensions" mkdir "%APPDATA%\\Adobe\\CEP\\extensions"
if exist "%TARGET_PP%" rmdir /s /q "%TARGET_PP%"
xcopy "Premiere Pro" "%TARGET_PP%\\" /E /I /H /Y /Q >nul

echo 3. Installing After Effects Extension to AppData...
if exist "%TARGET_AE%" rmdir /s /q "%TARGET_AE%"
xcopy "After Effects" "%TARGET_AE%\\" /E /I /H /Y /Q >nul

echo.
echo ================================================================
echo    SUCCESS! Caption Generator Pro Installed Successfully!
echo.
echo    1. Open Premiere Pro or After Effects.
echo    2. Go to: Window -> Extensions -> Caption Generator Pro
echo    3. Activate your license in Settings tab and enjoy!
echo ================================================================
echo.
pause
`;

fs.writeFileSync(path.join(RELEASE_DIR, "install.bat"), installBatContent, "utf-8");

// 2. uninstall.bat
const uninstallBatContent = `@echo off
TITLE Caption Generator Pro - Uninstaller

cd /d "%~dp0"

echo ================================================================
echo      REMOVING CAPTION GENERATOR PRO EXTENSIONS FROM APPDATA
echo ================================================================
echo.

set "TARGET_PP=%APPDATA%\\Adobe\\CEP\\extensions\\CaptionGeneratorPro"
set "TARGET_AE=%APPDATA%\\Adobe\\CEP\\extensions\\CaptionGeneratorProAE"

if exist "%TARGET_PP%" (
    echo Removing Premiere Pro extension...
    rmdir /s /q "%TARGET_PP%"
)

if exist "%TARGET_AE%" (
    echo Removing After Effects extension...
    rmdir /s /q "%TARGET_AE%"
)

echo.
echo ================================================================
echo    Uninstall Complete! Extensions removed.
echo ================================================================
echo.
pause
`;

fs.writeFileSync(path.join(RELEASE_DIR, "uninstall.bat"), uninstallBatContent, "utf-8");

// 3. SETUP_GUIDE.txt
const setupGuideContent = `================================================================
          CAPTION GENERATOR PRO v2.0.0 - QUICK SETUP GUIDE
================================================================

Step 1: Install Extensions
  - Double-click 'install.bat' to install both Premiere Pro and After Effects extensions.

Step 2: Launch Adobe Software
  - Open Adobe Premiere Pro or Adobe After Effects.

Step 3: Open the Extension Panel
  - Go to top menu: Window -> Extensions -> Caption Generator Pro (or Caption Generator Pro AE).

Step 4: Activate Your License
  - Click on the 'Settings' tab inside the extension.
  - Enter your license key in the License section and click 'Activate License'.

Step 5: Download Speech Model
  - Under 'Speech Models Manager' in Settings, click 'Download Model' on Base or Small.

Step 6: Configure Language & Caption Style
  - In 'Transcribe' tab, select your Source Audio Language (or Auto).
  - Optionally pick a Translate To target language.
  - Choose a Caption Style Preset:
    * Standard (Default Subtitles)
    * Clean Professional (Lower-third minimalist)
    * Hormozi Pop (Bold center pop-in animations)
    * Karaoke Highlight (Word-by-word active glow)
    * Podcast Soft (Minimalist audio subtitles)

Step 7: Transcribe & Create Styled Subtitles
  - Click 'Transcribe Timeline' (or 'Transcribe Active Comp').
  - Review / edit cues in the 'Editor' tab (view real-time Style badge).
  - Click 'Create Subtitles' to generate styled caption elements directly on your timeline!

================================================================
Support & License Help: Contact your vendor / support channel.
================================================================
`;

fs.writeFileSync(path.join(RELEASE_DIR, "SETUP_GUIDE.txt"), setupGuideContent, "utf-8");

console.log("=================================================");
console.log(`✅ Build completed! ${obfuscatedCount} client JS files protected.`);
console.log("📍 Distribution release folder: " + RELEASE_DIR);
console.log("=================================================");
