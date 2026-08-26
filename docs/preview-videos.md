# Preview videos — how to record them

Two videos are required. They are the only submission asset this repository cannot
produce on its own, because encoding needs a recorder running in a **visible** browser
tab: `requestAnimationFrame` is suspended in a hidden one.

## Requirements the platform publishes

| Item | Value |
| --- | --- |
| Landscape | 1080p, 16:9 → 1920×1080 |
| Portrait | 1080p, 2:3 → 1080×1620 |
| Duration | 15 to 20 seconds |
| Size | 50 MB maximum |
| Audio | none |
| Opening frame | the matching static cover |
| Forbidden | black bars, visible cursor, promotional text, fast-forward, app or social icons |

## Recording

1. Start a local server and keep the tab **visible** the whole time.

```bash
python -m http.server 8080 --bind 127.0.0.1
```

2. Open `http://127.0.0.1:8080/tools/record-preview.html`.

3. Pick a route. Route 7 is the default: it is the first with thorns, moving leaves and a
   goal that is not simply reaching the top, so it shows the game doing something.

4. Press **Gravar os dois formatos**. Each take is 17 seconds and starts on the cover.

5. Save both files into `media/videos/` keeping the names the tool gives them:

```
media/videos/sproutbound-landscape-preview.mp4
media/videos/sproutbound-portrait-preview.mp4
```

6. Delete the old `*-preview-quality.mp4` files. The gate refuses to pass while any
   unexpected preview file is still in the folder — the second submission shipped a
   preview worse than the first one, and this is the guard against repeating it.

7. Confirm:

```bash
npm run gate
```

## What the tool does

- Drives the real game, not a mock. The autopilot dodges thorns and chases the nearest
  reachable leaf, so a take never shows an early death.
- Frames it the way the desktop game actually looks: the biome backdrop fills the frame
  and the 9:16 playable column sits centred. No black bars, and no cropping of the play
  area.
- Draws the real HUD — route, height and the route goal. Those are game elements, not
  promotional text.
- Records with no audio track at all.
- Prefers MP4 with H.264 when the browser supports it, which Chrome does. If it falls back
  to WebM, convert before uploading:

```bash
ffmpeg -i input.webm -c:v libx264 -crf 20 -pix_fmt yuv420p -an output.mp4
```

- Checks the result against the specification and shows a pass/fail table.

## If a take looks wrong

- **The run dies early**: pick a lower-numbered route. The autopilot is competent, not
  perfect, and later routes are tighter.
- **Too much backdrop on the sides in landscape**: that is how the game looks on a desktop
  today. Changing it for the video would misrepresent the game, which the guidelines
  forbid. Fix it in the game first if it bothers you.
- **The file is large**: lower `videoBitsPerSecond` in the tool. The 50 MB ceiling is
  generous for 17 seconds of flat-colour art.
