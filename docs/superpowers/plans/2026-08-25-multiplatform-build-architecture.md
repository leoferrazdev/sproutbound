# Sproutbound Multiplatform Build Architecture Implementation Plan

> **For agentic workers:** Execute this plan inline in the current session, task-by-task, with a test checkpoint after each task.

**Goal:** Consolidate Sproutbound into one shared game base with deterministic, isolated, versioned builds for CrazyGames, GamePix and GameDistribution.

**Architecture:** Keep the neutral runtime in `src/` and isolate portal-specific runtime entrypoints and SDKs behind platform profiles. Use a generic filesystem/ZIP builder for neutral builds, retain the specialized GameDistribution SDK transform, and expose one build command per platform plus `build:all`.

**Tech Stack:** Vanilla HTML/CSS/JavaScript ES modules, Node.js built-in test runner, Node.js `fs/promises`, `tar`, Git metadata and Obsidian Markdown documentation.

## Global Constraints

- The base build has no external requests, CDN, analytics or external fonts.
- Portal SDKs may exist only in the build profile that requires them.
- Every package must have `index.html` at its root.
- Every platform build must exclude SDK files from other platforms.
- Build output must remain below the local 8 MB release ceiling.
- Existing submission artifacts and unrelated dirty files must be preserved.
- No portal upload is performed automatically by the build pipeline.

---

### Task 1: Define the build contract with failing tests

**Files:**
- Modify: `tests/platform-builds.test.js`
- Test: `tests/platform-builds.test.js`

**Interfaces:**
- Consumes: existing `buildCrazyGames()`.
- Produces: test coverage for `buildGamePix()`, `buildAll()`, manifest metadata and cross-platform isolation.

- [x] Add tests that import `buildGamePix` and `buildAll`, create temporary output paths, assert root `index.html`, assert a `build-manifest.json`, and assert that GamePix has no GameDistribution SDK references.
- [x] Run `node --test tests/platform-builds.test.js` and confirm failure because the new modules do not exist.

### Task 2: Implement the generic profile-based builder

**Files:**
- Create: `platforms/crazygames/config.mjs`
- Create: `platforms/gamepix/config.mjs`
- Create: `platforms/gamedistribution/config.mjs`
- Create: `tools/build-platform.mjs`
- Modify: `tools/build-crazygames.mjs`
- Create: `tools/build-gamepix.mjs`

**Interfaces:**
- `buildPlatform({ projectRoot, profile, outputRoot, zipPath })` returns `{ outputRoot, zipPath, manifest }`.
- A profile declares `platform`, `entrypoint`, `removePaths`, `archiveName`, `outputDirectory` and `externalUrls`.
- `buildGamePix()` creates a neutral offline package.
- `buildCrazyGames()` uses the neutral profile and excludes GameDistribution files.

- [x] Implement deterministic copying of `index.html`, `styles.css`, `src/` and local manifest metadata.
- [x] Implement profile-specific removals before manifest generation.
- [x] Write a manifest with package version, platform, entrypoint, file list and allowed external URLs; do not include timestamps or secrets.
- [x] Create ZIP files with the required root entries.
- [x] Run the focused tests and confirm green.

### Task 3: Add GameDistribution profile and aggregate build command

**Files:**
- Modify: `tools/build-gamedistribution.mjs`
- Create: `tools/build-all.mjs`
- Modify: `package.json`
- Modify: `tests/platform-builds.test.js`

**Interfaces:**
- `buildGameDistribution()` continues to create the existing SDK package.
- `buildAll()` returns one result per configured platform and does not upload externally.

- [x] Add the GameDistribution profile metadata while preserving its existing SDK URL and entrypoint transformation.
- [x] Add `npm run build:gamepix` and `npm run build:all`.
- [x] Add a test that `build:all` produces three platform manifests without mixing platform entrypoints.
- [x] Run the focused tests and then the complete test suite.

### Task 4: Update operational documentation and vault status

**Files:**
- Modify: `README.md`
- Modify: `docs/crazygames-submission.md`
- Modify: `docs/gamepix-submission.md`
- Modify: `docs/gamedistribution-submission.md`
- Create: `docs/platform-builds.md`
- Modify: `D:/LEONARDO/Games/cofre-games/03 - Projetos/Sproutbound/04 - Validação/Separação de builds por plataforma - CrazyGames e GameDistribution.md`

**Interfaces:**
- Documentation names the exact build command and upload artifact for every supported platform.
- Vault records observed evidence, implementation status and remaining portal validation separately.

- [x] Document `build:crazygames`, `build:gamepix`, `build:gamedistribution` and `build:all`.
- [x] State that `build:all` creates artifacts only and never submits automatically.
- [x] Record the current Sproutbound architecture as locally implemented, with portal Preview/approval states remaining separate.

### Task 5: Execute quality gates

**Files:**
- No production file changes.

- [x] Run `npm test` — 72 tests passed.
- [x] Run `npm run check:build` — 22 release files, 59,495 bytes.
- [x] Run each platform build and audit its output.
- [x] Verify each ZIP has `index.html` at root and no cross-platform SDK references.
- [x] Review `git status --short`; preserve pre-existing untracked submission artifacts and do not upload or push without a separate release instruction.
