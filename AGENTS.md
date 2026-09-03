# AGENTS.md

## Project goal
Maintain a privacy-first, single-HTML local video compressor. Runtime video processing must remain completely local and support H.264/AAC MP4 plus VP9/Opus WebM through the compact FFmpeg WASM Builder core.

## Engine rules
- Do not reintroduce `@ffmpeg/core`, `@ffmpeg/ffmpeg`, H.265/x265, pthreads, SharedArrayBuffer, or COOP/COEP without an explicit architectural decision. Keep the current H.264/x264 and VP9/libvpx output paths unless the app specification is intentionally changed.
- The engine version is pinned once in `dependencies.json` under `ffmpeg-wasm-builder.version`.
- Build-time Release downloads must verify `SHA256SUMS.txt` before embedding assets.
- Keep the corresponding-source asset recorded in the generated dependency manifest and exposed in Help.
- Runtime must use embedded `ffmpeg.js`/`ffmpeg.wasm`; no network fetch is allowed.
- Keep the one-Blob Worker approach and direct `instantiateWasm` path for `file://` compatibility.

## UI rules
- Light theme only.
- Preserve the current compact desktop/mobile layout and safe-area mobile bottom action bar.
- Keep the selectable output codec control with `H.264 / MP4` as the default and `VP9 / WebM` as the higher-compression option.
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
