# Local Video Compressor

[![GitHub Pages](https://github.com/ttomohisa/htmlapps-video-compressor/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/ttomohisa/htmlapps-video-compressor/actions/workflows/deploy-pages.yml)
[![License: GPL-3.0-or-later](https://img.shields.io/badge/License-GPL--3.0--or--later-blue.svg)](LICENSE)
[![Single HTML](https://img.shields.io/badge/distribution-single%20HTML-0ea5e9)](https://ttomohisa.github.io/htmlapps-video-compressor/)

[日本語版 README](README.ja.md)

A single-HTML video compressor that keeps processing inside the browser. It can output **H.264 / AAC MP4** for broad compatibility or **VP9 / Opus WebM** when smaller files are preferred. The engine is the compact FFmpeg 9 WebAssembly build produced by [`htmlapps-ffmpeg-wasm-builder`](https://github.com/ttomohisa/htmlapps-ffmpeg-wasm-builder), without SharedArrayBuffer requirements.

![Application preview](docs/preview.png)

## 🚀 Live demo

[Open Local Video Compressor on GitHub Pages](https://ttomohisa.github.io/htmlapps-video-compressor/)

> **CSP note:** `script-src` includes the narrow `'wasm-unsafe-eval'` permission required for WebAssembly. The broader JavaScript `'unsafe-eval'` token is not enabled, and `connect-src 'none'` blocks runtime network access.

## Features

- H.264 / AAC / MP4 output for compatibility and faster browser-side encoding
- VP9 / Opus / WebM output for higher compression when encoding time is acceptable
- Source video bitrate measured from actual video-stream packets, with a codec/dimension-aware recommended output bitrate selected by default
- Display-matrix rotation applied to output pixels so portrait/rotated MP4/MOV stays correctly oriented
- Resolution changes with aspect-ratio preservation and no upscaling
- Output frame rate, encoding speed, and audio bitrate controls
- Optional audio removal
- Estimated output size based on the selected output bitrate and duration
- WORKERFS input so large source videos are not copied wholesale into MEMFS before processing
- Progress, processing log, and cancellation
- Preview, save, and share output
- Editable output file name with automatic `.mp4` / `.webm` extension handling
- Japanese and English UI
- No runtime network access
- Responsive desktop/mobile UI
- Mobile bottom action bar for Video, Settings, Estimate, and Compress

## FFmpeg WASM dependency

The repository does not commit the large generated WASM binary. `dependencies.json` contains a **single pinned FFmpeg WASM Builder version**. During the build, the matching GitHub Release is downloaded and verified against its `SHA256SUMS.txt`, then `ffmpeg.js` and `ffmpeg.wasm` are embedded into the standalone HTML.

Current pin:

```json
"version": "1.6.0"
```

Builder v1.6.0 adds libvpx VP9, Opus, source-stream inspection, autorotation, and WORKERFS input to the `video-compressor` profile. The runtime never downloads FFmpeg from GitHub.

## Build on Windows

Run:

```text
build-standalone.bat
```

The build creates:

```text
dist/
├─ index.html
├─ index.self-extract.html
├─ dependency-manifest.json
├─ self-extract-manifest.json
└─ .nojekyll

video-compressor.html   # copy of dist/index.html
```

Generate only the readable build with:

```powershell
.\build-standalone.ps1 -SkipSelfExtract
```

Force a fresh verified Release download with:

```powershell
.\build-standalone.ps1 -ForceDownload
```

To test a Builder change before publishing a Release, build the Builder's `video-compressor` profile first, then point the app directly at that output:

```text
build-with-local-ffmpeg.bat ..\htmlapps-ffmpeg-wasm-builder\dist\video-compressor
```

This local integration path is for development verification only. Release builds still download the pinned GitHub Release assets and verify them against `SHA256SUMS.txt`.

## Update FFmpeg

When a new Builder release is ready, update one version number and rebuild with:

```text
update-ffmpeg.bat 1.6.0
```

The script updates `dependencies.json`, downloads the matching Release, verifies its SHA-256, and rebuilds the standalone files.

## Usage

1. Choose or drop a video.
2. Wait for local inspection to finish. The measured source video bitrate is shown as source information, while the recommended output video bitrate is selected by default.
3. Choose **H.264 / MP4** or **VP9 / WebM**.
4. Adjust resolution, bitrate, frame rate, encoding speed, audio settings, and the output file name when needed.
5. Select **Compress with these settings**. On mobile, the bottom **Compress** action is also available.
6. Preview, save, or share the generated MP4/WebM file.

H.264 remains the default because it is generally faster to encode and broadly compatible. VP9 is intended for cases where a smaller file is worth longer browser-side encoding time.

## Privacy and offline architecture

- `connect-src 'none'` blocks runtime connections.
- No external CDN, analytics, ads, or remote fonts.
- Input and output video data are not persisted.
- `ffmpeg.js` and `ffmpeg.wasm` are embedded into one HTML file.
- FFmpeg runs in a dedicated Worker.
- Source File/Blob input is exposed to the Worker through WORKERFS rather than copied in full into MEMFS.
- WASM bytes are instantiated directly through `instantiateWasm`, avoiding runtime URL resolution under `file://`.
- Generated core JavaScript and the app Worker code share one Blob; no nested `importScripts()` is used.
- SharedArrayBuffer, COOP, and COEP are not required.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [VERIFY_OFFLINE.md](VERIFY_OFFLINE.md).

## Development

Key files:

- `dependencies.json`: pinned Builder version and Release assets
- `src/index.template.html`: UI and application logic
- `build-standalone.ps1`: Release download, checksum verification, and embedding
- `build-with-local-ffmpeg.bat`: development build using a local Builder `dist/video-compressor` output
- `update-ffmpeg.bat`: Builder version update helper
- `scripts/check-repository.ps1`: end-to-end source/build verification
- `THIRD_PARTY_NOTICES.md`: third-party licensing and corresponding-source details

```powershell
powershell -ExecutionPolicy Bypass -File scripts/check-repository.ps1
```

## License

This application repository is **GPL-3.0-or-later**. The generated FFmpeg/x264/libvpx/Opus WebAssembly core from `htmlapps-ffmpeg-wasm-builder` is distributed under **GPL-2.0-or-later** because the profile links GPL x264. libvpx and Opus retain their own upstream notices and patent grants inside the Builder release bundle.

The generated app also exposes the Builder version and corresponding-source link in its Help dialog. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Source lifecycle regression checks

Install Node.js 22 or newer in addition to PowerShell. Run `node scripts/test-source-lifecycle.cjs` for the source checks, or pass an HTML path to check a readable standalone build. `scripts/check-repository.ps1` checks the source and checked-in root HTML before building, then checks the generated standalone HTML and root parity. Rebuild with `build-standalone.ps1` after changing the template.

The tests execute the actual inline app with controlled DOM/media events, Worker messages, timers and embedded-core preparation. Tiny fictional file metadata and output bytes cover selection replacement/removal, stale callbacks, cancel/retry, resource disposal, H.264/VP9 arguments and output naming. They do not decode video, instantiate WASM, or replace the manual browser, real-video, offline, save/share and mobile checks in `VERIFY_OFFLINE.md`.
