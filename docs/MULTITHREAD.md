# Single-thread and multi-thread builds

Both editions use the same checksum-verified FFmpeg WASM Builder v1.10.3 release, with H.264/AAC MP4 and VP9/Opus WebM output.

| Variant | Standalone | Requirements |
| --- | --- | --- |
| Single-thread | dist/index.html / video-compressor.html | Direct file:// or HTTP(S); no SharedArrayBuffer or isolation headers |
| Multi-thread | dist/index.mt.html / video-compressor.mt.html | HTTP(S), SharedArrayBuffer, COOP same-origin and COEP require-corp |

Each edition has a matching self-extracting HTML and separate dependency/self-extract manifest. Use build-standalone.ps1 -Threading single-thread or -Threading multi-thread if only one edition is needed.

## GitHub Pages: both editions

- Single-thread: https://ttomohisa.github.io/htmlapps-video-compressor/
- Multi-thread: https://ttomohisa.github.io/htmlapps-video-compressor/mt/

GitHub Pages does not provide custom route-specific COOP / COEP headers. The Pages deployment therefore stages a distinct MT entry without modifying the raw MT standalone:

| Pages path | Content |
| --- | --- |
| pages-dist/index.html | Byte-identical ST dist/index.html |
| pages-dist/index.mt.html | Original raw MT artifact, retained for downloads/imports |
| pages-dist/mt/index.html | MT Pages-only entry with scoped isolation bootstrap |
| pages-dist/mt/coi-serviceworker.js | Same-origin COI Service Worker limited to the /mt/ scope |
| pages-dist/other files | Original dist artifacts and manifests preserved |

scripts/prepare-pages.ps1 runs after the verified normal build and copies every existing dist file to pages-dist. The GitHub Pages workflow publishes pages-dist instead of dist. This retains existing artifact URLs while adding /mt/.

The fallback is coi-serviceworker v0.1.7, pinned by SHA-256 and upstream commit in coi-serviceworker.lock.json. The source is vendored under vendor/coi-serviceworker/ and its MIT license is under licenses/coi-serviceworker-MIT.txt.

When window.crossOriginIsolated === false, only the Pages /mt/ entry loads the same-origin worker script. The script registers a Service Worker with the default /mt/ scope, adds COOP / COEP to same-origin page responses, and normally reloads once so the resulting document is isolated. On a host with working server-side COOP / COEP the fallback is not loaded. If browser Service Workers are unavailable, the app retains its explicit MT-unavailable explanation rather than switching silently to ST.

## CSP and privacy boundaries

The ordinary ST and MT standalone files retain their original strict CSP and do not require an external runtime script. The GitHub Pages /mt/index.html copy alone adds 'self' to script-src and worker-src for its same-origin helper. It keeps connect-src 'none', 'wasm-unsafe-eval' and the other original restrictions.

GitHub Pages delivers the initial HTML and small same-origin helper over HTTP(S), and the Service Worker handles page resource responses. Source videos, compression settings and generated outputs remain inside the browser: this application does not upload them. The COI helper is limited to the Pages /mt/ scope and is not installed by the standard edition.

The original index.mt.html path remains available for downloads and imports, but visiting that raw file directly on GitHub Pages does not enable isolation. Use /mt/ to run MT on Pages.

## Browser Kitty and other hosting

Browser Kitty imports the **raw MT single HTML** and serves it with COOP same-origin and COEP require-corp on its compressor route. It must not import the GitHub Pages-only /mt/index.html wrapper or deploy the Pages Service Worker.

Cloudflare PR previews continue to isolate only raw MT artifact paths. On a normal isolated host, the raw MT HTML works without a Service Worker while retaining its self-contained runtime.

## Verification

scripts/check-repository.ps1 runs the regular ST/MT artifact, timing and UI regressions, followed by Pages staging and tests/pages-deployment.test.cjs. The Pages test checks the SHA-256 pin, full ST/raw-MT parity, the scoped helper and narrow CSP extension, and verifies that the MT page is otherwise byte-identical to the raw artifact.

After the Pages deployment, verify both actual browser URLs:
1. Open the ST URL and compress a sample MP4 without cross-origin isolation.
2. Open the /mt/ URL and let an initial reload complete. Confirm crossOriginIsolated is true and SharedArrayBuffer is available.
3. Compress short H.264/AAC MP4 and VP9/Opus WebM samples; check playback, audio removal, cancel/retry and saved-file decoding.
4. Confirm ST / and Browser Kitty do not register the Pages /mt/ Service Worker.
5. Check that MT is clearly unavailable in a browser without supported Service Workers.

Node lifecycle tests and build checks do not alone prove that a physical mobile browser can execute multi-threaded encoding. Real browser and mobile validation remain separate release checks.
