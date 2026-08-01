@echo off
TITLE Caption Generator Pro (After Effects) - Uninstaller

cd /d "%~dp0"

echo ================================================================
echo    REMOVING CAPTION GENERATOR PRO (AFTER EFFECTS) EXTENSION
echo ================================================================
echo.

if exist "%APPDATA%\Adobe\CEP\extensions\CaptionGeneratorProAE" (
    rmdir /S /Q "%APPDATA%\Adobe\CEP\extensions\CaptionGeneratorProAE"
    echo -- Removed user AppData extension folder.
) else (
    echo -- No user AppData copy found.
)

if exist "C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\CaptionGeneratorProAE" (
    rmdir /S /Q "C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\CaptionGeneratorProAE"
    echo -- Removed system x86 copy.
)

if exist "C:\Program Files\Common Files\Adobe\CEP\extensions\CaptionGeneratorProAE" (
    rmdir /S /Q "C:\Program Files\Common Files\Adobe\CEP\extensions\CaptionGeneratorProAE"
    echo -- Removed system 64-bit copy.
)

echo.
echo ================================================================
echo SUCCESS: After Effects extension removed cleanly.
echo ================================================================
echo.
pause
