# Local Video Compressor

[![GitHub Pages](https://github.com/ttomohisa/htmlapps-video-compressor/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/ttomohisa/htmlapps-video-compressor/actions/workflows/deploy-pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Single HTML](https://img.shields.io/badge/distribution-single%20HTML-0ea5e9)](https://ttomohisa.github.io/htmlapps-video-compressor/)

[日本語版 README](README.ja.md)

A privacy-first single-HTML video compressor powered by ffmpeg.wasm. Videos are processed entirely in browser memory and are never uploaded.

![Application preview](docs/preview.png)

## 🚀 Live demo

[Open Local Video Compressor on GitHub Pages](https://ttomohisa.github.io/htmlapps-video-compressor/)

> **CSP note:** ffmpeg.wasm requires the narrowly scoped `'wasm-unsafe-eval'` source for WebAssembly execution. The app does not enable the broader JavaScript `'unsafe-eval'`, and `connect-src 'none'` continues to block runtime network access.

## Features

- Change resolution without changing aspect ratio or upscaling
- Set video bitrate
- Choose H.264, H.265, or VP9
- Estimate output size from duration and selected settings
- Remove audio
- Preview, save, and share the compressed video
- Clear selected-video cards for size, duration, resolution, estimated total bitrate, measured frame rate, and format
- Per-video recommendations for resolution, frame rate, and video bitrate
- Dynamic bitrate ceilings based on output resolution and codec
- Advanced controls for frame rate, encoding speed, audio bitrate, and metadata
- In-app help and troubleshooting
- Per-setting info buttons with practical guidance
- Lowest-complexity H.265 settings plus an in-progress H.264 retry path
- Japanese and English UI
- No runtime network access

## Build the standalone HTML on Windows

1. Download or clone the repository.
2. Double-click `build-standalone.bat`.
3. The pinned `@ffmpeg/core` package is downloaded at build time only.
4. `dist/index.html` is generated and opened automatically.

The generated `dist/index.html` works directly from `file://` and needs no web server. It is roughly 43 MB because the FFmpeg WASM binary is embedded.

**Upgrading from v0.2.0:** Delete the old `dist/index.html`, then run `build-standalone.bat` again. If GitHub Pages still shows the old error after deployment, reload without cache using `Ctrl + F5`.

## Quick start

### Use the web demo

Just [open the demo](https://ttomohisa.github.io/htmlapps-video-compressor/). No installation or account is required.

### Use the download file

1. Download [video-compressor.html](https://github.com/ttomohisa/htmlapps-video-compressor/blob/main/video-compressor.html) from this repository.
2. Open it in a current Chromium-based browser.

### Use it fully offline(advance)

1. Download or clone this repository.
2. Double-click `build-offline.bat` on Windows.
3. The first build downloads the exact dependency versions pinned in `versions.json`.
4. Copy the generated `dist/index.html` wherever you need it.
5. Open that single file later without an internet connection.

Python, Node.js, and a local web server are not required. The builder uses Windows PowerShell and the built-in `tar.exe`.


H.264 with the automatic settings is the safest default. H.265 is experimental because it is extremely slow in single-thread WebAssembly and should be limited to short clips. If no visible progress appears for 12 seconds, the progress screen offers “Retry with H.264” for the same video. VP9 is also slow to encode.

The **Help** button explains settings, detected video information, sharing, privacy, and common failures.

## Video information

- **Estimated total bitrate** is calculated from file size and duration and includes both video and audio.
- **Frame rate** is measured by playing several frames when the browser supports and can decode the file. It can be unavailable for some formats.
- Compression can still be attempted when browser metadata is incomplete, as long as FFmpeg can read the source.

## Architecture

The build embeds the pinned FFmpeg core JavaScript and WASM assets as Base64. At runtime, the core JavaScript is concatenated directly into a dedicated classic Web Worker. The WASM bytes are transferred to that same worker and supplied through `wasmBinary`. This avoids the nested `importScripts(blob:null/...)` path that can fail when opening a standalone file through `file://`. A strict CSP includes `connect-src 'none'`.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [VERIFY_OFFLINE.md](VERIFY_OFFLINE.md).

## GitHub Pages

The included Pages workflow builds on Windows and publishes `dist`. Set **Settings → Pages → Source** to **GitHub Actions**.

## Limitations

ffmpeg.wasm uses CPU encoding rather than hardware acceleration. Long or high-resolution videos may be slow or may exceed browser memory, especially on mobile devices.

## License

GPL-3.0-or-later. The embedded `@ffmpeg/core` package is GPL-2.0-or-later. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
