# Copa móvel única por faixa e impacto de copa fixa Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer com que uma faixa móvel tenha somente uma copa móvel e adicionar uma reação visual curta quando Pip pousar em uma copa fixa.

**Architecture:** `world.js` gerará a faixa móvel usando a posição da rota principal e omitirá a copa fixa somente nesse caso; faixas rachadas continuarão pareadas com uma copa fixa. `simulation.js` manterá a colisão no plano lógico e transportará um `impactTime` decrescente nas copas fixas. `canvas-renderer.js` usará esse estado para desenhar uma descida e retorno sem duplicar a física.

**Tech Stack:** JavaScript ES modules, Node test runner, Canvas 2D, build audit local.

## Global Constraints

- O mundo lógico permanece 360×640 e determinístico por seed.
- Copas móveis continuam restritas à progressão após 30 m.
- Não adicionar dependências, requests externos, assets ou `console.log`.
- Não alterar o lifecycle de plataforma, storage, integração de portais ou regra de gotas.
- Toda alteração de comportamento deve ter teste escrito antes do código de produção.

---

### Task 1: Codificar o contrato de faixas no teste do mundo

**Files:**
- Modify: `tests/world.test.js`

**Interfaces:**
- Consumes: `createWorld(seed, options)` e entidades com `row`, `kind`, `y`.
- Produces: testes que definem a composição de faixas móveis e rachadas.

- [ ] **Step 1: Atualizar o teste para exigir faixa móvel única**

Substituir as asserções que exigem `leaf` em toda faixa tardia e `length >= 2` por:

```js
  const movingRows = lateRows.filter((row) => row.some((platform) => platform.kind === 'moving-leaf'));
  const crackedRows = lateRows.filter((row) => row.some((platform) => platform.kind === 'cracked-leaf'));

  assert.ok(movingRows.length > 0);
  assert.equal(movingRows.every((row) => row.length === 1), true);
  assert.equal(movingRows.every((row) => row[0].kind === 'moving-leaf'), true);
  assert.equal(crackedRows.every((row) => row.some((platform) => platform.kind === 'leaf')), true);
  assert.equal(crackedRows.every((row) => row.some((platform) => platform.kind === 'cracked-leaf')), true);
  assert.equal(lateRows.every((row) => row.length === 1 || row.length === 2), true);
```

Remover as duas asserções antigas que exigem copa fixa em toda faixa tardia.

- [ ] **Step 2: Rodar o teste para confirmar RED**

Run: `node --test tests/world.test.js`

Expected: FAIL porque o gerador atual coloca `leaf` e `moving-leaf` na mesma faixa.

### Task 2: Gerar faixas móveis com uma única copa

**Files:**
- Modify: `src/game/world.js`
- Test: `tests/world.test.js`

**Interfaces:**
- Consumes: posição segura calculada em `x`, `platformWidth` e parâmetros determinísticos existentes.
- Produces: faixas móveis com uma plataforma única cuja `baseX` é a posição segura da rota; faixas rachadas permanecem pareadas.

- [ ] **Step 1: Implementar a geração condicional mínima**

Calcular `specialKind`. Quando for `moving-leaf`, criar somente a plataforma móvel na posição `x` da rota. Para `cracked-leaf`, manter a plataforma primária e criar a alternativa lateral. Atribuir `previousX` e `previousWidth` ao suporte que representa a rota naquela faixa:

```js
    let routeWidth = platformWidth;

    if (extendedWorld && altitudeMeters >= 30) {
      const specialWidth = 70 + Math.floor(random() * 21);
      const specialKind = index % 2 === 0 ? 'cracked-leaf' : 'moving-leaf';

      if (specialKind === 'moving-leaf') {
        const movingLeaf = createPlatform({
          x,
          y,
          width: specialWidth,
          kind: specialKind,
        });
        entities.push({
          type: 'platform',
          row: index,
          ...movingLeaf,
          baseX: x,
          motionRange: 24 + Math.floor(random() * 12),
          motionPhase: random() * Math.PI * 2,
          motionSpeed: 1.1 + random() * 0.5,
        });
        routeWidth = specialWidth;
      } else {
        entities.push({ type: 'platform', row: index, ...platform });
        const specialX = x < width / 2
          ? clamp(x + platformWidth + 18, 0, width - specialWidth)
          : clamp(x - specialWidth - 18, 0, width - specialWidth);
        entities.push({
          type: 'platform',
          row: index,
          ...createPlatform({ x: specialX, y, width: specialWidth, kind: specialKind }),
        });
      }
    } else {
      entities.push({ type: 'platform', row: index, ...platform });
    }

    previousX = x;
    previousWidth = routeWidth;
```

Preservar o cálculo de gotas e espinhos usando a rota e manter o movimento determinístico.

- [ ] **Step 2: Rodar o teste do mundo em GREEN**

Run: `node --test tests/world.test.js`

Expected: PASS, incluindo faixa móvel única, faixa rachada pareada e igualdade entre seeds.

- [ ] **Step 3: Commitar o gerador e seu contrato**

```powershell
git add tests/world.test.js src/game/world.js
git commit -m "fix: keep moving canopy rows single"
```

### Task 3: Adicionar estado de impacto na simulação

**Files:**
- Modify: `tests/simulation.test.js`
- Modify: `src/game/simulation.js`

**Interfaces:**
- Consumes: aterrissagem existente em `stepRun` e `platform.kind === 'leaf'`.
- Produces: `FIXED_LEAF_IMPACT_SECONDS` e plataformas fixas com `impactTime` transitório, sem mudar `platform.y` ou o rebote.

- [ ] **Step 1: Escrever o teste falho para impacto físico-estatal**

Adicionar um caso com uma plataforma fixa sob o jogador e verificar que a aterrissagem produz impacto transitório, usando o helper de fixture já presente no arquivo:

```js
test('landing on a fixed leaf starts a visual impact without moving its collision plane', () => {
  const run = createBaseRun({
    player: { x: 120, y: 140, width: 26, height: 34, vy: 40, grounded: false, dead: false },
    platforms: [{ x: 100, y: 180, width: 80, height: 18, kind: 'leaf' }],
  });

  const result = stepRun(run, {}, 1 / 60);
  const platform = result.run.platforms[0];

  assert.ok(result.events.includes('landed'));
  assert.ok(result.events.includes('platformImpact'));
  assert.equal(platform.y, 180);
  assert.ok(platform.impactTime > 0);
  assert.equal(result.run.player.y, 146);
});
```

Ajustar apenas os valores necessários ao contrato real do helper.

- [ ] **Step 2: Rodar o teste para confirmar RED**

Run: `node --test tests/simulation.test.js`

Expected: FAIL porque `platformImpact` e `impactTime` ainda não existem.

- [ ] **Step 3: Implementar o estado transitório mínimo**

Exportar `FIXED_LEAF_IMPACT_SECONDS = 0.18`. Em `advancePlatforms`, reduzir `impactTime` com o mesmo `safeDt`, sem alterar entidades sem impacto. Na aterrissagem em `leaf`, mapear a plataforma para `impactTime: FIXED_LEAF_IMPACT_SECONDS` e emitir `platformImpact`. Não aplicar isso a `moving-leaf` nem `cracked-leaf`.

- [ ] **Step 4: Rodar os testes da simulação em GREEN**

Run: `node --test tests/simulation.test.js`

Expected: PASS, incluindo colapso rachado, movimento lateral, coleta e impacto fixo.

- [ ] **Step 5: Commitar a simulação**

```powershell
git add tests/simulation.test.js src/game/simulation.js
git commit -m "feat: signal fixed canopy landing impact"
```

### Task 4: Desenhar o impacto sem mover a colisão

**Files:**
- Modify: `tests/renderer.test.js`
- Modify: `src/render/canvas-renderer.js`

**Interfaces:**
- Consumes: `platform.impactTime` e o mesmo plano `platform.y` do renderer atual.
- Produces: descida visual curta de copa fixa, com retorno senoidal e preservação da geometria normal após expiração.

- [ ] **Step 1: Escrever o teste falho do deslocamento visual**

Adicionar uma plataforma `leaf` com `impactTime: 0.09`, renderizar com câmera zero e verificar que o topo está abaixo de `platform.y` durante o impacto:

```js
test('fixed leaf dips visually while Pip lands on it', () => {
  // Reutilizar o fixture de contexto de folha normal.
  renderer.render({
    cameraY: 0,
    platforms: [{ x: 100, y: 200, width: 80, height: 18, kind: 'leaf', impactTime: 0.09 }],
    thorns: [],
    sunDrops: [],
  });

  assert.ok(context.quadratics.some(({ endY }) => endY > 200));
});
```

- [ ] **Step 2: Rodar o teste para confirmar RED**

Run: `node --test tests/renderer.test.js`

Expected: FAIL porque uma copa fixa ainda ignora `impactTime`.

- [ ] **Step 3: Implementar o deslocamento visual mínimo**

Usar `FIXED_LEAF_IMPACT_SECONDS = 0.18` no renderer e calcular:

```js
  const impactProgress = platform.kind === 'leaf' && platform.impactTime > 0
    ? 1 - platform.impactTime / FIXED_LEAF_IMPACT_SECONDS
    : 0;
  const impactOffset = Math.sin(Math.max(0, Math.min(1, impactProgress)) * Math.PI) * 5;
  const y = platform.y - cameraY + wobble + drop + impactOffset;
```

Manter `platform.y` intacto e a geometria normal quando `impactTime` for zero ou ausente.

- [ ] **Step 4: Rodar os testes do renderer em GREEN**

Run: `node --test tests/renderer.test.js`

Expected: PASS, inclusive o teste que confirma o plano normal de uma copa sem impacto.

- [ ] **Step 5: Commitar o renderer**

```powershell
git add tests/renderer.test.js src/render/canvas-renderer.js
git commit -m "feat: animate fixed canopy landing impact"
```

### Task 5: Atualizar documentação e QA

**Files:**
- Modify: `README.md`
- Modify: `docs/qa.md`

**Interfaces:**
- Consumes: regras implementadas de composição de faixas e impacto.
- Produces: documentação operacional coerente com o comportamento real.

- [ ] **Step 1: Atualizar as regras do README**

Substituir a regra de “copa fixa segura ao lado da alternativa rachada ou móvel” por: faixas rachadas mantêm a copa fixa ao lado; faixas móveis têm somente uma copa móvel e a próxima rota usa essa copa. Registrar também o impacto visual curto das copas fixas.

- [ ] **Step 2: Atualizar a matriz de QA**

Alterar `Rota segura após 30 m` para distinguir faixa rachada e faixa móvel. Adicionar:

```markdown
| Impacto da copa fixa | Pousar em uma copa verde normal | A copa desce levemente e retorna sem alterar o rebote ou o plano de colisão. |
```

- [ ] **Step 3: Conferir a documentação por busca**

Run: `rg -n "cada faixa.*fixa|alternativa rachada ou móvel|faixa móvel|impacto|copa fixa" README.md docs/qa.md docs/superpowers/specs/2026-08-21-single-moving-canopy-impact-design.md`

Expected: nenhuma regra operacional afirma que toda faixa móvel contém também uma copa fixa.

- [ ] **Step 4: Commitar a documentação**

```powershell
git add README.md docs/qa.md
git commit -m "docs: describe single moving canopy rows"
```

### Task 6: Verificação integral e entrega

**Files:**
- Modify: `docs/superpowers/plans/2026-08-21-single-moving-canopy-impact-implementation.md`

**Interfaces:**
- Consumes: todos os commits e testes das tarefas anteriores.
- Produces: plano marcado, build auditado, diff limpo e `main` sincronizado com `origin/main`.

- [ ] **Step 1: Rodar a suíte completa**

Run: `npm test`

Expected: todos os testes passam sem falhas.

- [ ] **Step 2: Rodar a auditoria de build**

Run: `npm run check:build`

Expected: auditoria aprovada, sem URLs externas, sem `console.log` e abaixo de 8 MB.

- [ ] **Step 3: Conferir whitespace, status e histórico**

Run:

```powershell
git diff --check
git status --short --branch
git log -5 --oneline
```

Expected: sem erro de whitespace; histórico contém os commits da feature.

- [ ] **Step 4: Marcar este plano como concluído e commitar**

Marcar todas as caixas como `[x]`, depois:

```powershell
git add docs/superpowers/plans/2026-08-21-single-moving-canopy-impact-implementation.md
git commit -m "docs: complete canopy impact implementation plan"
```

- [ ] **Step 5: Fazer push e verificar a referência remota**

Run:

```powershell
git push origin main
git rev-parse HEAD
git rev-parse origin/main
git status --short --branch
```

Expected: push concluído; os dois hashes são iguais; status mostra `main...origin/main` sem alterações locais.
