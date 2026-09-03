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

1. The inline loader decodes the embedded core JavaScript and compressed WASM bytes.
2. The main thread caches the decompressed WASM bytes so source inspection followed by compression does not repeat decompression.
3. Each inspection/compression operation creates a dedicated classic Worker and receives a transferable copy of the cached WASM bytes.
4. The generated Emscripten `ffmpeg.js` and the app Worker body are placed in the same Blob.
5. The selected browser `File` is mounted in the Worker through Emscripten WORKERFS under `/workerfs`; the full source video is not copied into a JavaScript ArrayBuffer or MEMFS first.
6. `createFFmpegCore` receives `wasmBinary` and a direct `instantiateWasm` callback, so no WASM URL is fetched.
7. Inspection runs the compact public-libav runner with `--inspect-output /inspect.json`. The runner reads container/stream packets and reports actual video packet bytes, duration, average video bitrate, fps, coded/display dimensions, and display-matrix rotation.
8. The measured video bitrate becomes the UI's initial video bitrate value.
9. Compression runs the same runner with `--codec h264` to `/output.mp4` or `--codec vp9` to `/output.webm`, plus resize/fps/bitrate/speed/audio arguments.
10. If the source contains a display matrix, autorotation is applied in the video filter graph before resize. The output therefore contains correctly oriented pixels rather than relying on copied rotation metadata.
11. Progress lines beginning with `__FFMPEG_WASM_PROGRESS__` update the UI.
12. The output file is read from MEMFS, returned as a transferable buffer, and converted to a Blob/File for preview/save/share.
13. The Worker is terminated after completion or cancellation.

## Why no `importScripts()`

A standalone page opened with `file://` can create opaque `blob:null/...` worker URLs. Nested Blob loading is not portable there. Keeping generated core JavaScript and the Worker body in one Blob removes that dependency.

## Codec choices

H.264 / AAC in MP4 remains the default because encoding is generally faster and playback compatibility is broad. VP9 / Opus in WebM is an optional higher-compression path. The compact Builder profile links libvpx and Opus only for `video-compressor`; it does not replace the app with the much broader standard ffmpeg.wasm core.

H.265/x265 is not included in this profile. The project avoids adding it as the higher-compression option because its patent/licensing distribution considerations are less suitable for this public, redistributable Browser Kitty tool. AV1 can be evaluated separately if the added WASM size and browser-side encoding cost are justified.

## Network boundary

The generated HTML uses `connect-src 'none'`. The source checker rejects runtime `fetch`, XHR, WebSocket, EventSource, dynamic `import()`, `importScripts()`, and unexpected URLs. Build scripts/configuration are the only locations allowed to contain dependency URLs.
