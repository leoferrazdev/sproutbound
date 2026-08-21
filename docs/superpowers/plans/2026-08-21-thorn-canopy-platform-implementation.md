# Plataforma copa com espinhos Implementation Plan

> For agentic workers: use executing-plans to implement this plan task-by-task. Steps use checkbox syntax.

Goal: Substituir os obstáculos triangulares por plataformas thorn-leaf que compartilham a faixa com uma copa segura e eliminam Pip ao contato.

Architecture: world.js deixará de emitir entidades thorn e criará faixas dedicadas com uma leaf fixa e uma thorn-leaf lateral após 30 m. simulation.js tratará thorn-leaf como hazard de colisão contínua antes da resolução de pouso. canvas-renderer.js desenhará a mesma copa orgânica com cor escura e espinhos integrados, sem triângulo independente.

Tech Stack: JavaScript ES modules, Node test runner, Canvas 2D e auditoria de build local.

## Global Constraints

- A regra de perigo começa somente após 30 m.
- Faixas com moving-leaf continuam com uma única copa móvel.
- Faixas com thorn-leaf terão uma leaf fixa segura e uma alternativa perigosa.
- Não adicionar dependências, requests externos, assets ou console.log.
- Não alterar storage, lifecycle, gotas de sol, impacto de copa fixa ou colapso de copas rachadas.
- Toda alteração de comportamento terá teste escrito antes do código de produção.

---

### Task 1: Composição determinística das faixas perigosas

Files:
- Modify: tests/world.test.js
- Modify: src/game/world.js

Interfaces:
- Consumes: createWorld(seed, { width, height, platformCount }).
- Produces: platforms com row, kind thorn-leaf e nenhuma entidade type thorn.

- [x] Step 1: Escrever o teste RED.

Adicionar ao teste do mundo:

    const hazards = platforms.filter((platform) => platform.kind === 'thorn-leaf');
    const hazardRows = [...rows.values()].filter((row) => (
      row.some((platform) => platform.kind === 'thorn-leaf')
    ));

    assert.ok(hazards.length > 0);
    assert.equal(world.some((entity) => entity.type === 'thorn'), false);
    assert.equal(hazards.every((platform) => platform.y < 216), true);
    assert.equal(hazardRows.every((row) => row.some((platform) => platform.kind === 'leaf')), true);
    assert.equal(hazardRows.every((row) => row.some((platform) => platform.kind === 'thorn-leaf')), true);
    assert.equal(
      lateRows.every((row) => !row.some((platform) => platform.kind === 'moving-leaf')
        || !row.some((platform) => platform.kind === 'thorn-leaf')),
      true,
    );

Manter os testes de determinismo, rota inicial, faixas móveis únicas e faixas rachadas pareadas.

- [x] Step 2: Confirmar RED.

Run: node --test tests/world.test.js
Expected: FAIL porque ainda existem entidades thorn e não existe thorn-leaf.

- [x] Step 3: Implementar a faixa dedicada.

Em world.js usar:

    const hazardRow = extendedWorld && altitudeMeters >= 30
      && index >= 8 && index % 6 === 4;

Quando hazardRow for verdadeiro, emitir a leaf primária, calcular uma largura entre 70 e 90, criar a alternativa lateral com kind thorn-leaf e manter previousX/previousWidth na copa segura. Não criar cracked-leaf ou moving-leaf nessa faixa. Remover o bloco que adiciona entidades type thorn.

Quando hazardRow for falso, preservar as regras atuais de cracked-leaf e moving-leaf.

- [x] Step 4: Confirmar GREEN.

Run: node --test tests/world.test.js
Expected: PASS com faixas perigosas pareadas e sem entidades thorn.

- [x] Step 5: Commitar.

    git add tests/world.test.js src/game/world.js
    git commit -m "feat: generate thorn canopy platforms"

### Task 2: Colisão da copa perigosa

Files:
- Modify: tests/simulation.test.js
- Modify: src/game/simulation.js

Interfaces:
- Consumes: platforms atualizadas e rectsOverlap(player, platform).
- Produces: eventos hazardHit e playerDied sem landed ou rebote para thorn-leaf.

- [x] Step 1: Escrever o teste RED.

Adicionar:

    test('thorn canopy ends the run without bouncing Pip', () => {
      const run = {
        state: 'playing',
        score: 0,
        bestScore: 0,
        startY: 206,
        cameraY: 0,
        player: { ...createPlayer({ x: 80, y: 80 }), grounded: false, vy: 220 },
        platforms: [{ x: 60, y: 120, width: 100, height: 18, kind: 'thorn-leaf' }],
        thorns: [],
        sunDrops: [],
      };

      const result = stepRun(run, {}, 0.2);

      assert.ok(result.events.includes('hazardHit'));
      assert.ok(result.events.includes('playerDied'));
      assert.equal(result.events.includes('landed'), false);
      assert.equal(result.run.player.dead, true);
      assert.equal(result.run.player.vy < 0, false);
    });

- [x] Step 2: Confirmar RED.

Run: node --test tests/simulation.test.js
Expected: FAIL porque thorn-leaf ainda não é hazard.

- [x] Step 3: Implementar detecção antes do pouso.

Após stepPlayer, calcular hitHazardPlatform com platforms.some e rectsOverlap para kind thorn-leaf. Emitir hazardHit quando verdadeiro, executar busca de pouso somente quando falso e incluir hitHazardPlatform na expressão died. Manter a checagem legada de run.thorns sem gerar novas entidades desse tipo.

- [x] Step 4: Confirmar GREEN.

Run: node --test tests/simulation.test.js
Expected: PASS sem regressões.

- [x] Step 5: Commitar.

    git add tests/simulation.test.js src/game/simulation.js
    git commit -m "feat: eliminate Pip on thorn canopy contact"

### Task 3: Renderer da copa com espinhos

Files:
- Modify: tests/renderer.test.js
- Modify: src/render/canvas-renderer.js

Interfaces:
- Consumes: platform.kind thorn-leaf.
- Produces: copa escura com três espinhos integrados, sem drawThorn.

- [x] Step 1: Escrever o teste RED.

Adicionar um snapshot thorn-leaf e verificar que a cor escura #536b57 aparece e que o fake context registra ao menos seis linhas.

- [x] Step 2: Confirmar RED.

Run: node --test tests/renderer.test.js
Expected: FAIL porque thorn-leaf ainda usa a copa normal e não desenha espinhos.

- [x] Step 3: Implementar o desenho.

Em drawLeaf, adicionar isThornLeaf. Usar fill #536b57 e stroke #d2e58b. Depois da copa, desenhar três triângulos de espinhos com moveTo/lineTo dentro de um único beginPath. Remover drawThorn e o loop snapshot.thorns. Manter platform.y e os estados de impacto, colapso e movimento.

- [x] Step 4: Confirmar GREEN.

Run: node --test tests/renderer.test.js
Expected: PASS incluindo copas normais, rachadas, móveis, impacto fixo e thorn-leaf.

- [x] Step 5: Commitar.

    git add tests/renderer.test.js src/render/canvas-renderer.js
    git commit -m "feat: render thorn canopy hazard"

### Task 4: Documentação e QA

Files:
- Modify: README.md
- Modify: docs/qa.md

Interfaces:
- Consumes: regras finais de geração, colisão e renderização.
- Produces: documentação sem referência ao triângulo como entidade independente.

- [x] Step 1: Atualizar README.

Registrar que após 30 m algumas faixas têm uma copa escura com espinhos ao lado de uma copa segura e que qualquer toque encerra a tentativa.

- [x] Step 2: Atualizar QA.

Adicionar:

    | Copa com espinhos | Alcançar uma faixa perigosa após 30 m | A faixa contém uma copa segura e uma copa escura com espinhos; tocar a copa perigosa encerra a rodada. |
    | Rota móvel preservada | Alcançar uma faixa móvel | A faixa móvel continua contendo somente uma copa móvel, sem copa perigosa adicional. |

- [x] Step 3: Confirmar referências.

Run: rg -n "triângulo|triangular|type.*thorn|copa com espinhos|thorn-leaf|copa perigosa" README.md docs/qa.md docs/superpowers/specs/2026-08-21-thorn-canopy-platform-design.md
Expected: regra operacional usa thorn-leaf; triângulo não aparece como obstáculo atual.

- [x] Step 4: Commitar.

    git add README.md docs/qa.md
    git commit -m "docs: document thorn canopy hazard"

### Task 5: Verificação e publicação

Files:
- Modify: docs/superpowers/plans/2026-08-21-thorn-canopy-platform-implementation.md

Interfaces:
- Consumes: commits de mundo, simulação, renderer e documentação.
- Produces: plano concluído, testes verdes, build auditado e main sincronizado.

- [x] Step 1: Rodar npm test.
Expected: todos os testes passam.

- [x] Step 2: Rodar npm run check:build.
Expected: sem URLs externas, sem console.log e abaixo de 8 MB.

- [x] Step 3: Rodar git diff --check e conferir status.
Expected: sem whitespace inválido; somente o plano fica modificado antes do commit final.

- [x] Step 4: Marcar as tarefas como [x] e commitar.

    git add docs/superpowers/plans/2026-08-21-thorn-canopy-platform-implementation.md
    git commit -m "docs: complete thorn canopy implementation plan"

- [x] Step 5: Publicar e verificar.

    git push origin main
    git rev-parse HEAD
    git rev-parse origin/main
    git status --short --branch

Expected: hashes iguais e status main...origin/main sem alterações.
