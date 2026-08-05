# Architecture

## Build-time flow

`build-standalone.ps1` reads `dependencies.json`, downloads the exact npm tarball, checks the package version, extracts only the configured assets, calculates hashes, and embeds them into `src/index.template.html` as one Base64 JSON bundle.

The final artifact is `dist/index.html`. The adjacent `dependency-manifest.json` is build evidence and is not required by the app at runtime.

## H.265 fallback

The single-thread core runs x265 with a fixed lowest-complexity profile. If the encoder has not produced visible progress after 12 seconds, the UI offers a retry action that terminates the worker, switches to H.264, rebuilds the arguments, and restarts without rereading a new user-selected file.

## Runtime flow

1. The inline loader decodes the embedded asset bundle.
2. When compression starts, the app reads the embedded `ffmpeg-core.js` text.
3. The core JavaScript and the app's worker RPC function are concatenated into one classic Web Worker source and converted to a single Blob URL.
4. The embedded `ffmpeg-core.wasm` is decoded into an `ArrayBuffer` and transferred to that worker.
5. The Emscripten module receives the bytes through `wasmBinary`, avoiding a WASM network request.
6. The source video is transferred to FFmpeg's in-memory file system.
7. FFmpeg writes the compressed output to the same in-memory file system.
8. The output bytes return to the main thread as a transferable `ArrayBuffer`, then become a Blob/File for preview, save, or share.
9. Input and output files are unlinked from the worker file system. Cancelling terminates the complete worker.

## Why `importScripts` is not used

A worker created from a Blob URL can have an opaque `blob:null` origin when the standalone HTML is opened through `file://`. Loading a second Blob URL from inside that worker with `importScripts` can therefore fail with a `NetworkError`. The build now places the FFmpeg core source directly in the first worker, removing that nested Blob load entirely.

## Why the wrapper package is not embedded

The app uses a small purpose-built RPC layer instead of `@ffmpeg/ffmpeg`. This avoids an additional wrapper worker/chunk and makes every runtime asset explicit in a single-file, `file://`-compatible build.

## Network boundary

The document CSP blocks connections with `connect-src 'none'`. The worker Blob URL is created from bytes already embedded in the HTML. No application code calls `fetch`, XHR, WebSocket, EventSource, or `importScripts` at runtime.
