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
4. Compress a short MP4/MOV and confirm H.264/AAC MP4 output.
5. Repeat with audio removal, a resolution change, fps change, and cancellation.
6. Open `dist/index.self-extract.html` directly and repeat the core flow.
7. Confirm the Help dialog shows the embedded Builder version. The corresponding-source link is allowed as explicit user navigation; compression itself must not request it.
8. Reconnect, clear DevTools Network, and compress again. No runtime asset request should appear.

A selected local video can appear as a `blob:` resource. That is an in-memory object URL, not an upload.

## Mobile check

At 360, 390, and 430 px widths verify grouped settings, switch-style boolean controls, no horizontal overflow, safe-area bottom action bar, bottom-sheet dialogs, readable Japanese/English labels, progress/cancel flow, and result actions.

## CSP / WebAssembly check

Both generated variants must keep `connect-src 'none'`. They require `'wasm-unsafe-eval'` for WebAssembly compilation and must not contain the broader standalone token `'unsafe-eval'`.
