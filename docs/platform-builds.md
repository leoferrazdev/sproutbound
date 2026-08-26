# Multiplatform build architecture

## Deterministic decision

Sproutbound uses one shared game base and one isolated build profile per portal. The project does not maintain independent gameplay copies and does not upload one platform's package to another portal.

## Recommended architecture

- `src/` contains gameplay, rendering, UI, audio, storage and the neutral platform contract.
- `platforms/<portal>/config.mjs` declares entrypoint, allowed URLs, output naming and files to remove.
- `src/platform-adapters/` contains only runtime integrations required by a portal build.
- `tools/build-platform.mjs` provides deterministic copying, profile cleanup, manifest generation and ZIP creation.
- `tools/build-<platform>.mjs` is the explicit entrypoint for each portal.
- `tools/build-all.mjs` creates all artifacts but never uploads them.

The gameplay core never imports a portal SDK. Platform integrations must be accessed through the adapter contract.

## Builds

```powershell
npm run build:crazygames
npm run build:gamepix
npm run build:gamedistribution
npm run build:all
```

The current release is `0.2.0`. Each generated package contains `index.html` at its root and a `build-manifest.json` containing platform, version, entrypoint, source commit, allowed URLs and file list.

The CrazyGames and GamePix builds are neutral and exclude the GameDistribution adapter. The GameDistribution build is the only package that includes its official SDK URL and platform entrypoint.

## Mandatory rules

1. Never upload `*-gamedistribution-build/` to CrazyGames or GamePix.
2. Never place an external SDK in the neutral base runtime.
3. Verify `index.html` at the package root before upload.
4. Verify that no SDK from another portal is present.
5. Run tests and the build audit for the exact artifact being submitted.
6. Keep version, platform and source commit traceable.
7. Do not overwrite historical submission artifacts.
8. Do not make the build pipeline submit to a portal automatically.
9. Revalidate each portal's current requirements before submission.

## Current Sproutbound situation

- The neutral platform adapter already protects the base runtime from external SDK calls.
- CrazyGames has a dedicated neutral build.
- GamePix now has a dedicated neutral build command and artifact.
- GameDistribution retains its SDK-specific entrypoint and package.
- `build:all` generates the three isolated packages from the same source tree.
- Local tests and audits are the technical state; portal upload, review, approval and player metrics remain separate states.
- Local browser smoke test passed: the first canvas input moved the game from ready to playing, the 360×640 viewport remained playable, and no runtime errors or warnings were reported.

## Final recommendation

Keep this architecture as the official Sproutbound release model and reuse it for future browser games. Add a new platform by creating a profile, adapter when required, build entrypoint, tests, metadata and portal checklist. Do not duplicate the core gameplay.
