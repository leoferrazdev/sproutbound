# Sproutbound 0.2.0-quality

## Release decision

This release is a gameplay-quality candidate for another platform review. It must not be submitted as a “visual refresh”. The acceptance bar is a clearer first minute, a more legible reason to collect solar drops, a fairer difficulty curve, and enough visible progression to motivate another run.

## Product changes

- Solar drops are a resource: five collected drops charge a one-use solar shield.
- The shield absorbs one thorn-canopy collision and relaunches Pip. It does not forgive falling outside the route.
- Height is still measured from the highest world position, not from jump count or landing count.
- Route segments are explicit: safe intro (0–30 m), first hazards (30–90 m), moving canopy (90–180 m), and summit push (180–249 m).
- Every moving-canopy row contains one moving canopy only. Hazard rows retain a safe fixed alternative.
- Visual rewards are persistent at 10 m, 25 m, 60 m, and 240 m. A new run loads the highest unlocked Pip presentation.
- The first physical input starts gameplay. Restart remains a deliberate button action, and keyboard input supports arrows, A/D, and Q/Z layouts.
- Local feedback communicates landing, collection, shield readiness/consumption, milestones, and defeat. Audio is lazy, synthesized locally, and muted during platform pauses.
- Desktop landscape receives a compact guide panel; the playable stage remains the same 9:16 logical canvas.

## Non-negotiable constraints

- Keep Vanilla JavaScript + Canvas 2D for this project; do not add Three.js or a runtime dependency for this release.
- Keep runtime network-free: no CDN, analytics, external fonts, or remote assets.
- Keep the initial release files below 8 MB and free of `console.log`.
- Keep storage reads/writes behind the safe adapter and tolerate blocked private-mode storage.
- Keep platform lifecycle transitions idempotent. A start cannot follow start, and a stop cannot follow stop.
- Do not create real gameplay video files from static covers. Final previews must be recorded from the running build.

## Acceptance gates

### P0 — block submission

- [x] `npm test` passes: 69 tests.
- [x] `npm run check:build` passes: 59,338 audited bytes.
- [x] First input starts the game exactly once; no automatic gameplay start on load.
- [x] Game Over and summit stop gameplay exactly once.
- [x] Five solar drops visibly charge a shield; the shield is consumed by one thorn collision.
- [x] Height remains a world-position measurement and the summit is deterministic at 249 m.
- [x] Early route is hazard-free and moving rows contain one moving canopy.
- [ ] Chrome/Edge desktop, mobile portrait, and landscape smoke checks pass.
- [x] Anonymous/private storage failure does not freeze the run.

### P1 — required before a new review

- [x] At least one visual reward can be observed during a normal run and after reload.
- [x] Onboarding states touch/click and arrows plus A/D/Q/Z.
- [x] Solar collection, shield readiness, impact, milestone, and defeat have readable feedback.
- [x] Preview videos are captured from the final build and do not expose debug UI.
- [x] Submission documentation identifies this build as `0.2.0-quality`.

## QA evidence to record

Record the date, browser/device, build hash, highest height, solar drops collected, shield usage, and whether the player understood the first input without explanation. Keep platform portal state separate from local QA state; a passing local gate is not an approval or a public release.

## Release handoff

Local quality packages generated from this source state:

- `submission/sproutbound-quality-0.2.0.zip` — audited offline base for CrazyGames, GamePix, and other portals that do not require an SDK.
- `submission/sproutbound-quality-0.2.0-gamedistribution.zip` — GameDistribution variant with the platform SDK injected only at package time.

Only after every P0 and visible P1 gate is checked should these ZIPs and real gameplay previews be sent to a portal. CrazyGames, GameDistribution, and GamePix receive the same gameplay core but keep platform-specific packaging and SDK adapters separate.
