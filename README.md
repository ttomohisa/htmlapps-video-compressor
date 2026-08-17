# Local Video Compressor

[![GitHub Pages](https://github.com/ttomohisa/htmlapps-video-compressor/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/ttomohisa/htmlapps-video-compressor/actions/workflows/deploy-pages.yml)
[![License: GPL-3.0-or-later](https://img.shields.io/badge/License-GPL--3.0--or--later-blue.svg)](LICENSE)
[![Single HTML](https://img.shields.io/badge/distribution-single%20HTML-0ea5e9)](https://ttomohisa.github.io/htmlapps-video-compressor/)

[日本語版 README](README.ja.md)

A privacy-first single-HTML video compressor powered by ffmpeg.wasm. Videos stay in browser memory and are never uploaded. The build produces both a readable standalone HTML and a smaller gzip self-extracting variant.

![Application preview](docs/preview.png)

## 🚀 Live demo

[Open Local Video Compressor on GitHub Pages](https://ttomohisa.github.io/htmlapps-video-compressor/)

> **CSP note:** ffmpeg.wasm requires the narrowly scoped `'wasm-unsafe-eval'` source for WebAssembly execution. The broader JavaScript `'unsafe-eval'` token is not enabled, and `connect-src 'none'` continues to block runtime network access.

## Features

- Resolution changes without aspect-ratio changes or upscaling
- Per-video recommended video bitrate
- H.264, H.265, and VP9
- Estimated output size from duration and selected settings
- Optional audio removal
- Preview, save, and share compressed output
- File size, duration, resolution, estimated total bitrate, measured frame rate, and format details
- Advanced frame-rate, speed, audio-bitrate, and metadata controls
- Low-complexity H.265 profile with an in-progress H.264 retry path
- Japanese and English UI
- No runtime network access

### Mobile UI

On phones, the desktop cards are replaced by a more native-style grouped settings layout instead of simply stacking the desktop UI. Selection values sit on the right side of settings rows, boolean options use switch-style controls, and file/result information is compacted for narrow screens.

After a video is selected, an edge-to-edge translucent bottom action bar keeps the output-size estimate and primary compression action available while settings are scrolled. It respects device safe areas and hides automatically during processing and after results appear. Help, setting-info, and confirmation dialogs use bottom-sheet styling with a grab handle.

## Build on Windows

Run `build-standalone.bat`. Python, Node.js, and a local web server are not required. The first build downloads the pinned `@ffmpeg/core`; later builds can reuse the cache.

```text
dist/
├─ index.html
├─ index.self-extract.html
├─ dependency-manifest.json
├─ self-extract-manifest.json
└─ .nojekyll
```

- `dist/index.html`: readable/debuggable build and the default GitHub Pages entry point
- `dist/index.self-extract.html`: gzip-compressed distribution that restores the normal HTML locally through browser-native `DecompressionStream`

Both are one-file offline applications with no runtime CDN requirement. Generate only the readable build with:

```powershell
.\build-standalone.ps1 -SkipSelfExtract
```

Force a fresh dependency download with:

```powershell
.\build-standalone.ps1 -ForceDownload
```

The self-extracting build requires JavaScript and a browser with `DecompressionStream` support. Keep the normal `index.html` as the GitHub Pages entry point.

## Usage

1. Choose or drop a video.
2. Review the automatically suggested resolution and bitrate.
3. Adjust codec or audio removal only when needed.
4. Choose **Compress with these settings**.
5. Preview the result, then save or share it.

H.264 with automatic settings is the practical default. H.265 is experimental because it is very slow in single-thread WebAssembly and is intended for short clips. If it produces no visible progress for an extended period, the progress view offers an H.264 retry.

## Privacy and offline architecture

- `connect-src 'none'` blocks runtime connections.
- No external CDN, analytics, ads, or remote fonts.
- Selected videos and compressed output are not persisted.
- JavaScript and WASM are embedded as Base64 in the standalone build.
- FFmpeg core JavaScript runs in a dedicated classic Worker with `wasmBinary`, avoiding runtime WASM fetches and nested worker imports that are problematic under `file://`.
- The self-extracting wrapper also restores the application entirely locally.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [VERIFY_OFFLINE.md](VERIFY_OFFLINE.md).

## Development

Key files:

- `app.config.json`: app metadata and both build outputs
- `dependencies.json`: pinned npm assets
- `src/index.template.html`: application UI and logic
- `build-standalone.ps1`: standalone builder
- `scripts/build-self-extract.ps1`: gzip self-extract builder
- `scripts/verify-standalone.ps1`: readable-build checks
- `scripts/verify-self-extract.ps1`: payload restore and byte-for-byte verification
- `scripts/check-repository.ps1`: end-to-end repository check

```powershell
powershell -ExecutionPolicy Bypass -File scripts/check-repository.ps1
```

## GitHub Pages

`.github/workflows/deploy-pages.yml` builds and verifies both HTML variants on Windows for pushes to `main`. If Pages is enabled, `dist` is deployed. If not, deployment is skipped and the workflow summary explains the one-time setup.

For a new repository choose **Settings → Pages → Build and deployment → Source → GitHub Actions**.

## Limitations

ffmpeg.wasm uses CPU encoding rather than hardware acceleration. Long or high-resolution videos may be slow or exceed browser memory, especially on mobile devices.

## License

GPL-3.0-or-later. The embedded `@ffmpeg/core` package is GPL-2.0-or-later. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
