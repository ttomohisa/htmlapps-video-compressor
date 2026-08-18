# Architecture

## Build-time flow

1. `dependencies.json` pins one FFmpeg WASM Builder version.
2. `build-standalone.ps1` derives tag/asset names from that version.
3. It downloads the Release `SHA256SUMS.txt` and binary ZIP.
4. The ZIP SHA-256 is verified before extraction.
5. `ffmpeg.js` and `ffmpeg.wasm` are hashed and embedded as Base64 in the application bundle.
6. `dist/dependency-manifest.json` records the resolved Release and corresponding-source URL.
7. `dist/index.html` is verified, then optionally wrapped as `dist/index.self-extract.html`.
8. A normal build copies `dist/index.html` to root `video-compressor.html`.

Only this build phase uses the network.

## Runtime flow

1. The inline loader decodes the embedded core JavaScript and WASM.
2. Compression creates a dedicated classic Worker.
3. The generated Emscripten `ffmpeg.js` and the app Worker body are placed in the same Blob.
4. The WASM bytes and input video `ArrayBuffer` are transferred to the Worker.
5. `createFFmpegCore` receives `wasmBinary` and a direct `instantiateWasm` callback, so no WASM URL is fetched.
6. The input is written to `/input.bin` in MEMFS.
7. The app calls the compact public-libav runner with `callMain` using `--input`, `--output`, resize/fps/bitrate/preset/audio arguments.
8. Progress lines beginning with `__FFMPEG_WASM_PROGRESS__` update the UI.
9. `/output.mp4` is returned as a transferable buffer and converted to a Blob/File for preview/save/share.
10. The Worker is terminated after completion or cancellation.

## Why no `importScripts()`

A standalone page opened with `file://` can create opaque `blob:null/...` worker URLs. Nested Blob loading is not portable there. Keeping generated core JavaScript and the Worker body in one Blob removes that dependency.

## Why H.264 only

The application intentionally follows the compact Builder profile: the input side supports the codecs compiled into that profile, while output is deliberately H.264 + optional AAC in MP4. This removes the old H.265/VP9 UI paths and keeps runtime size/behavior predictable.

## Network boundary

The generated HTML uses `connect-src 'none'`. The source checker rejects runtime `fetch`, XHR, WebSocket, EventSource, dynamic `import()`, `importScripts()`, and unexpected URLs. Build scripts/configuration are the only locations allowed to contain dependency URLs.
