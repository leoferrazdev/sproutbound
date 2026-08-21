# Copas frágeis e movimento de pouso Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar folhas escuras e rachadas que balançam, caem e desaparecem após o primeiro pouso do Pip.

**Architecture:** A geração determinística marcará folhas posteriores com `kind: 'cracked-leaf'`. A simulação manterá `collapsing`, `collapseTime` e `collapsed` dentro das plataformas, removerá plataformas ativadas da colisão e avançará a animação com delta time limitado. O renderer desenhará o estado normal, rachado ou em queda sem depender de DOM, relógio global ou rede.

**Tech Stack:** JavaScript ES modules, Canvas 2D, Node.js built-in `node:test`, scripts locais sem dependências de runtime.

## Global Constraints

- O build continuará offline, sem CDN, fontes externas, analytics ou requests HTTP.
- O download inicial permanecerá abaixo de 8 MB.
- A rodada inicial permanecerá segura e com as três primeiras plataformas não frágeis.
- A física e a animação usarão delta time limitado e comportamento determinístico.
- O primeiro pouso em uma folha frágil será válido; a folha não poderá aceitar um segundo pouso.
- Folhas normais, gotas de sol, altura, recorde e lifecycle de plataforma permanecerão funcionando.
- O release não conterá `console.log`, overlays de teste ou ferramentas de desenvolvimento.

---

### Task 1: Mark fragile platforms in the deterministic world

**Files:**
- Modify: `src/game/world.js`
- Test: `tests/world.test.js`

**Interfaces:**
- Consumes: `createWorld(seed, { width, height, platformCount })`.
- Produces: platform entities whose normal kind is `leaf` and whose later fragile kind is `cracked-leaf`.

- [x] **Step 1: Write the failing deterministic-world tests**

Add these assertions to the extended-world test:

```js
const leaves = world.filter((entity) => entity.type === 'platform');
const fragile = leaves.filter((platform) => platform.kind === 'cracked-leaf');

assert.ok(fragile.length > 0);
assert.equal(fragile.every((platform) => leaves.indexOf(platform) >= 6), true);
assert.deepEqual(
  createWorld(5, { ...viewport, platformCount: 30 }),
  createWorld(5, { ...viewport, platformCount: 30 }),
);
```

- [x] **Step 2: Run the focused test and verify RED**

Run `npm test -- tests/world.test.js`.

Expected result: the new fragile-platform assertion fails because every generated platform currently has `kind: 'leaf'`.

- [x] **Step 3: Implement the minimal deterministic classification**

Change the platform creation call in `src/game/world.js` to select a fragile kind only for extended-world indexes `index >= 6 && index % 4 === 2`:

```js
const kind = extendedWorld && index >= 6 && index % 4 === 2
  ? 'cracked-leaf'
  : 'leaf';
const platform = createPlatform({ x, y, width: platformWidth, kind });
```

- [x] **Step 4: Run the focused test and verify GREEN**

Run `npm test -- tests/world.test.js` and confirm all world tests pass.

- [x] **Step 5: Commit the world classification**

```powershell
git add src/game/world.js tests/world.test.js
git commit -m "feat: add deterministic cracked leaf platforms"
```

### Task 2: Make fragile platforms collapse after one landing

**Files:**
- Modify: `src/game/simulation.js`
- Test: `tests/simulation.test.js`

**Interfaces:**
- Consumes: platform entities with `kind: 'cracked-leaf'`.
- Produces: `collapsing`, `collapseTime`, `collapsed` platform state and `platformCollapsed` event when the animation expires.

- [x] **Step 1: Write the failing simulation tests**

Add these tests:

```js
test('cracked leaf bounces once and immediately loses collision', () => {
  const run = {
    state: 'playing', score: 0, bestScore: 0, startY: 206, cameraY: 0,
    player: { ...createPlayer({ x: 80, y: 80 }), grounded: false, vy: 220 },
    platforms: [{ x: 60, y: 120, width: 100, height: 18, kind: 'cracked-leaf' }],
    thorns: [], sunDrops: [],
  };

  const first = stepRun(run, {}, 0.2);
  const second = stepRun(first.run, {}, 0.01);

  assert.ok(first.events.includes('landed'));
  assert.ok(first.events.includes('platformTriggered'));
  assert.equal(first.run.platforms[0].collapsing, true);
  assert.equal(second.events.includes('landed'), false);
});

test('collapsing cracked leaf expires and is no longer rendered state', () => {
  const run = {
    state: 'playing', score: 0, bestScore: 0, startY: 206, cameraY: 0,
    player: { ...createPlayer({ x: 80, y: 80 }), grounded: false, vy: 220 },
    platforms: [{ x: 60, y: 120, width: 100, height: 18, kind: 'cracked-leaf' }],
    thorns: [], sunDrops: [],
  };

  const first = stepRun(run, {}, 0.2);
  const expired = stepRun(first.run, {}, 0.5);

  assert.ok(expired.events.includes('platformCollapsed'));
  assert.equal(expired.run.platforms[0].collapsed, true);
  assert.equal(expired.run.platforms[0].collapseTime, 0);
});
```

- [x] **Step 2: Run the focused test and verify RED**

Run `npm test -- tests/simulation.test.js`.

Expected result: the new tests fail because the current simulation never marks or advances a collapsing platform.

- [x] **Step 3: Implement the minimal platform state machine**

In `src/game/simulation.js`:

```js
const CRACKED_LEAF_COLLAPSE_SECONDS = 0.45;
const safeDt = Math.min(Math.max(dt, 0), 1 / 30);
```

Advance existing `collapsing` platforms before collision checks, skip `collapsing` and `collapsed` platforms in the landing search, and when a `cracked-leaf` is landed set:

```js
{ ...platform, collapsing: true, collapseTime: CRACKED_LEAF_COLLAPSE_SECONDS }
```

Emit `platformTriggered` at activation. When a platform reaches zero, set `collapsed: true`, retain `collapseTime: 0`, and emit `platformCollapsed` exactly once. Return the updated `platforms` array in `nextRun`.

- [x] **Step 4: Run focused and regression tests**

Run `npm test -- tests/simulation.test.js tests/world.test.js` and confirm all tests pass.

- [x] **Step 5: Commit the simulation behavior**

```powershell
git add src/game/simulation.js tests/simulation.test.js
git commit -m "feat: collapse cracked leaves after landing"
```

### Task 3: Render dark cracked leaves and the falling motion

**Files:**
- Modify: `src/render/canvas-renderer.js`
- Test: `tests/renderer.test.js`
- Modify: `docs/qa.md`

**Interfaces:**
- Consumes: platform `kind`, `collapsing`, `collapseTime`, and `collapsed` state from the simulation snapshot.
- Produces: dark leaf palette, visible crack strokes, vertical wobble/drop animation, and no drawing after collapse.

- [x] **Step 1: Write the failing renderer tests**

Extend the fake context with `globalAlpha` capture if needed and add a render test that passes a `cracked-leaf` platform with `collapsing: true`, `collapseTime: 0.2`. Assert that a crack line is drawn and that its rendering path is vertically displaced from the static platform path. Add a second snapshot with `collapsed: true` and assert that no leaf path is emitted.

- [x] **Step 2: Run the focused renderer test and verify RED**

Run `npm test -- tests/renderer.test.js`.

Expected result: the new assertions fail because the renderer currently treats every platform as a normal green leaf and always draws it.

- [x] **Step 3: Implement the renderer state styles and motion**

In `drawLeaf`, return early for `platform.collapsed`. For `cracked-leaf`, use a darker fill/stroke and draw two or three short diagonal crack segments. For a collapsing platform, compute progress as `1 - collapseTime / 0.45`, then apply a small sinusoidal vertical wobble plus a downward quadratic offset and reduced `globalAlpha`, restoring the context after drawing.

- [x] **Step 4: Run focused tests and update QA checklist**

Run `npm test -- tests/renderer.test.js tests/simulation.test.js tests/world.test.js`. Add manual QA rows for identifying cracked leaves, observing the wobble/drop, and confirming the platform cannot be reused.

- [x] **Step 5: Run the complete verification set**

```powershell
npm test
npm run check:build
git diff --check
git status --short
```

Expected: all tests pass, the audit remains below 8 MB, no diff errors exist, and only intentional files are modified.

- [x] **Step 6: Commit and publish the completed feature**

```powershell
git add src/render/canvas-renderer.js tests/renderer.test.js docs/qa.md
git commit -m "feat: animate and render collapsing canopies"
git push origin main
```
