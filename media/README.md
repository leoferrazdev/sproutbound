# CrazyGames submission media

The three SVG files in `covers/` are the editable cover sources:

- `sproutbound-landscape.svg`: 1920×1080, 16:9
- `sproutbound-portrait.svg`: 800×1200, 2:3
- `sproutbound-square.svg`: 800×800, 1:1

They contain only the game title and original local artwork. Rasterize them to PNG before uploading to CrazyGames. Preview videos should use the same opening frame as the corresponding cover, contain gameplay only, have no sound, and stay within 20 seconds and 50 MB.

PNG exports are ready for upload:

- `sproutbound-landscape.png`: 1920×1080
- `sproutbound-portrait.png`: 800×1200
- `sproutbound-square.png`: 800×800

The original MP4 files without `-quality` remain lightweight visual drafts generated from the covers. The `-quality` files are the new candidate previews captured from the running local build with `?lang=en`, after a real first input and steering sequence:

- `sproutbound-landscape-preview-quality.mp4`: 1280×720, 10 seconds, silent, H.264.
- `sproutbound-portrait-preview-quality.mp4`: 800×1200, 10 seconds, silent, H.264.

The quality captures show gameplay only and contain no debug UI. Inspect them before uploading; the CrazyGames preview guidance expects the video to represent gameplay and not be misleading.
