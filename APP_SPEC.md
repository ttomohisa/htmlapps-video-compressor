# Application specification

## Product goal

Provide an understandable video compressor that works as one offline HTML file. A non-expert should be able to choose a video, accept sensible automatic settings, adjust only the essentials, see an estimated size, compress, preview, save, and share.

## Basic settings

- Resolution: original, 4K, 1440p, 1080p, 720p, 480p, 360p
- No upscaling; preserve aspect ratio; force even output dimensions
- Video bitrate:
  - Automatically recommended from output pixels, frame rate, codec, and estimated source bitrate
  - Minimum 250 kbps
  - Dynamic maximum by output resolution and codec, rather than one excessive global ceiling
  - Typical H.264 maximums: 1,200 kbps at 360p, 2,000 at 480p, 4,000 at 720p, 8,000 at 1080p, 12,000 at 1440p, and 18,000 at 4K
- Codec:
  - H.264 (`libx264`) in MP4
  - H.265 (`libx265`) in MP4 with `hvc1` tag
  - VP9 (`libvpx-vp9`) in WebM
- Remove audio checkbox
- Estimated size: `duration × (video bitrate + audio bitrate) ÷ 8 × 1.035`

## Automatic defaults

- H.264 / MP4 for broad playback compatibility
- Preserve videos at or below 360p and cap larger sources at an appropriate step, with 1080p as the default ceiling for sources above Full HD
- Use 30 fps for detected high-frame-rate sources; otherwise preserve the source frame rate
- Fast encoding preset
- 96 kbps audio
- Keep the recommendation below the estimated source video bitrate where possible to avoid a larger output

## Selected-video information

- File name and format
- File size
- Duration
- Resolution
- Estimated total bitrate, calculated from file size and duration
- Measured frame rate when `requestVideoFrameCallback` is available and the browser can decode the file
- Clear unavailable state when metadata cannot be obtained

## Advanced settings

- Frame rate: original, 60, 30, 24 fps
- Encoding speed: fastest, fast, balanced, higher compression
- Audio bitrate: 64, 96, 128, 192 kbps
- Keep metadata checkbox; metadata is removed by default

## Help

- The application includes an in-page dialog covering basic steps, privacy, setting guidance, interpretation of detected metadata, sharing behavior, and troubleshooting.
- Every basic and advanced setting has an info button with practical guidance and usage examples.

## Result

- In-page video preview
- Original size, output size, actual percentage reduction, and processing time
- Save button
- Web Share API file share button, with download fallback
- H.265 preview compatibility warning
- Confirmation dialog before discarding a result to compress another video

## Privacy and persistence

- No uploads or runtime requests
- No analytics, ads, remote fonts, external images, or CDN assets
- Video contents are not stored in localStorage or IndexedDB
- Only the language preference may be persisted
- CSP must contain `connect-src 'none'`

## Error and cancellation behavior

- Reject files over 1.5 GB with a clear memory warning
- Allow compression even if browser metadata parsing is incomplete
- Cancel by terminating the worker, releasing its in-memory file system
- Keep the processing log available in a disclosure section
- Show elapsed time during processing and keep warning messages from looking like fatal errors
- For H.265, force `ultrafast` + `zerolatency`, disable x265 pools/WPP/lookahead/B-frames/AQ/CU-tree, and omit VBV max-rate/buffer options
- Lock the H.265 speed control to Fastest and label it experimental
- If H.265 has no visible progress after 12 seconds, offer an in-place retry with H.264
