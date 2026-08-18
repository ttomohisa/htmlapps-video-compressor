# Security policy

## Supported version

Only the latest release on the default branch is supported.

## Reporting

Open a GitHub security advisory for vulnerabilities that could expose local files, bypass the runtime network boundary, execute untrusted code, or corrupt output. Do not attach private videos to public issues; use a synthetic reproduction file.

## Security model

The app has no backend. Its main boundaries are a strict CSP, an exact Builder version pin, SHA-256 verification of the downloaded Release asset, a dedicated FFmpeg Worker, in-memory video processing, and no persistence of video contents.

## Dependency trust

FFmpeg WASM is acquired only at build time from the pinned `ttomohisa/htmlapps-ffmpeg-wasm-builder` Release. The build reads that Release's `SHA256SUMS.txt` and rejects a binary ZIP whose SHA-256 does not match. The resolved Release and corresponding-source URL are written to the dependency manifest.

## WebAssembly and CSP

The standalone HTML allows `'wasm-unsafe-eval'` in `script-src` because browsers otherwise block WebAssembly compilation. It does not allow the broader JavaScript `'unsafe-eval'`. Runtime network access remains blocked with `connect-src 'none'`.
