# Application specification

## Product goal
Provide an understandable video compressor that works as a fully self-contained browser app. A non-expert should be able to choose a video, accept sensible automatic settings, adjust only the essentials, see an estimated size, compress, preview, save, and share.

## Release artifacts
- `dist/index.html`: readable standalone build and the default GitHub Pages entry point.
- `dist/index.self-extract.html`: gzip-compressed one-file distribution that restores the normal build locally with `DecompressionStream`.
- Both variants must work from `file://`, require no runtime network access, and preserve the ffmpeg.wasm CSP requirement for `'wasm-unsafe-eval'` without enabling broad `'unsafe-eval'`.

## Basic settings
- Resolution: original, 4K, 1440p, 1080p, 720p, 480p, 360p.
- No upscaling; preserve aspect ratio; force even output dimensions.
- Video bitrate is automatically recommended from output pixels, frame rate, codec, and estimated source bitrate.
- Minimum bitrate: 250 kbps, with dynamic maximums by output resolution and codec.
- Codec: H.264 (`libx264`) in MP4, H.265 (`libx265`) in MP4 with `hvc1`, or VP9 (`libvpx-vp9`) in WebM.
- Remove-audio checkbox.
- Estimated size: `duration × (video bitrate + audio bitrate) ÷ 8 × 1.035`.

## Automatic defaults
- H.264 / MP4 for broad playback compatibility.
- Preserve videos at or below 360p; use an appropriate downscale step with 1080p as the default ceiling above Full HD.
- Use 30 fps for detected high-frame-rate sources; otherwise preserve source frame rate.
- Fast encoding preset, 96 kbps audio, metadata removed by default.
- Keep recommendations below estimated source video bitrate where possible to reduce the chance of a larger output.

## Mobile UX
- At 640 px and below, switch from desktop cards to native-style grouped settings rows with compact section headers.
- Render boolean settings as switch-style controls while preserving checkbox semantics and keyboard accessibility.
- After a video is selected, keep a safe-area-aware, edge-to-edge translucent bottom action bar visible with the current estimated output size and compression action.
- Hide that dock while processing and after an output is available so progress/results are unobstructed.
- Use 48 px-class touch targets for primary form/dialog actions where practical.
- Help, setting-info, and reset confirmation dialogs become bottom sheets with a visible grab handle on narrow screens.
- The selected-video summary remains compact and readable without requiring horizontal scrolling.
- Japanese and English copy must fit at 360 px width.

## Selected-video information
Show file name/format, file size, duration, resolution, estimated total bitrate, measured frame rate when supported, and clear unavailable states.

## Advanced settings
Frame rate (original/60/30/24), encoding speed, audio bitrate (64/96/128/192 kbps), and keep-metadata checkbox.

## Help and result
- In-page guidance covers usage, privacy, settings, detected metadata, sharing, and troubleshooting.
- Every basic/advanced setting has an info affordance.
- Result includes preview, original/output sizes, actual reduction, processing time, save/share, H.265 compatibility warning, and confirmation before discarding the result.

## Privacy and persistence
- No uploads or runtime requests; `connect-src 'none'` is mandatory.
- No analytics, ads, remote fonts, external images, or CDN assets.
- Video contents are never stored in localStorage or IndexedDB; only language preference may persist.

## Error and cancellation behavior
- Reject files over 1.5 GB with a memory warning.
- Allow compression when browser metadata is incomplete if FFmpeg can read the file.
- Cancel by terminating the worker and releasing its in-memory filesystem.
- Keep processing logs available in a disclosure section.
- H.265 uses the fixed lowest-complexity browser profile and is labeled experimental.
- If H.265 has no visible progress after 12 seconds, offer an in-place H.264 retry.

## Acceptance criteria
- `scripts/check-repository.ps1` builds and verifies both standalone variants.
- No unresolved build placeholders or runtime HTTP(S) asset references remain.
- The self-extract payload restores byte-for-byte to `dist/index.html`.
- Both generated variants contain a CSP that blocks network access; the video compressor variants preserve `'wasm-unsafe-eval'` and reject broad `'unsafe-eval'`.
- Core flow works at desktop width and 360 px mobile width with keyboard/touch operation and no console error.
