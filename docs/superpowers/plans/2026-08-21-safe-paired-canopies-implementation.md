# Rotas seguras e entidades móveis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Garantir uma copa fixa por faixa após 30 m e adicionar movimento lateral determinístico às copas especiais e às gotas de sol.

**Architecture:** `world.js` continuará gerando a rota vertical, mas após 30 m cada faixa terá uma plataforma `leaf` fixa e uma alternativa `cracked-leaf` ou `moving-leaf`. `simulation.js` atualizará a posição de entidades móveis antes da colisão e coleta, preservando os estados de colapso já existentes. O renderer consumirá apenas as posições do snapshot, com uma distinção visual discreta para copas móveis.

**Tech Stack:** JavaScript ES modules, Canvas 2D, Node.js built-in `node:test`, sem dependências de runtime.

## Global Constraints

- Até 30 m não haverá copas rachadas nem copas móveis.
- Após 30 m, toda faixa com alternativa especial manterá uma copa `leaf` fixa e segura.
- O mesmo seed produzirá os mesmos pares, tipos e parâmetros de movimento.
- Copas e gotas móveis permanecerão dentro dos limites do palco lógico de 360 px.
- A primeira plataforma e os três primeiros saltos permanecerão inalterados.
- Gotas iniciais serão estáveis; somente gotas posteriores a 30 m se moverão lateralmente.
- O build continuará offline, abaixo de 8 MB e sem `console.log`, CDN ou request externo.

---

### Task 1: Generate safe paired rows after 30 m

**Files:**
- Modify: `src/game/world.js`
- Test: `tests/world.test.js`

**Interfaces:**
- Consumes: `createWorld(seed, { width, height, platformCount })`.
- Produces: row-tagged platform entities with a fixed `leaf` and, after 30 m, one deterministic `cracked-leaf` or `moving-leaf` alternative.

- [ ] **Step 1: Write the failing world tests**

Extend the extended-world test with:

```js
const rows = new Map();
for (const platform of platforms) {
  const row = rows.get(platform.row) ?? [];
  row.push(platform);
  rows.set(platform.row, row);
}

const earlyRows = [...rows.values()].filter((row) => row[0].y >= 216);
const lateRows = [...rows.values()].filter((row) => row[0].y < 216);

assert.ok(earlyRows.every((row) => row.every((platform) => platform.kind === 'leaf')));
assert.ok(lateRows.some((row) => row.some((platform) => platform.kind !== 'leaf')));
assert.ok(lateRows.every((row) => row.some((platform) => platform.kind === 'leaf')));
assert.ok(lateRows.every((row) => row.length >= 2));
```

- [ ] **Step 2: Run the focused world test and verify RED**

Run `npm test -- tests/world.test.js`.

Expected result: the new assertions fail because the world currently has one platform per row and no `row` metadata.

- [ ] **Step 3: Implement deterministic paired-row generation**

In `src/game/world.js`, calculate `altitudeMeters` from `(firstY - y) / 12`, add `row: index` to the primary platform, and after `altitudeMeters >= 30` create one second platform at the same `y`. Keep the primary platform `kind: 'leaf'`. Alternate or deterministically choose the second kind between `cracked-leaf` and `moving-leaf`; assign movement metadata only to `moving-leaf`:

```js
{
  type: 'platform', row: index, x, y, width, height: 18,
  kind: 'moving-leaf', baseX: x, motionRange, motionPhase, motionSpeed,
}
```

Place the alternative within the logical width and within the current horizontal jump envelope. Keep `previousX` tied to the fixed primary platform so the existing safe route remains unchanged.

- [ ] **Step 4: Run focused world tests and regression tests**

Run `npm test -- tests/world.test.js tests/model.test.js tests/simulation.test.js` and confirm the initial route and opening jump remain green.

- [ ] **Step 5: Commit the paired-row generation**

```powershell
git add src/game/world.js tests/world.test.js
git commit -m "feat: guarantee safe paired canopy rows"
```

### Task 2: Move platforms and sun drops in the simulation

**Files:**
- Modify: `src/game/simulation.js`
- Test: `tests/simulation.test.js`

**Interfaces:**
- Consumes: `baseX`, `motionRange`, `motionPhase`, `motionSpeed` on `moving-leaf` platforms and moving sun entities.
- Produces: updated `x` positions before landing and collection checks, with bounded deterministic motion.

- [ ] **Step 1: Write the failing simulation tests**

Add tests for a moving platform and a moving sun:

```js
test('moving canopy advances inside the logical stage before collision', () => {
  const run = {
    state: 'playing', score: 0, bestScore: 0, startY: 206, cameraY: 0,
    player: { ...createPlayer({ x: 80, y: 80 }), grounded: false, vy: 220 },
    platforms: [{
      x: 80, y: 120, width: 90, height: 18, kind: 'moving-leaf', row: 6,
      baseX: 80, motionRange: 40, motionPhase: 0, motionSpeed: 2,
    }],
    thorns: [], sunDrops: [],
  };

  const result = stepRun(run, {}, 1 / 30);

  assert.notEqual(result.run.platforms[0].x, 80);
  assert.ok(result.run.platforms[0].x >= 0);
  assert.ok(result.run.platforms[0].x + result.run.platforms[0].width <= 360);
});

test('moving sun drop updates before collection is resolved', () => {
  const run = {
    state: 'playing', score: 40, bestScore: 40, startY: 542, cameraY: 0,
    player: { ...createPlayer({ x: 101, y: 300 }), grounded: false, vy: 0 },
    platforms: [], thorns: [],
    sunDrops: [{ type: 'sun', x: 100, y: 318, radius: 8, kind: 'sun',
      baseX: 100, motionRange: 20, motionPhase: 0, motionSpeed: 2 }],
  };

  const result = stepRun(run, {}, 1 / 30);

  assert.equal(result.run.sunDrops.length, 0);
  assert.equal(result.run.sunCount, 1);
});
```

- [ ] **Step 2: Run the focused simulation test and verify RED**

Run `npm test -- tests/simulation.test.js`.

Expected result: the new motion assertions fail because the simulation currently never advances `x` or phase for moving entities.

- [ ] **Step 3: Implement bounded sinusoidal motion**

Add an `advanceMovingEntity` helper that increments `motionPhase` by `motionSpeed * safeDt`, computes `baseX + Math.sin(motionPhase) * motionRange`, and clamps the result to the logical stage. Apply it to moving platforms and sun drops before collision/collection. Preserve cracked-leaf collapse updates and existing event behavior.

- [ ] **Step 4: Run focused and regression tests**

Run `npm test -- tests/simulation.test.js tests/world.test.js tests/renderer.test.js` and confirm existing collapse, collection and renderer tests remain green.

- [ ] **Step 5: Commit the simulation motion**

```powershell
git add src/game/simulation.js tests/simulation.test.js
git commit -m "feat: move canopies and sun drops deterministically"
```

### Task 3: Communicate moving platforms and complete QA

**Files:**
- Modify: `src/render/canvas-renderer.js`
- Test: `tests/renderer.test.js`
- Modify: `README.md`
- Modify: `docs/qa.md`

**Interfaces:**
- Consumes: the current `x` values and `kind: 'moving-leaf'` from the simulation snapshot.
- Produces: subtle visual distinction for moving leaves and documented manual acceptance checks.

- [ ] **Step 1: Write the failing renderer test**

Add a test rendering a `moving-leaf` and assert that its fill/stroke palette differs from a normal `leaf` while retaining the same top-plane geometry.

- [ ] **Step 2: Run the focused renderer test and verify RED**

Run `npm test -- tests/renderer.test.js`.

Expected result: the moving leaf currently uses the normal green palette.

- [ ] **Step 3: Implement the minimal moving-leaf visual cue**

Use a slightly cooler green fill/stroke for `moving-leaf`; keep its geometry driven by the snapshot `x`, with no independent renderer-side motion.

- [ ] **Step 4: Update README and QA**

Document the 30 m threshold, the fixed safe alternative, moving canopies and moving sun drops. Add manual checks for portrait play, choosing the fixed alternative after a cracked canopy collapses, watching a moving canopy stay within the stage and collecting a moving sun drop.

- [ ] **Step 5: Run the complete verification set**

```powershell
npm test
npm run check:build
git diff --check
git status --short
```

Expected: all tests pass, build remains below 8 MB, and only intentional files are modified.

- [ ] **Step 6: Commit and publish**

```powershell
git add src/render/canvas-renderer.js tests/renderer.test.js README.md docs/qa.md
git commit -m "feat: add moving canopy visual feedback"
git push origin main
```

