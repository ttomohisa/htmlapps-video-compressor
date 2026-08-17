# AGENTS.md

## Mission
Build and maintain a privacy-first single-HTML video compressor. Generate two one-file release variants: readable `dist/index.html` and gzip self-extracting `dist/index.self-extract.html`. Both must run from `file://` without a server or runtime network access.

## Non-negotiable constraints
- Do not add runtime CDN links, `fetch`, XHR, WebSocket, EventSource, analytics, ads, remote fonts, or external embeds.
- Pin every third-party dependency to an exact version in `dependencies.json`.
- Embed JavaScript, workers, WASM, styles, icons, and other required assets into the generated HTML.
- Keep `connect-src 'none'` in every runtime CSP.
- ffmpeg.wasm requires the narrow `'wasm-unsafe-eval'` CSP source. Do not replace it with the broader JavaScript `'unsafe-eval'` token.
- Process user videos in browser memory. Never upload or persist video contents.
- Preserve Japanese and English UI support, keyboard accessibility, and light-only responsive behavior.
- Treat mobile as a first-class native-style layout: grouped setting rows, accessible switch controls, touch targets, safe-area insets, bottom-sheet confirmations, and the bottom compression action bar must remain usable at 360 px width.
- Do not edit generated files in `dist/` manually. Edit `src/index.template.html`, config, or build scripts and rebuild.

## Build
On Windows, run `build-standalone.bat`. It downloads pinned npm packages only at build time, embeds their assets, verifies the readable HTML, and then creates and verifies `dist/index.self-extract.html`.

Use `./build-standalone.ps1 -SkipSelfExtract` only when intentionally generating the readable variant alone.

## Required checks
1. `powershell -ExecutionPolicy Bypass -File scripts/check-source.ps1`
2. `powershell -ExecutionPolicy Bypass -File scripts/check-repository.ps1`
3. Open `dist/index.html` directly from Explorer and test with a small video.
4. Open `dist/index.self-extract.html` directly and repeat the core flow.
5. Test desktop plus 360–430 px touch layouts, including grouped settings, switches, the fixed mobile compression action bar, help dialogs, and reset confirmation.
6. Confirm DevTools Network has no requests while choosing, compressing, previewing, downloading, or sharing a video.

## ffmpeg integration
The app intentionally embeds only `@ffmpeg/core` and calls it from a custom classic Web Worker. The WASM bytes are transferred into that worker as `wasmBinary`, so the Emscripten core does not fetch a separate `.wasm` file at runtime.

The self-extracting wrapper gzip-compresses the complete readable HTML and restores it with the browser-native `DecompressionStream`. Its CSP mirrors the source requirement for `'wasm-unsafe-eval'` while continuing to block runtime connections.

## Release policy
Commit source and build metadata. Generated HTML may be published through GitHub Actions rather than stored in source archives. When upgrading ffmpeg.wasm, update the exact version, rebuild both variants, re-test codecs, and update third-party notices.
