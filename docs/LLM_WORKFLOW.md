# LLM maintenance workflow

1. Read `AGENTS.md`, `APP_SPEC.md`, and this file before editing.
2. Make UI and logic changes only in `src/index.template.html`.
3. Keep all third-party packages exact-pinned in `dependencies.json`.
4. Do not paste dependency binaries into source; let the build script embed them.
5. Run `scripts/check-source.ps1` before building.
6. Build with `build-standalone.bat` on Windows.
7. Test both `dist/index.html` and `dist/index.self-extract.html` by opening them directly.
8. At 360–430 px widths, verify the mobile compression action dock and bottom-sheet dialogs.
9. Test one short video with every codec, audio kept and removed, and at least two resolutions.
10. Verify preview, download, share fallback, cancellation, Japanese/English, and mobile layout.
11. Open DevTools Network and confirm zero runtime requests.

When updating ffmpeg.wasm, change the version only after checking the package license, available encoders, artifact paths, and browser compatibility. Update `THIRD_PARTY_NOTICES.md` and `CHANGELOG.md` in the same change.
