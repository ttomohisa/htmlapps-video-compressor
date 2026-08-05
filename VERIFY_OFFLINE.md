# Offline verification

## Automated checks

```powershell
powershell -ExecutionPolicy Bypass -File scripts/check-source.ps1
.\build-standalone.ps1
powershell -ExecutionPolicy Bypass -File scripts/verify-standalone.ps1 -Path dist\index.html
```

The standalone verifier checks for unresolved build placeholders, external script/link references, iframes, and the required `connect-src 'none'` policy.

## Manual check

1. Disconnect the computer from the network.
2. Open `dist/index.html` directly from Explorer.
3. Select a short local video.
4. Compress it as H.264, preview it, and save it.
5. Repeat with H.265 and VP9.
6. Test audio removal and cancellation.
7. Reconnect, open DevTools Network, clear the log, and repeat. The request list must stay empty.

The browser may show the selected local video as a Blob resource. That is an in-memory object URL, not a network upload.

## CSP / WebAssembly check

The generated HTML must contain `script-src 'unsafe-inline' 'wasm-unsafe-eval' blob:` and must not contain the broader standalone token `'unsafe-eval'`. `connect-src 'none'` must remain present.
