# Application specification

## Product goal
Provide a simple, fully self-contained browser video compressor. A non-expert should be able to choose a local video, accept automatic settings, adjust a small set of useful controls, compress it, preview the result, and save/share it without uploading the video.

## Engine
- Engine source: `ttomohisa/htmlapps-ffmpeg-wasm-builder` GitHub Release.
- Version is pinned once in `dependencies.json`.
- v1.1.0 initially pins Builder `1.0.0` / FFmpeg `n9.0.1`.
- Output: H.264 (`libx264`) video + optional AAC audio in MP4.
- Single-thread compact public-libav runner; no SharedArrayBuffer/COOP/COEP requirement.
- Build verifies Release SHA-256 before embedding `ffmpeg.js` and `ffmpeg.wasm`.

## Release artifacts
- `dist/index.html`: readable standalone build and GitHub Pages entry point.
- `dist/index.self-extract.html`: gzip/Base64 self-extracting one-file build.
- `video-compressor.html`: root copy of `dist/index.html` for direct consumers such as Browser Kitty.
- Both variants must work from `file://` and require no runtime network access.

## Settings
- Resolution: original, 4K, 1440p, 1080p, 720p, 480p, 360p.
- Preserve aspect ratio, never upscale, and let the compact runner produce even dimensions.
- Video bitrate: automatic recommendation plus manual override.
- Output codec is fixed to H.264 / MP4.
- Remove-audio checkbox.
- Advanced: output fps (original/60/30/24), x264 speed preset, AAC bitrate (64/96/128/192 kbps).
- Metadata-retention control is intentionally not exposed.

## Runtime
- Decode embedded `ffmpeg.js`/`ffmpeg.wasm` from the build bundle.
- Concatenate generated Emscripten JavaScript and the app Worker body into one Blob Worker.
- Instantiate WebAssembly from transferred bytes with `wasmBinary` + `instantiateWasm`.
- Write `/input.bin`, invoke the compact runner through `callMain`, read `/output.mp4`, transfer output back to the main thread.
- Parse `__FFMPEG_WASM_PROGRESS__` messages for progress.
- Cancellation terminates the Worker.

## Privacy
- `connect-src 'none'` is mandatory.
- No analytics, ads, remote fonts, runtime CDN, XHR/fetch, WebSocket, EventSource, dynamic import, or `importScripts()`.
- Video content is never stored in localStorage/IndexedDB; only UI language preference may persist.

## Mobile UX
Keep the existing grouped native-style mobile settings, safe-area-aware bottom action bar, compact file/result cards, and bottom-sheet dialogs.

## Acceptance criteria
- `scripts/check-source.ps1` passes.
- `scripts/check-repository.ps1` builds and verifies both standalone variants.
- Release archive checksum is verified before embedding.
- No unresolved placeholders or external runtime asset references remain.
- CSP includes `connect-src 'none'` and `'wasm-unsafe-eval'`, but not broad `'unsafe-eval'`.
- Root `video-compressor.html` matches `dist/index.html` after a normal build.
- H.264/AAC MP4 compression, audio removal, cancellation, preview, save, and share are manually checked with a short test video.
