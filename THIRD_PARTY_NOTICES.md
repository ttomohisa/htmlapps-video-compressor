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

## coi-serviceworker — GitHub Pages `/mt/` only

GitHub Pages' isolated Multi-thread demo uses **coi-serviceworker v0.1.7**, copyright (c) 2021 Guido Zuidhof and contributors, under the MIT License. The source is vendored at `vendor/coi-serviceworker/coi-serviceworker.js` and pinned to upstream commit `7b1d2a092d0d2dd2b7270b6f12f13605de26f214` and SHA-256 in `coi-serviceworker.lock.json`. License text: `licenses/coi-serviceworker-MIT.txt`.

Only the GitHub Pages `/mt/` entry point references this script, from the same GitHub Pages origin. The worker handles HTTP navigation/resource responses to establish COOP/COEP isolation within the `/mt/` scope. It is not installed by the ordinary ST page, the raw ST/MT standalone HTML, or Browser Kitty's server-header-backed MT deployment. Neither the script nor the FFmpeg encoder uploads selected source videos.

## Runtime behavior

FFmpeg's `ffmpeg.js` and `ffmpeg.wasm` are embedded in both standalone HTML variants and run within dedicated Workers. Small input videos are read once to MEMFS; larger inputs use WORKERFS. Video processing runs locally and the application's `connect-src 'none'` CSP blocks media uploads and runtime API calls. The GitHub Pages `/mt/` site must download its initial HTML and local COI helper, and the Service Worker locally mediates page resource requests; it never sends source video data to remote services.

Keep this file, the repository license, and the corresponding-source information with source redistributions of this application.

Both ST and MT use the same pinned Builder source/version and licensing. Each generated dependency manifest records its own verified binary archive checksum and the common corresponding-source archive. See [ST / MT distribution](docs/MULTITHREAD.md).
