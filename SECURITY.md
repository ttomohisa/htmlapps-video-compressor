# Security policy

## Supported version

Only the latest release on the default branch is supported.

## Reporting

Open a GitHub security advisory for vulnerabilities that could expose local files, bypass the runtime network boundary, execute untrusted code, or corrupt output. Avoid attaching private videos to public issues; use a synthetic reproduction file.

## Security model

The app intentionally has no backend. Its main boundaries are a strict CSP, exact-pinned build dependencies, a dedicated FFmpeg worker, in-memory video processing, and no persistence of video contents.

## WebAssembly and CSP

The standalone HTML allows `'wasm-unsafe-eval'` in `script-src` because browsers otherwise block WebAssembly compilation. It does not allow the broader JavaScript `'unsafe-eval'`. Runtime network access remains blocked with `connect-src 'none'`.
