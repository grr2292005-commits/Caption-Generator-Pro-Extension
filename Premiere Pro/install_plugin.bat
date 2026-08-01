@echo off
TITLE Caption Generator Pro (Premiere Pro) - Installer

cd /d "%~dp0"

color 0A
echo ================================================================
echo       CAPTION GENERATOR PRO (PREMIERE PRO) - INSTALLER
echo ================================================================
echo.
echo Installing Premiere Pro extension into user AppData...
echo.

set "USER_CEP_DIR=%APPDATA%\Adobe\CEP\extensions\CaptionGeneratorPro"

if not exist "%APPDATA%\Adobe\CEP\extensions" mkdir "%APPDATA%\Adobe\CEP\extensions"
if not exist "%USERPROFILE%\.cache\whisper" mkdir "%USERPROFILE%\.cache\whisper"

if exist "%USER_CEP_DIR%" rmdir /S /Q "%USER_CEP_DIR%"
mkdir "%USER_CEP_DIR%"

xcopy /E /I /Y "%~dp0CSXS"    "%USER_CEP_DIR%\CSXS"    >nul
xcopy /E /I /Y "%~dp0client"  "%USER_CEP_DIR%\client"  >nul
xcopy /E /I /Y "%~dp0host"    "%USER_CEP_DIR%\host"    >nul
xcopy /E /I /Y "%~dp0backend" "%USER_CEP_DIR%\backend" >nul
if exist "%~dp0bin"      xcopy /E /I /Y "%~dp0bin"     "%USER_CEP_DIR%\bin" >nul
if exist "%~dp0logo.png" copy /Y "%~dp0logo.png" "%USER_CEP_DIR%\" >nul
if exist "%~dp0.debug"   copy /Y "%~dp0.debug"   "%USER_CEP_DIR%\" >nul

echo.
echo Enabling PlayerDebugMode for Adobe CSXS...
for %%v in (4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20) do (
    reg add "HKCU\Software\Adobe\CSXS.%%v" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
)

echo.
echo ================================================================
echo SUCCESS! Premiere Pro Extension installed to AppData.
echo ================================================================
echo.
echo Instructions:
echo 1. Fully quit Premiere Pro (check Task Manager)
echo 2. Open Premiere Pro
echo 3. Open Window -^> Extensions -^> Caption Generator Pro
echo.
pause