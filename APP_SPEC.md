# Application specification

## v1.3.3 media timing requirements

- MP4 preserves a positive final-frame duration and a complete video edit interval, with or without audio.
- Original FPS preserves variable presentation timestamps; selected FPS retains a constant presentation cadence.
- Actual embedded-core timing tests cover both generated variants through exact payload parity.

## v1.3.2 UX requirements

- The header language action shows `EN` in Japanese and `JA` in English. Its accessible name and tooltip describe the target language in the current UI language. Preserve localized Help labels and privacy copy.

- The Help icon must render its question-mark dot reliably at all supported sizes.
- Help content must remain fully scrollable without clipping on desktop or mobile.
- Users can edit the output base file name; `.mp4` / `.webm` is appended from the selected codec.
- Mobile uses a fixed bottom action bar for Video / Settings / Estimate / Compress, while estimate details remain normal scroll content.

## Product goal
Provide a simple, fully self-contained browser video compressor. A non-expert should be able to choose a local video, accept sensible initial settings, choose a compatible or higher-compression output, compress it, preview the result, and save/share it without uploading the video.

## Engine
- Engine source: `ttomohisa/htmlapps-ffmpeg-wasm-builder` GitHub Release.
- Version is pinned once in `dependencies.json`.
- Builder `1.10.1` / FFmpeg `n9.0.1` is pinned for app v1.3.3.
- Output A: H.264 (`libx264`) video + optional AAC audio in MP4.
- Output B: VP9 (`libvpx-vp9`) video + optional Opus audio in WebM.
- Single-thread compact public-libav runner; no SharedArrayBuffer/COOP/COEP requirement.
- Builder inspection mode measures the selected video stream from packet bytes and stream duration without decoding the full video.
- Builder autorotation reads `AV_PKT_DATA_DISPLAYMATRIX` and applies the same 90/180/270-degree transpose/flip logic used by FFmpeg autorotate before resizing/encoding.
- Build verifies Release SHA-256 before embedding `ffmpeg.js` and `ffmpeg.wasm`.

## Release artifacts
- `dist/index.html`: readable standalone build and GitHub Pages entry point.
- `dist/index.self-extract.html`: gzip/Base64 self-extracting one-file build.
- `video-compressor.html`: root copy of `dist/index.html` for direct consumers such as Browser Kitty.
- Both variants must work from `file://` and require no runtime network access.

## Settings
- Codec/container: H.264 / MP4 (default) or VP9 / WebM.
- Resolution: original, 4K, 1440p, 1080p, 720p, 480p, 360p.
- Preserve display-oriented aspect ratio, never upscale, and produce even dimensions.
- Video bitrate: the app measures the source-video bitrate for reference, then initializes the setting to the codec/dimension-aware recommended bitrate. The user may override it, and the recommendation action restores the same recommended value.
- Remove-audio checkbox.
- Advanced: output fps (original/60/30/24), encoding speed, audio bitrate (64/96/128/192 kbps).
- H.264 uses x264 speed presets; VP9 maps the same user-facing speed choices to libvpx `cpu-used` values.
- Metadata-retention control is intentionally not exposed. Rotation is normalized into output pixels instead of relying on copied rotation metadata.

## Runtime
- Decode embedded `ffmpeg.js`/`ffmpeg.wasm` from the build bundle.
- Cache decompressed WASM bytes on the main thread; transfer a fresh byte copy to each Worker invocation.
- Concatenate generated Emscripten JavaScript and the app Worker body into one Blob Worker.
- Mount the selected browser File through Emscripten WORKERFS under `/workerfs`; do not create a full input ArrayBuffer/MEMFS copy.
- Inspection invokes the compact runner with `--inspect-output /inspect.json`; parse measured bitrate, fps, display dimensions, and rotation.
- Compression invokes the same runner with `--codec h264|vp9`, output settings, and `/output.mp4` or `/output.webm`.
- Output remains in MEMFS and is transferred back to the main thread as an ArrayBuffer.
- Parse `__FFMPEG_WASM_PROGRESS__` messages for progress.
- Cancellation terminates the Worker.

## Privacy
- `connect-src 'none'` is mandatory.
- No analytics, ads, remote fonts, runtime CDN, XHR/fetch, WebSocket, EventSource, dynamic import, or `importScripts()`.
- Video content is never stored in localStorage/IndexedDB; only UI language preference may persist.

## Mobile UX
Use the template-aligned card and control language on narrow screens. Keep the safe-area-aware bottom action bar with Video / Settings / Estimate / Compress actions, compact file/result cards, large touch targets, and bottom-sheet dialogs. Estimate details remain in normal document flow so the fixed bar never covers them.

## Acceptance criteria
- `scripts/check-source.ps1` passes.
- `scripts/check-repository.ps1` builds and verifies both standalone variants using the checksum-verified Builder release.
- Release archive checksum is verified before embedding.
- No unresolved placeholders or external runtime asset references remain.
- CSP includes `connect-src 'none'` and `'wasm-unsafe-eval'`, but not broad `'unsafe-eval'`.
- Root `video-compressor.html` matches `dist/index.html` after a normal build.
- Source bitrate shown after inspection is measured from the video stream and is kept as source information. The editable output bitrate starts from the recommended value; no file-size/duration fallback is labeled as source video bitrate.
- H.264/AAC MP4 and VP9/Opus WebM compression are manually checked with short test videos.
- A display-matrix rotated MP4/MOV is checked and the encoded output has the correct visual orientation and display dimensions.
- Audio removal, cancellation, preview, save, share, Japanese/English, and mobile layout are manually checked.

## Smartphone navigation

- The fixed bottom bar is visible from the initial empty state and provides Video, Settings, Estimate, and Compress actions.
- Compress remains disabled until a usable video is ready; the other actions may navigate to their sections at any time.
- Mobile navigation must stop with the target card border visible below the sticky header.
- The estimated-size card keeps its own “Compress with these settings” button even when the fixed bottom Compress action is present.

## Modal accessibility and responsive audit

Lock document/body scrolling only while a native modal is open. Preserve the existing flex shell, scroll body, native keyboard focus, and close handlers. The local-processing badge uses a decorative shield without changing the privacy claim. See `docs/LAYOUT_AUDIT.md` for coverage and environment limits.
