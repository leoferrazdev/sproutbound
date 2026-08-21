# Meta explícita de cume Implementation Plan

> For agentic workers: use executing-plans to implement this plan task-by-task. Steps use checkbox syntax.

Goal: Transformar o teto observado de 249 m em uma meta explícita de cume com estado terminal, recompensa persistente e restart seguro.

Architecture: model.js derivará summitHeight da última plataforma. simulation.js emitirá summitReached uma única vez e congelará a rodada no estado summit. progression.js, screens.js e main.js registrarão a recompensa, mostrarão a conclusão e pararão o lifecycle sem alterar o fluxo Game Over.

Tech Stack: JavaScript ES modules, Node test runner, Canvas 2D, storage seguro e auditoria local.

## Global Constraints

- Não aumentar a quantidade de plataformas nesta etapa.
- Não alterar a física de salto, a dificuldade, os hazards, as copas especiais ou o limite observado.
- O primeiro input continua sendo o único disparador de gameplayStart.
- O cume e o Game Over continuam disparando gameplayStop de modo idempotente.
- A recompensa usa o adaptador existente de localStorage com try/catch.
- Não adicionar requests externos, dependências, assets ou console.log.

---

### Task 1: Recompensa e altura derivada da rota

Files:
- Modify: src/game/progression.js
- Modify: src/game/model.js
- Modify: tests/progression.test.js
- Modify: tests/model.test.js

Interfaces:
- Consumes: MILESTONES existentes e a lista final de platforms.
- Produces: marco summit-crown, summitHeight na rodada e validação pelo storage existente.

- [ ] Step 1: Escrever testes RED.

Em progression.test.js, verificar que getMilestone(60) retorna summit-crown e que applyProgression com altura summit desbloqueia summit-crown. Em model.test.js, verificar que createRun expõe summitHeight maior que 200 e que ela é derivada da última plataforma:

    const run = createRun();
    const lastPlatform = run.platforms.at(-1);
    const expected = Math.floor((run.startY - lastPlatform.y) / 12) + 1;
    assert.equal(run.summitHeight, expected);

- [ ] Step 2: Confirmar RED.

Run: node --test tests/progression.test.js tests/model.test.js
Expected: FAIL porque summit-crown e summitHeight ainda não existem.

- [ ] Step 3: Implementar o marco e a derivação.

Adicionar ao final da lista MILESTONES:

    { id: 'summit-crown', height: 240, label: 'Coroa do cume', accent: '#b9f46b' }

Em createRun, calcular summitHeight depois de startY e platforms:

    const lastPlatform = platforms.at(-1);
    const summitHeight = Math.floor((startY - lastPlatform.y) / 12) + 1;

Incluir summitHeight no objeto retornado. Não duplicar o id nem criar um segundo sistema de storage.

- [ ] Step 4: Confirmar GREEN.

Run: node --test tests/progression.test.js tests/model.test.js
Expected: PASS, incluindo validação dos ids persistíveis e do próximo marco em 60 m.

- [ ] Step 5: Commitar.

    git add src/game/progression.js src/game/model.js tests/progression.test.js tests/model.test.js
    git commit -m "feat: define summit reward and height"

### Task 2: Estado summit na simulação

Files:
- Modify: src/game/simulation.js
- Modify: tests/simulation.test.js

Interfaces:
- Consumes: run.summitHeight, score calculado e state atual.
- Produces: evento summitReached, state summit, summitReached boolean e congelamento idempotente.

- [ ] Step 1: Escrever teste RED de chegada.

Adicionar um fixture com summitHeight 10 e uma posição do jogador que ultrapasse a altura:

    test('reaching the summit ends the climb without a death', () => {
      const run = {
        state: 'playing',
        score: 9,
        bestScore: 9,
        startY: 206,
        summitHeight: 10,
        summitReached: false,
        cameraY: 0,
        player: { ...createPlayer({ x: 80, y: 80 }), grounded: false, vy: 0 },
        platforms: [],
        thorns: [],
        sunDrops: [],
      };

      const result = stepRun(run, {}, 0);
      assert.ok(result.events.includes('summitReached'));
      assert.equal(result.events.includes('playerDied'), false);
      assert.equal(result.run.state, 'summit');
      assert.equal(result.run.summitReached, true);
    });

Adicionar um segundo passo sobre o mesmo run e verificar events vazio e igualdade de state/score/player.

- [ ] Step 2: Confirmar RED.

Run: node --test tests/simulation.test.js
Expected: FAIL porque o estado summit não é detectado nem congelado.

- [ ] Step 3: Implementar a transição.

No início de stepRun, retornar o run sem eventos quando state for summit. Depois de medir score e processar milestone, calcular:

    const reachedSummit = !run.summitReached
      && Number.isFinite(run.summitHeight)
      && score >= run.summitHeight;

Se true, emitir summitReached. No nextRun, definir summitReached como run.summitReached || reachedSummit e escolher state summit quando reachedSummit, desde que died seja falso. O evento deve ser emitido no máximo uma vez e não deve emitir playerDied.

- [ ] Step 4: Confirmar GREEN.

Run: node --test tests/simulation.test.js
Expected: PASS, incluindo morte por queda, morte por thorn-leaf, pousos, coleta e congelamento de summit.

- [ ] Step 5: Commitar.

    git add src/game/simulation.js tests/simulation.test.js
    git commit -m "feat: add explicit summit state"

### Task 3: Tela de cume e lifecycle

Files:
- Modify: index.html
- Modify: src/ui/screens.js
- Modify: src/ui/hud.js
- Modify: src/main.js
- Modify: tests/ui.test.js

Interfaces:
- Consumes: run.state summit, event summitReached e reward summit-crown.
- Produces: cartão acessível com Cume alcançado, recompensa, restart e stopGameplay.

- [ ] Step 1: Escrever testes RED de contrato da UI.

Em ui.test.js, exigir os ids ending-eyebrow, ending-title e ending-message e os textos Cume alcançado e Coroa do cume. Manter as asserções existentes de restart.

- [ ] Step 2: Confirmar RED.

Run: node --test tests/ui.test.js
Expected: FAIL porque os ids e textos ainda não existem.

- [ ] Step 3: Implementar o cartão final reutilizável.

No game-over-screen, adicionar:

    <p id="ending-eyebrow" class="eyebrow">FIM DA SUBIDA</p>
    <h1 id="ending-title">Pip precisa de mais uma tentativa.</h1>
    <p id="ending-message">...</p>

Remover o eyebrow/h1 duplicado antigo. Em screens.js, criar showSummit(run) que altera ending-eyebrow para CUME ALCANÇADO, ending-title para Cume alcançado!, ending-message para informar Coroa do cume desbloqueada e mantém altura/recorde e botão. showGameOver deve restaurar o texto normal. Retornar showSummit.

Em hud.js, anunciar Cume alcançado quando run.state for summit.

Em main.js, no ui.update, tratar summitReached antes de playerDied: chamar stopGameplay, mostrar a recompensa via screens.showSummit e manter o save acionado pelo milestoneReached. O callback onRestart continuará chamando commercial break mock, criando nova rodada e mostrando Ready.

- [ ] Step 4: Confirmar GREEN.

Run: node --test tests/ui.test.js
Expected: PASS com contrato de UI preservado.

- [ ] Step 5: Commitar.

    git add index.html src/ui/screens.js src/ui/hud.js src/main.js tests/ui.test.js
    git commit -m "feat: show summit completion screen"

### Task 4: Documentação e QA

Files:
- Modify: README.md
- Modify: docs/qa.md

Interfaces:
- Consumes: estado summit, recompensa e texto da UI.
- Produces: instruções de playtest para meta de cume e retorno.

- [ ] Step 1: Atualizar README.

Registrar que o teto atual é uma meta de cume, que ela desbloqueia Coroa do cume e que o restart continua explícito.

- [ ] Step 2: Atualizar QA.

Adicionar:

    | Cume | Alcançar a altura máxima da rota | A partida congela em Cume alcançado, mostra a recompensa Coroa do cume e para o gameplay uma vez. |
    | Summit persistente | Alcançar o cume e recarregar a rodada | A recompensa permanece desbloqueada quando o storage está disponível; falha de storage não congela o jogo. |

- [ ] Step 3: Commitar.

    git add README.md docs/qa.md
    git commit -m "docs: document summit goal and reward"

### Task 5: Verificação e publicação

Files:
- Modify: docs/superpowers/plans/2026-08-21-summit-goal-implementation.md

Interfaces:
- Consumes: todos os commits anteriores.
- Produces: plano concluído, testes verdes, build auditado e main sincronizado.

- [ ] Step 1: Rodar npm test.
Expected: todos os testes passam.

- [ ] Step 2: Rodar npm run check:build.
Expected: sem URLs externas, sem console.log e abaixo de 8 MB.

- [ ] Step 3: Rodar git diff --check e verificar status.
Expected: somente o plano fica modificado antes do commit final.

- [ ] Step 4: Marcar as tarefas como [x] e commitar.

    git add docs/superpowers/plans/2026-08-21-summit-goal-implementation.md
    git commit -m "docs: complete summit goal implementation plan"

- [ ] Step 5: Publicar e verificar.

    git push origin main
    git rev-parse HEAD
    git rev-parse origin/main
    git status --short --branch

Expected: hashes iguais e status main...origin/main limpo.

