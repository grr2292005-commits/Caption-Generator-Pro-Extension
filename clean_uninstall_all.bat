@echo off
TITLE Caption Generator Pro - Master Uninstaller (All Extensions)

cd /d "%~dp0"

echo ================================================================
echo      REMOVING ALL CAPTION GENERATOR PRO EXTENSIONS
echo ================================================================
echo.

if exist "%APPDATA%\Adobe\CEP\extensions\CaptionGeneratorPro" (
    rmdir /S /Q "%APPDATA%\Adobe\CEP\extensions\CaptionGeneratorPro"
    echo -- Removed Premiere Pro user extension.
)

if exist "%APPDATA%\Adobe\CEP\extensions\CaptionGeneratorProAE" (
    rmdir /S /Q "%APPDATA%\Adobe\CEP\extensions\CaptionGeneratorProAE"
    echo -- Removed After Effects user extension.
)

if exist "C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\CaptionGeneratorPro" (
    rmdir /S /Q "C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\CaptionGeneratorPro"
    echo -- Removed Premiere Pro x86 system extension.
)

if exist "C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\CaptionGeneratorProAE" (
    rmdir /S /Q "C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\CaptionGeneratorProAE"
    echo -- Removed After Effects x86 system extension.
)

if exist "C:\Program Files\Common Files\Adobe\CEP\extensions\CaptionGeneratorPro" (
    rmdir /S /Q "C:\Program Files\Common Files\Adobe\CEP\extensions\CaptionGeneratorPro"
    echo -- Removed Premiere Pro 64-bit system extension.
)

if exist "C:\Program Files\Common Files\Adobe\CEP\extensions\CaptionGeneratorProAE" (
    rmdir /S /Q "C:\Program Files\Common Files\Adobe\CEP\extensions\CaptionGeneratorProAE"
    echo -- Removed After Effects 64-bit system extension.
)

echo.
echo ================================================================
echo SUCCESS: All extensions removed cleanly!
echo ================================================================
echo.
pause
