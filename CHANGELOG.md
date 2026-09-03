# Changelog

## 1.3.1 - Help, output naming, and mobile workflow - 2026-09-03

- Use the recommended video bitrate as the default after source inspection, while keeping the measured source bitrate visible as reference information.
- Fixed the Help question-mark dot so it renders reliably.
- Fixed Help dialog sizing and scrolling so the full guide remains reachable on desktop and mobile.
- Added a user-editable output file name with automatic `.mp4` / `.webm` extension handling.
- Reworked the smartphone workflow around a fixed bottom action bar inspired by Image Counter: Video, Settings, Estimate, and Compress.
- Returned the estimate card to normal document flow on mobile so it no longer floats over the interface.
- Keep the smartphone bottom action bar visible from the initial empty state through the workflow, with Compress disabled until a video is ready.
- Adjust mobile section navigation so card tops remain visible below the sticky header instead of scrolling underneath it.
- Keep the in-card “Compress with these settings” action visible in the estimated-size card in addition to the fixed bottom Compress action.

## 1.3.0 - VP9, measured bitrate, and rotation preservation - 2026-09-03

- Replaced the PowerShell `Get-FileHash` cmdlet dependency in build/verification scripts with .NET SHA-256 hashing for broader Windows PowerShell compatibility.
- Added optional VP9 / Opus WebM output while keeping H.264 / AAC MP4 as the default.
- Replaced file-size/duration source-bitrate estimation with local FFmpeg stream inspection that measures actual video packet bytes over stream duration.
- Use the measured source video bitrate as the initial video bitrate after a file is selected; recommendations remain a separate user action.
- Added Display Matrix inspection and FFmpeg-style autorotation so portrait/rotated MP4/MOV inputs are encoded with the correct pixel orientation.
- Switched source input to WORKERFS so inspection and compression do not copy the entire selected File into MEMFS first.
- Added codec-aware output extension/MIME, speed mapping, help text, Japanese/English copy, and dependency/license documentation.
- Pinned the application to FFmpeg WASM Builder v1.6.0, which adds libvpx v1.16.0 and Opus v1.5.2 to the video-compressor profile.
- Lowered the editable bitrate floor to 50 kbps while keeping recommendations at 250 kbps or above, so very-low-bitrate sources can retain their exact measured bitrate as the initial value.
- Added `build-with-local-ffmpeg.bat` / `-LocalFfmpegRoot` for testing a local Builder output before publishing a GitHub Release; release builds keep the verified checksum path.
- Polished the 390px mobile bitrate controls and bottom spacing so labels no longer collapse into narrow wrapped columns and the fixed compression dock does not cover footer content.
- Updated repository guidance and standalone verification so VP9 / WebM is treated as a supported v1.3.0 path rather than a legacy codec.


## 1.2.0 - Template-aligned UI refresh - 2026-09-03

- Replaced the header and standalone favicon with the repository canonical `assets/favicon.svg`, embedded directly into the HTML.
- Made the self-extract loading screen inherit the same embedded canonical icon instead of using a separate fallback mark.
- Added a clearer page introduction and template-style local-processing badge while keeping the existing compression flow intact.
- Removed the second mobile-only native-style override layer so narrow screens use the same template-aligned card, spacing, and control language as desktop.
- Kept the mobile estimated-size / compression action dock, with safe-area spacing and large touch targets.
- Changed the header Help action to the template-style icon-only control and retained Japanese/English accessible labels.
- Replaced the stale version-specific CSP recovery message with version-neutral guidance.
- Refreshed Japanese, English, and mobile screenshots and verified the H.264/AAC MP4 compression flow with the embedded FFmpeg WASM engine.

## 1.1.0 - FFmpeg 9 compact WASM engine - 2026-08-18

- Replaced the old `@ffmpeg/core` runtime with the compact core produced by `htmlapps-ffmpeg-wasm-builder`.
- Pinned Builder `1.0.0` in one `dependencies.json` version field and derive the Release tag/asset names from it.
- Added SHA-256 verification against the Builder Release `SHA256SUMS.txt` before embedding `ffmpeg.js` / `ffmpeg.wasm`.
- Switched runtime execution to the Builder public-libav runner contract via `createFFmpegCore` + `callMain`, with direct `instantiateWasm` and no nested `importScripts()`.
- Fixed output to H.264/AAC MP4; removed H.265, VP9, metadata-retention, and H.265 retry UI paths that are not supported by the compact runner.
- Preserved resize, bitrate, fps, x264 speed, audio bitrate/removal, progress, logs, cancellation, preview, save, and share.
- Added a Help entry showing the exact Builder version and corresponding-source link recorded at build time.
- Added `update-ffmpeg.bat X.Y.Z` for one-command Builder version updates and verified rebuilds.
- Added root `video-compressor.html` generation for Browser Kitty/direct distribution.
- Updated license notices, architecture, offline-verification, security, and repository guidance.

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
