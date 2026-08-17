# Offline verification

## Automated checks

```powershell
powershell -ExecutionPolicy Bypass -File scripts/check-source.ps1
powershell -ExecutionPolicy Bypass -File scripts/check-repository.ps1
```

`check-repository.ps1` builds both release variants. It verifies `dist/index.html`, then verifies that the Base64/gzip payload inside `dist/index.self-extract.html` restores byte-for-byte to the normal HTML.

To check the generated files individually:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/verify-standalone.ps1 -Path dist\index.html
powershell -ExecutionPolicy Bypass -File scripts/verify-self-extract.ps1 -Path dist\index.self-extract.html -ExpectedSourcePath dist\index.html
```

## Manual desktop check
1. Disconnect the computer from the network.
2. Open `dist/index.html` directly from Explorer.
3. Select a short local video; compress H.264; preview and save it.
4. Repeat the core flow by opening `dist/index.self-extract.html` directly.
5. Exercise H.265/VP9, audio removal, cancellation, save/share, and compress-another confirmation.
6. Reconnect, clear DevTools Network, and repeat. No runtime request should appear.

A selected local video can appear as a `blob:` resource. That is an in-memory object URL, not a network upload.

## Mobile check
At 360, 390, and 430 px widths verify:
- Compact header and readable selected-file information.
- No horizontal overflow in settings.
- The bottom compression action appears only after a video is selected, respects the safe area, and disappears during processing/result display.
- Help/info/reset dialogs open as bottom sheets with comfortably tappable actions.
- Japanese and English labels do not clip important controls.

## CSP / WebAssembly check
Both generated variants must keep `connect-src 'none'`. The video compressor requires `'wasm-unsafe-eval'` for WebAssembly compilation and must not contain the broader standalone token `'unsafe-eval'`.

The self-extract wrapper must keep the same WebAssembly permission because its restored document runs ffmpeg.wasm after decompression.
