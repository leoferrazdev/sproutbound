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

Preview videos live in `videos/` and are recorded with `tools/record-preview.html`; the
procedure and the platform requirements are in [`docs/preview-videos.md`](../docs/preview-videos.md).

Current takes, recorded 2026-08-26 and verified against the specification:

| File | Resolution | Duration | Audio | Size |
| --- | --- | --- | --- | --- |
| `videos/sproutbound-landscape-preview.mp4` | 1920x1080 | 16.85 s | none | 14.4 MB |
| `videos/sproutbound-portrait-preview.mp4` | 1080x1620 | 16.87 s | none | 15.8 MB |

The earlier drafts were deleted: two were generated from the covers and were not gameplay
at all, and two were 1280x720 and 800x1200 at 10 seconds, against a requirement of 1080p
and 15 to 20 seconds. `npm run gate` fails while any unexpected preview file sits in the
folder, so a stale take cannot be uploaded by accident.
