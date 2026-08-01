@echo off
TITLE Caption Generator Pro - Master Installer

cd /d "%~dp0"

color 0A
echo ================================================================
echo     CAPTION GENERATOR PRO - 1-CLICK ALL EXTENSIONS INSTALLER
echo ================================================================
echo.
echo Installing Caption Generator Pro for Premiere Pro and After Effects...
echo.

set "PPRO_CEP_DIR=%APPDATA%\Adobe\CEP\extensions\CaptionGeneratorPro"
set "AE_CEP_DIR=%APPDATA%\Adobe\CEP\extensions\CaptionGeneratorProAE"

if not exist "%APPDATA%\Adobe\CEP\extensions" mkdir "%APPDATA%\Adobe\CEP\extensions"
if not exist "%USERPROFILE%\.cache\whisper" mkdir "%USERPROFILE%\.cache\whisper"

echo ----------------------------------------------------------------
echo [1/2] Installing Premiere Pro Extension...
echo ----------------------------------------------------------------
if exist "%PPRO_CEP_DIR%" rmdir /S /Q "%PPRO_CEP_DIR%"
mkdir "%PPRO_CEP_DIR%"

if exist "%~dp0Premiere Pro\CSXS"    xcopy /E /I /Y "%~dp0Premiere Pro\CSXS"    "%PPRO_CEP_DIR%\CSXS"    >nul
if exist "%~dp0Premiere Pro\client"  xcopy /E /I /Y "%~dp0Premiere Pro\client"  "%PPRO_CEP_DIR%\client"  >nul
if exist "%~dp0Premiere Pro\host"    xcopy /E /I /Y "%~dp0Premiere Pro\host"    "%PPRO_CEP_DIR%\host"    >nul
if exist "%~dp0Premiere Pro\backend" xcopy /E /I /Y "%~dp0Premiere Pro\backend" "%PPRO_CEP_DIR%\backend" >nul
if exist "%~dp0Premiere Pro\bin"     xcopy /E /I /Y "%~dp0Premiere Pro\bin"     "%PPRO_CEP_DIR%\bin"     >nul
if exist "%~dp0Premiere Pro\logo.png" copy /Y "%~dp0Premiere Pro\logo.png" "%PPRO_CEP_DIR%\" >nul
if exist "%~dp0Premiere Pro\.debug"   copy /Y "%~dp0Premiere Pro\.debug"   "%PPRO_CEP_DIR%\" >nul
echo -- Premiere Pro Extension installed successfully!
echo.

echo ----------------------------------------------------------------
echo [2/2] Installing After Effects Extension...
echo ----------------------------------------------------------------
if exist "%AE_CEP_DIR%" rmdir /S /Q "%AE_CEP_DIR%"
mkdir "%AE_CEP_DIR%"

if exist "%~dp0After Effects\CSXS"    xcopy /E /I /Y "%~dp0After Effects\CSXS"    "%AE_CEP_DIR%\CSXS"    >nul
if exist "%~dp0After Effects\client"  xcopy /E /I /Y "%~dp0After Effects\client"  "%AE_CEP_DIR%\client"  >nul
if exist "%~dp0After Effects\host"    xcopy /E /I /Y "%~dp0After Effects\host"    "%AE_CEP_DIR%\host"    >nul
if exist "%~dp0After Effects\backend" xcopy /E /I /Y "%~dp0After Effects\backend" "%AE_CEP_DIR%\backend" >nul
if exist "%~dp0After Effects\bin"     xcopy /E /I /Y "%~dp0After Effects\bin"     "%AE_CEP_DIR%\bin"     >nul
if exist "%~dp0After Effects\logo.png" copy /Y "%~dp0After Effects\logo.png" "%AE_CEP_DIR%\" >nul
if exist "%~dp0After Effects\.debug"   copy /Y "%~dp0After Effects\.debug"   "%AE_CEP_DIR%\" >nul
echo -- After Effects Extension installed successfully!
echo.

echo ----------------------------------------------------------------
echo Enabling PlayerDebugMode for Adobe CSXS (CSXS 4 - 20)...
echo ----------------------------------------------------------------
for %%v in (4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20) do (
    reg add "HKCU\Software\Adobe\CSXS.%%v" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
)

echo.
echo ================================================================
echo SUCCESS! ALL EXTENSIONS INSTALLED AND READY TO USE!
echo ================================================================
echo.
echo Quick Launch Steps:
echo 1. Quit Premiere Pro / After Effects completely if running.
echo 2. Open Adobe Premiere Pro:
echo    - Go to Window -^> Extensions -^> Caption Generator Pro
echo 3. Open Adobe After Effects:
echo    - Go to Window -^> Extensions -^> Caption Generator Pro (AE)
echo.
pause
