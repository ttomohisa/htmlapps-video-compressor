# Synthetic media timing fixtures

These tiny synthetic files come from FFmpeg WASM Builder v1.10.1, commit
`5f3f2752fd4bc13627ba34604fe7f550fec329fa`:
https://github.com/ttomohisa/htmlapps-ffmpeg-wasm-builder/tree/v1.10.1/tests/fixtures
They contain no user media. `generate-timing-fixtures.sh` regenerates the three
video-only timing fixtures with native FFmpeg/libx264:

- `timing-cfr.mp4`: 72 frames at 24 fps, exactly 3 seconds, 64×48.
- `timing-vfr.mp4`: six frames at 0, 0.083, 0.207, 0.249, 0.491, 0.532 seconds,
  ending at 0.573 seconds. Original must not stamp a constant-rate grid over them.
- `timing-single.mp4`: one frame with a 0.1-second display interval.
- `timing-audio-rotated.mp4`: upstream `smoke-rotated.mp4`, 48 frames over two
  seconds at 24 fps, with audio and a 90-degree display matrix.

`../test-core-timing.cjs` executes the emitted HTML's actual JS/WASM and real
argument builder. It checks positive sample durations, ordered presentation
cadence, full video/edit endpoints, audio and VP9/Opus controls, embedded asset
hashes, and exact root/readable/self-extract parity. MP4 movie/edit durations may
round to milliseconds; sample timing uses the exact media timescale. VFR edit
coverage is checked independently from decode-order sample durations.

The companion parser and parser unit tests are vendored from the same
Builder tag (the parser test fixture path is adapted) under `../test-support/`, with its MIT license. The generated core's
GPL license and corresponding-source provenance remain in THIRD_PARTY_NOTICES.md.

This Node/MEMFS integration suite supplements browser/WORKERFS export tests; it
does not claim browser UI, local-file launching, or visible playback coverage.
