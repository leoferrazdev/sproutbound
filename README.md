# Sproutbound — Sunbound climb

> [!DANGER] SUBMISSOES BLOQUEADAS — 2026-08-26
> Segunda recusa consecutiva na CrazyGames com a mesma frase. Decisao registrada:
> **reformular partes estruturais antes de qualquer novo envio, a qualquer portal.**
>
> O bloqueio e mecanico: `npm run gate` precisa sair com codigo 0. Hoje sai 1, com
> 8 de 10 itens em aberto. Nenhum item pode ser marcado por opiniao.
>
> Diagnostico completo no cofre: `Diagnostico da segunda recusa CrazyGames - Sproutbound`.


An English-first vertical arcade game for web browsers. Pip is a small sprout that automatically bounces between leaves, collects solar drops, charges a one-use solar shield, and climbs toward the summit. Portuguese remains available automatically when the browser locale starts with `pt-`; unsupported locales fall back to English.

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
- `Q` / `Z` / `A` / `←`: move left.
- `D` / `→`: move right.
- The first physical input starts the run.
- After Game Over, only `Play again` starts a new run.

## MVP rules

- Fixed logical stage of 360×640, 9:16 portrait ratio, centered inside landscape viewports.
- Early leaves are safe and thorn-free so the first interaction is readable.
- Height is measured from the highest world position reached in metres; landings are not counted as points.
- Collected solar drops update the solar counter, charge a shield every five drops, and disappear once per run.
- The solar shield absorbs one thorn-canopy collision and relaunches Pip; falling out of the route remains a defeat.
- The route is divided into an intro (0–30 m), first hazards (30–90 m), moving canopy (90–180 m), and summit push (180–249 m).
- The route ends at an explicit summit at 249 m; reaching it freezes the run and unlocks Summit Crown.
- Later leaves may crack, move, dip on impact, or carry integrated thorns.
- Persistent visual milestones change Pip at 10 m, 25 m, 60 m, and 240 m; the current tier is loaded before each new run.
- Short local feedback pulses and synthesized cues communicate landings, solar collection, shield state, milestones, and defeat. Audio starts only after interaction and can be muted by platform pauses.
- Progress is persisted through a `try/catch` storage adapter; blocked storage never freezes the game.
- The platform adapter is neutral and idempotent. It contains no external SDK, `fetch`, or platform request in the base build.

## CrazyGames readiness

- Basic Launch: the local HTML5 build is eligible for submission without the CrazyGames SDK.
- Full Launch: requires replacing the neutral adapter with the real CrazyGames SDK integration, including gameplay lifecycle events and monetization rules.
- Submission media is in [`media/covers`](media/covers), with preparation notes in [`media/README.md`](media/README.md).

## CrazyGames build

Generate the portal-specific folder before using the CrazyGames upload dropzone:

```powershell
npm run build:crazygames
```

Upload the entire `submission/sproutbound-quality-0.2.0-crazygames-build/` folder. It contains the neutral `index.html` and never loads the GameDistribution SDK. Do not upload `*-gamedistribution-build/` to CrazyGames.

## Release gate

```powershell
npm run gate
```

Machine-checked submission gate. Exit code 0 is the only authorisation to upload to any
portal. Items that need a human are recorded in `docs/gate-manual-evidence.json`, copied
from the template; the gate rejects entries made against a different commit.

```powershell
npm run presubmit
```

Runs tests, build audit and the gate in sequence.

## Validation

```powershell
npm test
npm run check:build
```

The build audit rejects external URLs, `console.log` in release files, and any total above 8 MB. Manual gameplay checks are documented in [`docs/qa.md`](docs/qa.md).

## Quality release

Release `0.2.0-quality` is the first candidate intended for a new platform review. It is a gameplay release, not a cosmetic patch: the solar resource now has a defensive purpose, the summit is explicit, the difficulty is segmented, onboarding names every supported control layout, and persistent rewards are visible during the run. The release gate is documented in [`docs/quality-release-0.2.0.md`](docs/quality-release-0.2.0.md).

## GameDistribution build

```powershell
npm run build:gamedistribution
```

This creates a separate `submission/sproutbound-gamedistribution.zip` package with the official GameDistribution SDK and the platform adapter. The default `index.html` and the offline base build remain unchanged and continue to pass the zero-request audit. The upload and portal checklist are documented in [`docs/gamedistribution-submission.md`](docs/gamedistribution-submission.md).

## GamePix build

Generate the isolated offline package with:

```powershell
npm run build:gamepix
```

This creates a versioned `submission/sproutbound-quality-0.2.0-gamepix-build/` folder and ZIP. No GamePix SDK or runtime request is added. The portal metadata and submission gate are documented in [`docs/gamepix-submission.md`](docs/gamepix-submission.md); the portal still requires an original human-authored description before the game record can be created.

## All platform builds

```powershell
npm run build:all
```

This generates CrazyGames, GamePix and GameDistribution artifacts from the same source tree. It never uploads automatically. The architecture and upload rules are documented in [`docs/platform-builds.md`](docs/platform-builds.md).
