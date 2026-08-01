@echo off
TITLE Caption Generator Pro - Clean System Uninstaller

cd /d "%~dp0"

:: Request Administrator Privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Requesting Administrator privileges to remove system-wide extension...
    powershell -Command "Start-Process cmd.exe -ArgumentList '/c cd /d \"%~dp0\" && \"%~f0\"' -Verb RunAs" 2>nul
    exit /b
)

echo ================================================================
echo       REMOVING ALL INSTANCES OF CAPTION GENERATOR PRO
echo ================================================================
echo.

echo [1/3] Removing from Program Files (x86)...
if exist "C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\CaptionGeneratorPro" (
    rmdir /S /Q "C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\CaptionGeneratorPro"
    echo       -- Removed x86 system copy.
) else (
    echo       -- No x86 system copy found.
)

echo [2/3] Removing from Program Files (64-bit)...
if exist "C:\Program Files\Common Files\Adobe\CEP\extensions\CaptionGeneratorPro" (
    rmdir /S /Q "C:\Program Files\Common Files\Adobe\CEP\extensions\CaptionGeneratorPro"
    echo       -- Removed 64-bit system copy.
) else (
    echo       -- No 64-bit system copy found.
)

echo [3/3] Removing from User AppData...
if exist "%APPDATA%\Adobe\CEP\extensions\CaptionGeneratorPro" (
    rmdir /S /Q "%APPDATA%\Adobe\CEP\extensions\CaptionGeneratorPro"
    echo       -- Removed user AppData copy.
) else (
    echo       -- No AppData copy found.
)

echo.
echo ================================================================
echo SUCCESS: All stale extension folders deleted!
echo Now run install_plugin.bat to do a clean install.
echo ================================================================
echo.
pause
