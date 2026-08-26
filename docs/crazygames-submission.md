# CrazyGames submission checklist

> [!DANGER] SUBMISSOES BLOQUEADAS — 2026-08-26
> Segunda recusa consecutiva na CrazyGames com a mesma frase. Decisao registrada:
> **reformular partes estruturais antes de qualquer novo envio, a qualquer portal.**
>
> O bloqueio e mecanico: `npm run gate` precisa sair com codigo 0. Hoje sai 1, com
> 8 de 10 itens em aberto. Nenhum item pode ser marcado por opiniao.
>
> Diagnostico completo no cofre: `Diagnostico da segunda recusa CrazyGames - Sproutbound`.


## Local package

- [x] HTML5 build with relative local paths.
- [x] English-first game UI with Portuguese fallback for `pt-*` browsers.
- [x] Mouse, keyboard, and touch input.
- [x] Portrait-first layout that remains playable inside desktop landscape viewports.
- [x] No runtime CDN, analytics, external font, or network request.
- [x] Build below the local 8 MB ceiling and below CrazyGames Basic Launch limits.
- [x] 69 automated tests passing for release `0.2.0-quality`.
- [x] Quality upload package prepared at `submission/sproutbound-quality-0.2.0.zip`.
- [x] CrazyGames-specific folder generated at `submission/sproutbound-quality-0.2.0-crazygames-build/`.
- [x] CrazyGames package excludes `GD_OPTIONS`, the GameDistribution SDK, and `main-gamedistribution.js`.
- [x] Build manifest records platform, version, source commit and package files.

## Basic Launch

Bloqueado ate `npm run gate` sair com codigo 0.

- [ ] Run the CrazyGames Preview Tool with the final `submission/sproutbound-quality-0.2.0-crazygames-build/` folder.
- [ ] Confirm Chrome and Edge playability, first-input onboarding, restart flow, and mobile layout.
- [ ] Fill English metadata and controls in the Developer Portal.
- [ ] Upload landscape, portrait, and square covers from `media/covers/`.
- [x] Replace preview-video drafts with actual silent gameplay recordings.
- [ ] Submit only after the Preview Tool reports no blocking issue.

The complete build matrix is documented in [`docs/platform-builds.md`](platform-builds.md). Use `npm run build:crazygames` for the CrazyGames artifact; `npm run build:all` is for generating all artifacts locally and does not submit them.

## Full Launch later

- [ ] Replace `src/platform-adapter.js` with the real CrazyGames SDK adapter.
- [ ] Wire the real `Gameplay start` and `Gameplay stop` events.
- [ ] Integrate ads only after Full Launch eligibility; Basic Launch monetization is disabled.
- [ ] Add CrazyGames account/data modules only if progression or account integration requires them.
