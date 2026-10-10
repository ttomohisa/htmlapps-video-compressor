# Offline verification

## Automated checks

```powershell
powershell -ExecutionPolicy Bypass -File scripts/check-source.ps1
powershell -ExecutionPolicy Bypass -File scripts/check-repository.ps1
```

`check-repository.ps1` validates source constraints, downloads the pinned Builder Release when needed, verifies its SHA-256, builds both standalone variants, and runs the standalone/self-extract checks.

Individual generated-file checks:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/verify-standalone.ps1 -Path dist\index.html
powershell -ExecutionPolicy Bypass -File scripts/verify-self-extract.ps1 -Path dist\index.self-extract.html -ExpectedSourcePath dist\index.html
```

## Manual desktop check

1. Run `build-standalone.bat` while online once so the pinned Builder Release is cached.
2. Disconnect the computer from the network.
3. Open `dist/index.html` directly from Explorer (`file://`).
4. Select a short MP4/MOV and confirm that local inspection completes before compression becomes available.
5. Confirm the displayed source video bitrate comes from the inspection report, while the editable output bitrate starts from the recommended value.
6. Compress with H.264 / MP4 and confirm H.264 + AAC output.
7. Compress the same input with VP9 / WebM and confirm VP9 + Opus output.
8. Use a portrait/rotated MP4/MOV whose orientation is carried by Display Matrix metadata. Confirm the result is visually upright and its output pixel dimensions follow the displayed orientation.
9. Repeat with audio removal, a resolution change, fps change, and cancellation.
10. Open `dist/index.self-extract.html` directly and repeat the core flow.
11. Confirm the Help dialog shows the embedded Builder version. The corresponding-source link is allowed as explicit user navigation; compression itself must not request it.
12. Reconnect, clear DevTools Network, and compress again. No runtime asset request should appear.

A selected local video can appear as a `blob:` resource. That is an in-memory object URL, not an upload.

## Mobile check

At 360, 390, and 430 px widths verify no horizontal overflow, safe-area bottom action bar, dialogs within the viewport, readable Japanese/English labels, codec selection, inspection state, progress/cancel flow, and result actions. Long file names must not break the layout.

## CSP / WebAssembly check

Both generated variants must keep `connect-src 'none'`. They require `'wasm-unsafe-eval'` for WebAssembly compilation and must not contain the broader standalone token `'unsafe-eval'`.

## Multi-thread verification

Serve `dist/index.mt.html` and `dist/index.mt.self-extract.html` on an isolated HTTP(S) host with the headers in [ST / MT distribution](docs/MULTITHREAD.md). Check `crossOriginIsolated === true`, actual shared-memory/pthread startup and four encoder threads; compress H.264/AAC and VP9/Opus, decode the results and compare timing/dimensions/audio. Repeat, cancel mid-encode and retry, then verify no stale progress or worker activity remains. Repeat with audio removed.

On an ordinary host or `file://`, MT must display the isolation explanation and refuse engine startup. ST must still select, inspect and compress without SharedArrayBuffer. Check Japanese/English, mobile/short viewport layout, all dialog close routes, and uniform drop/estimate backgrounds.

Source/lifecycle doubles and the ST Node core harness do not replace actual MT browser validation. GitHub Pages provides only a raw MT import/download artifact, not an isolated MT demo; it does not install a Service Worker.
