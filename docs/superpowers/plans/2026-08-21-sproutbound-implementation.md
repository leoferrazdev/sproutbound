# Sproutbound MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first playable, portrait-first MVP of Sproutbound, a browser arcade game in which Pip climbs a giant tree by bouncing on leaves, avoiding thorns, collecting sun drops, and unlocking visual growth.

**Architecture:** A static offline HTML5 application will separate deterministic simulation from Canvas 2D rendering, input, UI, persistence, and platform adapters. The base build will not know Poki or CrazyGames APIs; platform-specific packages can wrap the neutral adapter after the core loop and QA are proven.

**Tech Stack:** Plain HTML5, CSS, JavaScript modules, Canvas 2D, Node.js built-in `node:test`, and local scripts only. No runtime dependencies, CDNs, external fonts, network services, or third-party analytics.

## Global Constraints

- The new project is independent of Neon Dodge and lives at `D:\LEONARDO\Games\sproutbound`.
- The technical slug is `sproutbound`; the working display title is `Salto ao Sol`.
- The base build has zero external requests and no CDN dependencies.
- The initial download must remain below 8 MB.
- The gameplay stage is portrait-first, approximately 9:16, and must not be stretched in landscape or desktop.
- Touch, mouse, and keyboard input must be supported.
- `localStorage` reads and writes must be inside robust `try/catch` fallbacks.
- No `console.log`, debug panel, test overlay, or development tool may ship in the release build.
- The first MVP has one player, safe leaves, fixed thorns, sun drops, height score, Game Over, restart, and one visual unlock.
- Multiplayer, online ranking, advertisements, real SDKs, accounts, shops, premium currency, and multiple worlds are out of scope for the first MVP.
- Each task ends with an independently runnable test and a focused commit.

## File Map

Create these files during implementation:

```text
index.html                         Application shell and canvas mount
styles.css                         Responsive portrait-first layout and safe areas
package.json                       Test and build-check scripts
src/main.js                         Composition root and browser event wiring
src/input.js                        Device-neutral input state
src/storage.js                      Safe local persistence adapter
src/platform-adapter.js             Neutral platform lifecycle contract
src/game/model.js                   Run and entity data structures
src/game/world.js                   Deterministic platform and collectible generation
src/game/player.js                  Pip movement, bounce and collision primitives
src/game/simulation.js               Fixed-step-compatible game rules
src/game/progression.js              Height milestones and visual unlock state
src/game/game-loop.js                Frame timing, state transitions and camera
src/render/canvas-renderer.js        Canvas drawing for Pip, leaves, thorns and world
src/ui/hud.js                        Score, record, objective and unlock HUD
src/ui/screens.js                    Ready, Game Over and restart screens
tests/model.test.js                  Entity and run invariants
tests/world.test.js                  Deterministic world generation
tests/simulation.test.js             Bounce, collision, score and failure rules
tests/progression.test.js            Milestones and storage failure behavior
tests/platform-adapter.test.js       Lifecycle contract and no-duplication rules
tests/build.test.js                  Release audit and bundle-size guard
tools/check-build.mjs                Static build and external-request audit
README.md                            Project usage and validation instructions
```

## Task 1: Scaffold the offline browser shell

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `styles.css`
- Create: `src/main.js`
- Create: `tests/smoke.test.js`
- Create: `tools/check-build.mjs`

**Interfaces:**
- `src/main.js` exports `createApp(documentRef)` and mounts exactly one `<canvas>`.
- `tools/check-build.mjs` exits with code `0` only when the build has no external URL references and is below 8 MB.

- [ ] **Step 1: Write the failing shell smoke test**

Create a Node test that reads `index.html` and asserts the presence of `#game`, `canvas`, `type="module"`, and the absence of `http://` and `https://` strings.

- [ ] **Step 2: Run the smoke test and verify it fails**

Run `npm test -- --test-name-pattern="offline shell"`.

Expected: FAIL because the project files and scripts do not exist yet.

- [ ] **Step 3: Implement the minimal shell**

Create a viewport-safe HTML document with a single canvas, a module script, local CSS, and no external resource tags. Add `npm test` as `node --test` and `npm run check:build` as `node tools/check-build.mjs`.

- [ ] **Step 4: Run the shell checks**

Run `npm test -- --test-name-pattern="offline shell"` and `npm run check:build`.

Expected: PASS; the shell is offline and the bundle is below 8 MB.

- [ ] **Step 5: Commit**

```bash
git add package.json index.html styles.css src/main.js tests/smoke.test.js tools/check-build.mjs
git commit -m "chore: scaffold offline browser shell"
```

## Task 2: Define the deterministic game model and world

**Files:**
- Create: `src/game/model.js`
- Create: `src/game/world.js`
- Create: `tests/model.test.js`
- Create: `tests/world.test.js`

**Interfaces:**
- `createRun(seed = 1)` returns `{ state, score, bestScore, player, platforms, sunDrops, cameraY, nextUnlock }`.
- `createPlatform({ x, y, width, kind = 'leaf' })` returns `{ x, y, width, height: 18, kind }`.
- `createWorld(seed, { width, height })` returns a deterministic array of safe leaf platforms, thorn hazards, and sun drops.
- `resetWorld(run, seed)` replaces the generated entities without changing progression.

- [ ] **Step 1: Write failing model tests**

Assert that a new run starts in `ready`, has score `0`, has a player, has a starting platform, and contains no hazards in the first safe segment.

- [ ] **Step 2: Write failing deterministic-world tests**

Create two worlds with the same seed and viewport and assert deep equality. Assert that platform widths stay within the defined readable range and that the first three platforms are reachable by the initial jump envelope.

- [ ] **Step 3: Implement model constructors**

Use plain objects and named constants. Keep all coordinates in logical portrait units so rendering can scale without changing simulation values.

- [ ] **Step 4: Implement the initial world generator**

Generate a safe starting platform, then stagger leaves upward. Add sun drops only after a safe landing opportunity. Do not generate thorns before the 40 m difficulty threshold.

- [ ] **Step 5: Run model and world tests**

Run `npm test -- tests/model.test.js tests/world.test.js`.

Expected: PASS with deterministic output and no random test flakiness.

- [ ] **Step 6: Commit**

```bash
git add src/game/model.js src/game/world.js tests/model.test.js tests/world.test.js
git commit -m "feat: add deterministic sproutbound world model"
```

## Task 3: Implement Pip physics, landing and failure rules

**Files:**
- Create: `src/game/player.js`
- Create: `src/game/simulation.js`
- Create: `tests/simulation.test.js`

**Interfaces:**
- `createPlayer({ x, y })` returns `{ x, y, vx: 0, vy: 0, width: 26, height: 34, grounded: true, dead: false }`.
- `stepPlayer(player, input, dt, bounds)` mutates no input and returns a new player state.
- `stepRun(run, input, dt)` returns `{ run, events }`, where events may include `landed`, `collectedSun`, `playerDied`, and `milestoneReached`.
- `rectsOverlap(a, b)` returns a boolean for axis-aligned collision checks.

- [ ] **Step 1: Write failing physics tests**

Cover horizontal steering, gravity, automatic bounce after a valid landing, thorn collision, falling below the camera, and clamped delta time.

- [ ] **Step 2: Run the physics tests and verify failure**

Run `npm test -- tests/simulation.test.js`.

Expected: FAIL because the simulation functions do not exist.

- [ ] **Step 3: Implement player movement**

Apply input acceleration, horizontal bounds, gravity, and a fixed bounce impulse. Use `Math.min(dt, 1 / 30)` so a paused or background tab cannot create a tunneling jump.

- [ ] **Step 4: Implement collision and scoring**

Only allow a leaf landing when Pip is descending and crosses the top of the leaf. On landing, set `grounded`, reset `vy` to the bounce impulse, increment height score, and emit `landed`. A thorn overlap or fall below the failure threshold sets `dead` and emits `playerDied` once.

- [ ] **Step 5: Run the simulation tests**

Run `npm test -- tests/simulation.test.js`.

Expected: PASS for all physics and failure cases.

- [ ] **Step 6: Commit**

```bash
git add src/game/player.js src/game/simulation.js tests/simulation.test.js
git commit -m "feat: add Pip physics and ascent rules"
```

## Task 4: Add input normalization, camera and runtime state

**Files:**
- Create: `src/input.js`
- Create: `src/game/game-loop.js`
- Modify: `src/main.js`
- Create: `tests/input.test.js`

**Interfaces:**
- `createInputState()` returns `{ left: false, right: false, pointerX: null, active: false }`.
- `bindInput(target, state)` returns `unbindInput()` and listens to pointer, keyboard, blur, and visibility changes.
- `readInput(state, viewportWidth)` returns `{ axis: -1 | 0 | 1 }`.
- `createGameLoop({ canvas, simulation, renderer, ui, input })` returns `{ start, stop, pause, resume }`.
- `advanceCamera(run, viewportHeight)` returns a new camera position that keeps Pip near the upper middle third while ascending.

- [ ] **Step 1: Write failing input tests**

Assert that left and right keyboard events map to the correct axis, pointer input maps to the left or right half of the logical stage, and blur clears active input.

- [ ] **Step 2: Implement normalized input**

Use pointer events for touch and mouse, `ArrowLeft`/`ArrowRight` and `A`/`D` for keyboard, and `preventDefault()` only for game-owned pointer interactions. Do not start gameplay from a menu card or non-game button.

- [ ] **Step 3: Implement the frame loop**

Use `requestAnimationFrame`, calculate elapsed time, call `stepRun`, advance the camera, render, and update UI. Keep simulation independent of refresh rate and stop the loop when the document is hidden.

- [ ] **Step 4: Connect the Ready and Playing states**

The first physical gameplay input transitions from `ready` to `playing`. Restart is an explicit button action that resets the run but waits for the next gameplay input before starting it.

- [ ] **Step 5: Run input and existing tests**

Run `npm test`.

Expected: PASS with no duplicate input listeners after `unbindInput()`.

- [ ] **Step 6: Commit**

```bash
git add src/input.js src/game/game-loop.js src/main.js tests/input.test.js
git commit -m "feat: add responsive input and game loop"
```

## Task 5: Render the Sproutbound world and character

**Files:**
- Create: `src/render/canvas-renderer.js`
- Modify: `src/game/game-loop.js`
- Modify: `src/main.js`

**Interfaces:**
- `createCanvasRenderer(canvas)` returns `{ resize, render }`.
- `resize(viewport)` updates the logical-to-device transform without changing simulation coordinates.
- `render(snapshot)` draws the background, layered tree world, leaves, thorns, sun drops, Pip, and safe-area decorations.

- [ ] **Step 1: Write the renderer contract test**

Assert that `createCanvasRenderer` exposes `resize` and `render`, and that rendering an empty snapshot does not throw when the canvas context is unavailable in the Node test environment.

- [ ] **Step 2: Implement logical portrait scaling**

Use a logical stage of `360 x 640` or another fixed 9:16 coordinate space, preserve aspect ratio with `contain`, and center the stage. Never stretch the world to fill an arbitrary viewport.

- [ ] **Step 3: Draw the theme with local primitives**

Draw Pip from simple filled shapes, leaves from convex paths, thorns from high-contrast triangles, sun drops from circles and rays, and the world from procedural parallax layers. Keep the active gameplay area visually quieter than the background.

- [ ] **Step 4: Add gameplay feedback**

Draw landing compression, a short vertical squash on bounce, a sun-drop pulse, and a clear death pose. Use no external images or fonts.

- [ ] **Step 5: Verify visually with the local browser**

Run the static server defined in `package.json`, inspect portrait and landscape viewports, and confirm that Pip, leaves, thorns and score remain legible at device pixel ratio 1.

- [ ] **Step 6: Commit**

```bash
git add src/render/canvas-renderer.js src/game/game-loop.js src/main.js
git commit -m "feat: render Sproutbound theme"
```

## Task 6: Add progression and safe persistence

**Files:**
- Create: `src/game/progression.js`
- Create: `src/storage.js`
- Create: `tests/progression.test.js`
- Modify: `src/game/simulation.js`

**Interfaces:**
- `getMilestone(height)` returns the next milestone object or `null`.
- `applyProgression(progress, event)` returns `{ progress, unlocked }`.
- `createSafeStorage(storageLike)` returns `{ load, save, clear }`.
- `load()` returns a validated default object when storage is absent, throws, or contains malformed JSON.
- `save(value)` returns `true` or `false` and never throws to the caller.

- [ ] **Step 1: Write failing progression tests**

Assert that the first visual unlock occurs in the first session, repeated milestones do not duplicate unlocks, malformed data falls back to defaults, and a storage adapter that always throws leaves the game playable.

- [ ] **Step 2: Implement milestones**

Define an explicit first unlock at a reachable early height, followed by later visual milestones. Each unlock changes only Pip presentation and the next-objective text.

- [ ] **Step 3: Implement the safe storage adapter**

Wrap every `getItem`, `setItem`, and `removeItem` call in `try/catch`. Validate the version and array/object shapes before accepting loaded data.

- [ ] **Step 4: Connect progression events to the run**

On `milestoneReached`, update progression, persist it, and expose the next milestone to the HUD. A failed save must not alter the current in-memory run.

- [ ] **Step 5: Run progression tests**

Run `npm test -- tests/progression.test.js`.

Expected: PASS, including injected storage failures.

- [ ] **Step 6: Commit**

```bash
git add src/game/progression.js src/storage.js src/game/simulation.js tests/progression.test.js
git commit -m "feat: add visual growth progression and safe save"
```

## Task 7: Add HUD, screens and responsive accessibility

**Files:**
- Create: `src/ui/hud.js`
- Create: `src/ui/screens.js`
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `src/main.js`

**Interfaces:**
- `createHud(root)` returns `{ update, showObjective, showRecord }`.
- `createScreens(root, actions)` returns `{ showReady, showPlaying, showGameOver }`.
- `showGameOver` must expose the current height, record, next unlock, and a button with an explicit restart label.

- [ ] **Step 1: Write the DOM contract test**

Assert that the shell contains accessible labels for score, height, objective, restart, and pause state, and that no required information exists only in the landscape side panel.

- [ ] **Step 2: Implement the HUD**

Keep score and height near the top safe area, show one short objective at a time, and reveal the next unlock after Game Over. Use CSS variables and local system font stacks.

- [ ] **Step 3: Implement Ready and Game Over screens**

Ready shows one action hint and does not block the first input with a long tutorial. Game Over provides a clear restart button and does not restart merely because the user clicked an unrelated screen region.

- [ ] **Step 4: Implement responsive layout**

Use `aspect-ratio`, `max-height`, `env(safe-area-inset-*)`, `touch-action`, and `user-select: none` only where appropriate. In landscape, center the portrait stage and use side panels only for secondary information.

- [ ] **Step 5: Run browser smoke validation**

Check portrait mobile, landscape mobile, 16:9 desktop, keyboard navigation for buttons, and text legibility at device pixel ratio 1.

- [ ] **Step 6: Commit**

```bash
git add index.html styles.css src/ui/hud.js src/ui/screens.js src/main.js
git commit -m "feat: add onboarding HUD and responsive screens"
```

## Task 8: Implement the neutral platform adapter

**Files:**
- Create: `src/platform-adapter.js`
- Create: `tests/platform-adapter.test.js`
- Modify: `src/main.js`

**Interfaces:**
- `createPlatformAdapter({ onPause, onResume })` returns `startGameplay`, `stopGameplay`, `requestCommercialBreak`, `pauseInput`, and `resumeInput`.
- `startGameplay()` is accepted only when the adapter is stopped and returns a promise.
- `stopGameplay()` is accepted only when the adapter is active and returns a promise.
- `requestCommercialBreak()` never runs during `playing` in the base build and resolves without external work.

- [ ] **Step 1: Write failing lifecycle tests**

Assert that consecutive starts and consecutive stops do not produce duplicate transitions, that pause blocks input, and that the base adapter performs no network request.

- [ ] **Step 2: Implement the neutral adapter**

Keep lifecycle state private. Do not assign `window.PokiSDK`, load a portal SDK, or call `fetch` in the base build. Platform packages may wrap this adapter later.

- [ ] **Step 3: Connect state transitions**

Call `startGameplay` only after the first physical gameplay input. Call `stopGameplay` on pause, Game Over, and return to Ready. Ensure a restart button click does not immediately start the next gameplay session.

- [ ] **Step 4: Run lifecycle and full tests**

Run `npm test`.

Expected: PASS with no duplicate lifecycle events.

- [ ] **Step 5: Commit**

```bash
git add src/platform-adapter.js src/main.js tests/platform-adapter.test.js
git commit -m "feat: add neutral platform lifecycle adapter"
```

## Task 9: Complete release audit and documentation

**Files:**
- Modify: `tools/check-build.mjs`
- Create: `tests/build.test.js`
- Create: `README.md`
- Create: `docs/qa.md`

**Interfaces:**
- `tools/check-build.mjs` recursively measures release files, rejects external URLs, rejects debug artifacts, and rejects a total above 8 MB.
- `README.md` documents local run, controls, scope, orientation behavior, and test commands.
- `docs/qa.md` records the manual matrix for portrait, landscape, desktop, storage failure, input, performance, and visual clarity.

- [ ] **Step 1: Write failing release-audit tests**

Assert that the audit catches an external script reference, a `console.log`, and a bundle over 8 MB using temporary fixtures.

- [ ] **Step 2: Implement the release audit**

Scan only release source files, ignore `.git` and test fixtures, report the exact offending file, and return nonzero on any violation.

- [ ] **Step 3: Document the reproducible checks**

Add `npm test`, `npm run check:build`, and the local static-server command to the README. Add a checklist with expected results to `docs/qa.md`.

- [ ] **Step 4: Run the complete verification set**

Run:

```bash
npm test
npm run check:build
git status --short
```

Expected: all tests pass, the build audit passes, and only intentional project files are present.

- [ ] **Step 5: Commit**

```bash
git add tools/check-build.mjs tests/build.test.js README.md docs/qa.md
git commit -m "chore: add release audit and QA checklist"
```

## Task 10: Create the GitHub repository and publish the implementation

**Files:**
- Remote repository: `https://github.com/leoferrazdev/sproutbound`
- Local source: `D:\LEONARDO\Games\sproutbound`

- [ ] **Step 1: Confirm the final local verification**

Run `npm test` and `npm run check:build` after the last implementation commit.

- [ ] **Step 2: Create the remote repository**

Using the authenticated GitHub workflow, create `leoferrazdev/sproutbound` as a private repository unless the user explicitly requests public visibility. Do not transmit credentials into files or commits.

- [ ] **Step 3: Add the remote and push `main`**

```bash
git remote add origin https://github.com/leoferrazdev/sproutbound.git
git push -u origin main
```

- [ ] **Step 4: Verify the remote contents**

Confirm that the default branch is `main`, the expected commits are present, and the README and design/plan documents are visible. Do not call the project ready for platform submission until a browser smoke test proves the public build behavior.

## Completion Criteria

The MVP is ready for the next playtest phase when the local build starts offline, the first input is clear, Pip can climb and fail consistently, one visual growth milestone can be earned and saved safely, portrait and landscape layouts remain legible, the release audit passes below 8 MB, and the complete test suite is green.
