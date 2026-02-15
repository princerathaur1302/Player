## Packages
hls.js | Core HLS playback engine
framer-motion | Smooth animations for UI elements
clsx | Utility for conditional classes
tailwind-merge | Utility for merging tailwind classes

## Notes
- The player must use the proxy endpoints for playback to handle referrer headers correctly.
- Player src URL will be: `/api/proxy/manifest?url=${encodedUrl}&referrer=${encodedReferrer}`
- Backend handles rewriting segment URLs in the manifest.
- Double tap interaction requires careful touch event handling.
