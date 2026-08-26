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

Preview videos are recorded with `tools/record-preview.html`; the procedure and the
platform requirements are in [`docs/preview-videos.md`](../docs/preview-videos.md).

The old `*-preview-quality.mp4` files are **not** submittable: 1280x720 and 800x1200 at 10
seconds, against a requirement of 1080p and 15 to 20 seconds. The files without the suffix
were generated from the covers and are not gameplay at all. Delete both sets once the real
takes are recorded; `npm run gate` fails while any unexpected preview file remains in the
folder.
