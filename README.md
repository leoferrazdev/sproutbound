# Sproutbound — Sunbound climb

An English-first vertical arcade MVP for web browsers. Pip is a small sprout that automatically bounces between leaves, collects solar drops, and climbs toward the summit. Portuguese remains available automatically when the browser locale starts with `pt-`; unsupported locales fall back to English.

## Run locally

The project has no runtime dependencies, CDN, external fonts, analytics, or HTTP requests from the game runtime.

```powershell
cd D:\LEONARDO\Games\sproutbound
python -m http.server 8080
```

Open `http://localhost:8080` in a browser. A local server is required because the game uses ES modules.

## Controls

- Tap/click the left or right half of the stage to guide Pip.
- `A` / `←`: move left.
- `D` / `→`: move right.
- The first physical input starts the run.
- After Game Over, only `Play again` starts a new run.

## MVP rules

- Fixed logical stage of 360×640, 9:16 portrait ratio, centered inside landscape viewports.
- Early leaves are safe and thorn-free so the first interaction is readable.
- Height is measured from the highest world position reached in metres; landings are not counted as points.
- Collected solar drops update the solar counter and disappear once per run.
- The route ends at an explicit summit near 249 m; reaching it freezes the run and unlocks Summit Crown.
- Later leaves may crack, move, dip on impact, or carry integrated thorns.
- Progress is persisted through a `try/catch` storage adapter; blocked storage never freezes the game.
- The platform adapter is neutral and idempotent. It contains no external SDK, `fetch`, or platform request in the base build.

## CrazyGames readiness

- Basic Launch: the local HTML5 build is eligible for submission without the CrazyGames SDK.
- Full Launch: requires replacing the neutral adapter with the real CrazyGames SDK integration, including gameplay lifecycle events and monetization rules.
- Submission media is in [`media/covers`](media/covers), with preparation notes in [`media/README.md`](media/README.md).

## Validation

```powershell
npm test
npm run check:build
```

The build audit rejects external URLs, `console.log` in release files, and any total above 8 MB. Manual gameplay checks are documented in [`docs/qa.md`](docs/qa.md).

## GameDistribution build

```powershell
npm run build:gamedistribution
```

This creates a separate `submission/sproutbound-gamedistribution.zip` package with the official GameDistribution SDK and the platform adapter. The default `index.html` and the offline base build remain unchanged and continue to pass the zero-request audit. The upload and portal checklist are documented in [`docs/gamedistribution-submission.md`](docs/gamedistribution-submission.md).
