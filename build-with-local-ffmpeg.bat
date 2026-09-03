@echo off
setlocal
cd /d "%~dp0"
if "%~1"=="" (
  echo Usage: build-with-local-ffmpeg.bat ^<path-to-builder-dist\video-compressor^>
  echo Example: build-with-local-ffmpeg.bat ..\htmlapps-ffmpeg-wasm-builder\dist\video-compressor
  exit /b 2
)
set "LOCAL_FFMPEG=%~1"
echo Building with local FFmpeg WASM: %LOCAL_FFMPEG%
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0build-standalone.ps1" -LocalFfmpegRoot "%LOCAL_FFMPEG%"
if errorlevel 1 exit /b %errorlevel%
start "" "%~dp0dist\index.html"
endlocal
