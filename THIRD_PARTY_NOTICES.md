# Third-party notices

## @ffmpeg/core 0.12.10

- Project: ffmpeg.wasm / FFmpeg for WebAssembly
- Package: `@ffmpeg/core`
- Version: `0.12.10` (exactly pinned)
- Package license: GPL-2.0-or-later
- Embedded files: `dist/umd/ffmpeg-core.js`, `dist/umd/ffmpeg-core.wasm`
- Upstream source: the `ffmpegwasm/ffmpeg.wasm` repository and its corresponding release/tag

The compiled core includes FFmpeg and GPL-enabled codec libraries. This repository is therefore distributed under GPL-3.0-or-later. Keep this notice, the project license, exact package version, and source references with redistributions.

No third-party asset is fetched at runtime. The build script downloads the pinned npm package and records tarball and embedded-asset SHA-256 hashes in `dist/dependency-manifest.json`.
