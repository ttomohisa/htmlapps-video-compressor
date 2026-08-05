# AGENTS.md

## Mission
Build and maintain a privacy-first single HTML application. The release artifact is `dist/index.html` and must run from `file://` without a server or runtime network access.

## Non-negotiable constraints
- Do not add runtime CDN links, `fetch`, XHR, WebSocket, EventSource, analytics, ads, remote fonts, or external embeds.
- Pin every third-party dependency to an exact version in `dependencies.json`.
- Embed JavaScript, workers, WASM, styles, icons, and other required assets into the final HTML.
- Keep `connect-src 'none'` in the CSP.
- Process user videos in memory inside the browser. Never upload them.
- Do not persist video contents in localStorage or IndexedDB.
- Preserve Japanese and English UI support.
- Preserve keyboard accessibility and responsive behavior.

## Build
On Windows, run `build-standalone.bat`. It downloads pinned npm packages only at build time, embeds their assets, writes `dist/index.html`, and opens the result.

## Required checks
1. `powershell -ExecutionPolicy Bypass -File scripts/check-source.ps1`
2. `build-standalone.bat`
3. Open `dist/index.html` directly from Explorer and test with a small video.
4. Confirm DevTools Network has no requests while choosing, compressing, previewing, downloading, or sharing a video.

## ffmpeg integration
The app intentionally embeds only `@ffmpeg/core` and calls it from a custom classic Web Worker. The WASM bytes are transferred into that worker as `wasmBinary`, so the Emscripten core does not fetch a separate `.wasm` file at runtime.

## Release policy
Commit source and build metadata. `dist/index.html` may be committed for GitHub Pages releases. When upgrading ffmpeg.wasm, update the exact version, rebuild, re-test codecs, and update third-party notices.
