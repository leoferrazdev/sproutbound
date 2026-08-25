# CrazyGames submission checklist

## Local package

- [x] HTML5 build with relative local paths.
- [x] English-first game UI with Portuguese fallback for `pt-*` browsers.
- [x] Mouse, keyboard, and touch input.
- [x] Portrait-first layout that remains playable inside desktop landscape viewports.
- [x] No runtime CDN, analytics, external font, or network request.
- [x] Build below the local 8 MB ceiling and below CrazyGames Basic Launch limits.
- [x] 69 automated tests passing for release `0.2.0-quality`.
- [x] Quality upload package prepared at `submission/sproutbound-quality-0.2.0.zip`.

## Basic Launch

- [ ] Run the CrazyGames Preview Tool with the final ZIP/build folder.
- [ ] Confirm Chrome and Edge playability, first-input onboarding, restart flow, and mobile layout.
- [ ] Fill English metadata and controls in the Developer Portal.
- [ ] Upload landscape, portrait, and square covers from `media/covers/`.
- [ ] Replace preview-video drafts with actual silent gameplay recordings.
- [ ] Submit only after the Preview Tool reports no blocking issue.

## Full Launch later

- [ ] Replace `src/platform-adapter.js` with the real CrazyGames SDK adapter.
- [ ] Wire the real `Gameplay start` and `Gameplay stop` events.
- [ ] Integrate ads only after Full Launch eligibility; Basic Launch monetization is disabled.
- [ ] Add CrazyGames account/data modules only if progression or account integration requires them.
