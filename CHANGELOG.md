# Changelog

## 1.0.5 - Self-extract favicon - 2026-08-17

- Inherit the source HTML favicon into `index.self-extract.html` so the browser tab uses the app icon during unpacking.
- Verify that the self-extract wrapper favicon matches the source favicon while keeping the wrapper ASCII-only.

## 1.0.4 - Native-style mobile interface - 2026-08-17

- Reworked the narrow-screen layout into native-style grouped settings instead of stacked desktop cards.
- Added iOS/Android-like toggle switches for boolean settings while preserving accessible checkbox semantics.
- Changed the mobile compression action into an edge-to-edge translucent bottom action bar with safe-area support.
- Refined mobile file details, result statistics, touch feedback, dialogs, toasts, and compact header behavior.
- Kept the desktop layout and ffmpeg.wasm processing flow unchanged.

## 1.0.3 - 2026-08-17

- Fixed mojibake in the initial `index.self-extract.html` unpacking screen when built with Windows PowerShell 5.1.
- Made `scripts/build-self-extract.ps1` ASCII-only so BOM-less UTF-8 source decoding cannot corrupt Japanese wrapper text.
- Emit Japanese wrapper copy and localized app names as ASCII-safe HTML numeric character references, with JavaScript errors using Unicode escapes.
- Added repository and self-extract verification guards that fail if non-ASCII bytes are reintroduced into the PowerShell builder or generated wrapper.


## 1.0.2 - 2026-08-17

- Aligned the repository build structure with the current `htmlapps-template` conventions.
- Added `dist/index.self-extract.html`, generated as a gzip/Base64 self-extracting one-file build using browser-native `DecompressionStream`.
- Added byte-for-byte self-extract verification and `self-extract-manifest.json`.
- Preserved the video compressor's narrow `'wasm-unsafe-eval'` CSP requirement in the self-extract wrapper while continuing to reject broad `'unsafe-eval'`.
- Updated GitHub Actions to build, verify, and upload both standalone variants and to skip Pages deployment cleanly until Pages is enabled.
- Reworked narrow-screen UI with a compact template-style header, denser cards, larger touch targets, and bottom-sheet dialogs.
- Added a safe-area-aware mobile compression action dock that shows estimated size plus the primary compression action after video selection and hides during processing/results.


## 1.0.1 - 2026-08-05

- Switched H.265 to a fixed lowest-complexity browser profile (`ultrafast`, zero latency, no lookahead/B-frames/AQ/CU-tree)
- Removed H.265 VBV buffering options that added unnecessary work in the single-thread WebAssembly build
- Added periodic FFmpeg statistics parsing for more reliable visible progress
- Added an in-progress “Retry with H.264” escape path when H.265 has not produced visible progress
- Marked H.265 as experimental and locked its speed setting to Fastest
- Fixed completed reduction text being left in Japanese after switching the UI to English

## 1.0.0 - 2026-08-05

- Removed the large hero slogan and simplified the top area
- Removed backgrounds and borders from the language and help controls
- Added per-setting information dialogs for all basic and advanced options
- Added confirmation before clearing a completed result to compress another video
- Added elapsed processing time, estimated reduction, and clearer H.265 progress feedback
- Stabilized H.265 in the single-thread WebAssembly core by disabling x265 thread pools, WPP, and lookahead slices

## 0.2.1 - 2026-08-05

- Fixed WebAssembly startup being blocked by Content Security Policy
- Added the narrow `script-src 'wasm-unsafe-eval'` permission required for ffmpeg.wasm without enabling JavaScript `eval()`
- Kept `connect-src 'none'` and all runtime network blocking unchanged
- Added standalone verification that requires `wasm-unsafe-eval` and rejects the broader `unsafe-eval`
- Added a clearer error message when an old CSP-blocked HTML is still being used

## 0.2.0 - 2026-08-05

- Refreshed the light-only UI to match the compact card layout and visual rhythm of HTML PDF Organizer
- Removed dark mode and theme persistence
- Added an embedded SVG favicon
- Reduced the hero heading size and simplified the first-screen hierarchy
- Added an in-app help dialog with usage, settings guidance, privacy notes, sharing behavior, and troubleshooting
- Improved selected-video information with clearer cards for size, duration, resolution, estimated total bitrate, measured frame rate, and format
- Added smarter per-video defaults for resolution, frame rate, codec, audio bitrate, and video bitrate
- Replaced the fixed 50,000 kbps ceiling with dynamic limits based on output resolution and codec
- Fixed `blob:null` / `importScripts` failures by embedding the FFmpeg core JavaScript directly in the dedicated worker source

## 0.1.0 - 2026-08-05

- Initial implementation based on the single-HTML app template
- Added local ffmpeg.wasm compression with H.264, H.265, and VP9
- Added resolution and bitrate controls with output-size estimation
- Added audio removal, advanced settings, progress, cancellation, preview, save, and share
- Added Japanese/English UI
- Added offline CSP, reproducible Windows build, validation, and GitHub Pages workflows
