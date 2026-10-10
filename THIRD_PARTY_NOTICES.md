# Third-party notices

## FFmpeg WASM Builder v1.10.3 generated core

This application embeds build artifacts from:

- Project: `ttomohisa/htmlapps-ffmpeg-wasm-builder`
- Builder release: `v1.10.3`
- Binary release asset: `ffmpeg-wasm-video-compressor-v1.10.3.zip`
- Corresponding-source asset: `ffmpeg-wasm-sources-v1.10.3.tar.gz`
- Embedded files: `ffmpeg.js`, `ffmpeg.wasm`
- Generated video-compressor core license: GPL-2.0-or-later

The Builder v1.10.3 source pins:

- FFmpeg `n9.0.1`, commit `bf1b838f2ab88b4f8fd83443325c782ea0e0f7fa`
- x264 commit `31e19f92f00c7003fa115047ce50978bc98c3a0d`
- libvpx `v1.16.0`, commit `1024874c5919305883187e2953de8fcb4c3d7fa6`
- Opus `v1.5.2`, commit `ddbe48383984d56acd9e1ab6a090c54ca6b735a6`
- Emscripten `6.0.6`

The Builder's own scripts/runtime are MIT-licensed, but that does not relicense the generated WebAssembly core. The `video-compressor` profile enables GPL FFmpeg components and links x264, so the generated core is distributed under GPL-2.0-or-later. libvpx retains its BSD-style license and upstream `PATENTS` grant. Opus retains its three-clause BSD license and upstream patent grant. Release bundles carry the applicable upstream notices.

## Build-time verification and source availability

`build-standalone.ps1` downloads `SHA256SUMS.txt` and the pinned binary release asset from the same Builder release. It verifies the binary ZIP SHA-256 before embedding any files.

`dist/dependency-manifest.json` records the resolved Builder version/tag, binary asset, binary archive SHA-256, corresponding-source archive SHA-256, embedded file hashes, Release URL, and corresponding-source URL.

The generated app's Help dialog also reads this build manifest and exposes the exact Builder version and corresponding-source link used by that build.

## Runtime behavior

No third-party asset is fetched at runtime. `ffmpeg.js` and `ffmpeg.wasm` are embedded in the single HTML and executed in a dedicated Worker. Source File/Blob input is exposed through WORKERFS. Runtime network access is blocked by CSP with `connect-src 'none'`.

Keep this file, the repository license, and the corresponding-source information with source redistributions of this application.

Both ST and MT use the same pinned Builder source/version and licensing. Each generated dependency manifest records its own verified binary archive checksum and the common corresponding-source archive. See [ST / MT distribution](docs/MULTITHREAD.md).
