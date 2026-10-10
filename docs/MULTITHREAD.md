# Single-thread and multi-thread builds

- `dist/index.html` / `video-compressor.html`: portable Single-thread; direct `file://` use remains supported.
- `dist/index.mt.html` / `video-compressor.mt.html`: Multi-thread; requires HTTP(S), COOP `same-origin`, COEP `require-corp` and SharedArrayBuffer.
- Matching compressed outputs are `index.self-extract.html` and `index.mt.self-extract.html`; each has its own dependency/self-extract manifest.
- The normal build creates both variants from the same checksum-verified Builder 1.10.3 release. `-Threading single-thread` or `-Threading multi-thread` selects one. A local Builder root may contain both variant subdirectories.
- GitHub Pages keeps its root demo on ST. Its raw `index.mt.html` is an import/download artifact, not a working MT Pages demo: Pages cannot supply the required isolation headers. Browser Kitty imports that raw MT artifact and supplies isolation only for its Compressor app path. No COI Service Worker is installed.
- Cloudflare PR preview isolates only the MT artifact URLs. Runtime media processing still uses embedded code/WASM with `connect-src 'none'`.
- Unsupported MT hosts display bilingual guidance and do not silently fall back to ST. Download ST for direct disk use.
- Verify actual H.264/AAC MP4 and VP9/Opus WebM output, repeated runs, cancel/retry, audio removal and saved-output decode on the isolated MT host. Node lifecycle doubles and source contracts do not prove actual threading.

