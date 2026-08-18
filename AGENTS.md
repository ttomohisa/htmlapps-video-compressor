# AGENTS.md

## Project goal
Maintain a privacy-first, single-HTML local video compressor. Runtime video processing must remain completely local and output H.264/AAC MP4 through the compact FFmpeg WASM Builder core.

## Engine rules
- Do not reintroduce `@ffmpeg/core`, `@ffmpeg/ffmpeg`, H.265/x265, VP9/libvpx output paths, pthreads, SharedArrayBuffer, or COOP/COEP without an explicit architectural decision.
- The engine version is pinned once in `dependencies.json` under `ffmpeg-wasm-builder.version`.
- Build-time Release downloads must verify `SHA256SUMS.txt` before embedding assets.
- Keep the corresponding-source asset recorded in the generated dependency manifest and exposed in Help.
- Runtime must use embedded `ffmpeg.js`/`ffmpeg.wasm`; no network fetch is allowed.
- Keep the one-Blob Worker approach and direct `instantiateWasm` path for `file://` compatibility.

## UI rules
- Light theme only.
- Preserve the current compact desktop/mobile layout and safe-area mobile action dock.
- Output codec is displayed as fixed `H.264 / MP4`, not as a selectable control.
- Keep resolution, bitrate, fps, speed, audio bitrate, audio removal, progress, logs, cancellation, preview, save, and share.
- Japanese and English must remain in sync.

## Validation
Before release, run:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/check-repository.ps1
```

Then manually open both generated HTML variants from `file://` and compress a short representative video. Test cancellation and audio removal too.

## Updating FFmpeg
Prefer:

```text
update-ffmpeg.bat X.Y.Z
```

Review Builder release notes, rebuild, and manually test before committing the version bump.
