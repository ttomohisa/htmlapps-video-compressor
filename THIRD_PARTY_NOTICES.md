# Third-party notices

## FFmpeg WASM Builder v1.0.0 generated core

This application embeds build artifacts from:

- Project: `ttomohisa/htmlapps-ffmpeg-wasm-builder`
- Builder release: `v1.0.0`
- Binary release asset: `ffmpeg-wasm-video-compressor-v1.0.0.zip`
- Corresponding-source asset: `ffmpeg-wasm-sources-v1.0.0.tar.gz`
- Embedded files: `ffmpeg.js`, `ffmpeg.wasm`
- Generated FFmpeg/x264 core license: GPL-2.0-or-later

The Builder v1.0.0 release is built from these pinned upstream versions:

- FFmpeg `n9.0.1`, commit `bf1b838f2ab88b4f8fd83443325c782ea0e0f7fa`
- x264 commit `31e19f92f00c7003fa115047ce50978bc98c3a0d`
- Emscripten `6.0.6`

The Builder's own scripts/runtime are MIT-licensed, but that does not relicense the generated FFmpeg/x264 WebAssembly core. The core is built with FFmpeg GPL components and libx264 and is distributed as GPL-2.0-or-later.

## Build-time verification and source availability

`build-standalone.ps1` downloads `SHA256SUMS.txt` and the pinned binary release asset from the same Builder release. It verifies the binary ZIP SHA-256 before embedding any files.

`dist/dependency-manifest.json` records the resolved Builder version/tag, binary asset, binary archive SHA-256, corresponding-source archive SHA-256, embedded file hashes, Release URL, and corresponding-source URL.

The generated app's Help dialog also reads this build manifest and exposes the exact Builder version and corresponding-source link used by that build.

## Runtime behavior

No third-party asset is fetched at runtime. `ffmpeg.js` and `ffmpeg.wasm` are embedded in the single HTML and executed in a dedicated Worker. Runtime network access is blocked by CSP with `connect-src 'none'`.

Keep this file, the repository license, and the corresponding-source information with source redistributions of this application.
