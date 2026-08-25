# Sproutbound Quality Resubmission Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produzir uma versão `0.2.0-quality` do Sproutbound com melhoria real de core loop, progressão, onboarding, risco, feedback e retenção antes de uma nova submissão à CrazyGames.

**Architecture:** Preservar o build-base Vanilla JavaScript + Canvas 2D, sem Three.js e sem dependências externas. Separar as regras de jogo, apresentação, input, feedback, plataforma e submissão; manter o adaptador neutro no build-base e tratar CrazyGames somente no perfil de publicação.

**Tech Stack:** JavaScript ES Modules, HTML5 Canvas 2D, CSS local, Node.js test runner, armazenamento local protegido por `try/catch`, adaptadores de plataforma e assets locais.

## Global Constraints

- O objetivo é uma nova versão de qualidade, não uma camada cosmética sobre o mesmo loop.
- Não adicionar CDN, analytics, fontes externas, requests HTTP ou SDK de portal ao build-base.
- Preservar a meta interna de download inicial abaixo de 8 MB.
- Manter inglês como idioma principal e português como fallback para `pt-*`.
- Manter armazenamento local tolerante a modo anônimo, bloqueio e dados inválidos.
- Corrigir o foco do canvas e validar teclado, toque e mouse no navegador real.
- Não usar Three.js para esta evolução; o Sproutbound continua sendo um jogo Canvas 2D.
- Manter a separação `base-game`, `engine-layer`, `platform-adapter` e `submission-profile`.
- Não apagar nem versionar os artefatos de submissão não rastreados já existentes em `submission/`.
- Não reenviar a versão atual ou um build visualmente equivalente.
- Só submeter depois de Preview Tool, desktop, mobile, mídia real e checklist do portal aprovados.

---

## Resultado de produto esperado

Ao final da versão, o jogador deve perceber, em uma sessão curta:

1. como conduzir Pip;
2. por que pousar em cada copa;
3. por que buscar uma gota de luz solar;
4. qual risco está escolhendo;
5. o que mudou depois de atingir um marco;
6. qual objetivo vem a seguir;
7. por que vale iniciar outra tentativa.

O núcleo da versão será:

> **Pip coleta luz solar para carregar uma proteção, escolhe rotas de copas com riscos diferentes, evolui visualmente em marcos de altura e tenta alcançar o cume de 249 m.**

Isso altera o significado da coleta, a leitura da rota, a progressão e o motivo de retorno sem transformar o jogo em um sistema excessivamente complexo.

## Inventário de arquivos e responsabilidades

| Área | Arquivos | Responsabilidade na versão |
| --- | --- | --- |
| Simulação | `src/game/model.js`, `src/game/world.js`, `src/game/simulation.js`, `src/game/player.js` | Estado da corrida, rota, risco, proteção, coleta e dificuldade |
| Progressão | `src/game/progression.js`, `src/storage.js` | Marcos persistentes, evolução visual e recompensa |
| Input | `src/input.js`, `index.html` | Foco, teclado QWERTY/AZERTY, toque e primeiro input |
| Feedback | `src/render/canvas-renderer.js`, novo `src/feedback.js`, novo `src/audio.js` | Impacto, coleta, perigo, milestone, derrota e cume |
| UI | `src/ui/hud.js`, `src/ui/screens.js`, `src/i18n.js`, `styles.css`, `index.html` | Onboarding, objetivo, carga solar, recompensa e restart |
| App/lifecycle | `src/app.js`, `src/game/game-loop.js` | Orquestração de eventos, mute, pausa, restart e estado |
| Testes | `tests/*.test.js` | Regressão de simulação, UX, lifecycle, build e integridade |
| QA/submissão | `docs/qa.md`, `docs/crazygames-submission.md`, `media/README.md`, `README.md` | Evidências, mídia real e checklist da nova versão |

---

### Task 1: Congelar o baseline recusado e criar a identificação da versão

**Files:**
- Create: `D:\LEONARDO\Games\sproutbound\docs\quality-release-0.2.0.md`
- Modify: `D:\LEONARDO\Games\sproutbound\README.md`
- Inspect only: `D:\LEONARDO\Games\sproutbound\submission\`

**Interfaces:**
- Produces: uma identificação explícita do estado recusado, da versão em desenvolvimento e dos critérios de saída.

- [ ] **Step 1: Registrar o baseline sem alterar seus arquivos**

Registrar no novo documento que o baseline recusado possui 57 testes locais aprovados, auditoria de build aprovada, ZIP Basic Launch existente, vídeos de preview ainda derivados de capas e validação no Preview Tool pendente.

- [ ] **Step 2: Definir a identidade da release**

Usar `0.2.0-quality` como identificador de desenvolvimento e `Sproutbound Quality Release 0.2.0` como referência interna. O documento deve listar as mudanças de produto: proteção solar, progressão visual, rotas com risco, onboarding visual, feedback audiovisual e QA real.

- [ ] **Step 3: Atualizar o README somente com o novo estado**

Adicionar uma seção `Quality release` que diferencie a versão atual recusada da versão que só poderá ser submetida depois dos gates. Não declarar aprovação ou publicação.

- [ ] **Step 4: Verificar o estado do Git**

Executar:

```powershell
git -C D:\LEONARDO\Games\sproutbound status --short --branch
```

Esperado: nenhum arquivo de submissão existente é removido, e somente os arquivos intencionalmente trabalhados aparecem como modificados.

---

### Task 2: Transformar as gotas de luz solar em mecânica de decisão

**Files:**
- Modify: `D:\LEONARDO\Games\sproutbound\src\game\model.js`
- Modify: `D:\LEONARDO\Games\sproutbound\src\game\simulation.js`
- Modify: `D:\LEONARDO\Games\sproutbound\src\game\progression.js`
- Modify: `D:\LEONARDO\Games\sproutbound\src\ui\hud.js`
- Modify: `D:\LEONARDO\Games\sproutbound\src\i18n.js`
- Test: `D:\LEONARDO\Games\sproutbound\tests\simulation.test.js`
- Test: `D:\LEONARDO\Games\sproutbound\tests\progression.test.js`
- Test: `D:\LEONARDO\Games\sproutbound\tests\ui.test.js`

**Interfaces:**
- `run.solar = { collected, charge, shieldAvailable, shieldUsed }`.
- `collectSolar(run, amount)` returns a new run state and emits `collectedSun` plus `solarShieldReady` quando atingir cinco gotas na corrida.
- A proteção solar absorve uma única colisão perigosa; não transforma queda livre em vida infinita.

- [ ] **Step 1: Escrever testes para a função da coleta**

Cobrir:

```js
assert.equal(run.solar.collected, 1);
assert.equal(run.solar.charge, 1);
assert.equal(run.solar.shieldAvailable, false);
```

E, com cinco gotas:

```js
assert.equal(run.solar.charge, 0);
assert.equal(run.solar.shieldAvailable, true);
```

- [ ] **Step 2: Escrever teste de proteção contra perigo**

Simular a colisão de Pip com uma copa de espinhos quando `shieldAvailable === true`. Esperar que a corrida continue, `shieldAvailable` passe para `false`, `shieldUsed` passe para `true` e o evento `solarShieldUsed` seja emitido uma única vez.

- [ ] **Step 3: Implementar o estado solar**

Adicionar o estado solar em `createRun`, manter a coleta idempotente e garantir que gotas removidas não possam ser coletadas novamente.

- [ ] **Step 4: Integrar a proteção ao fluxo de morte**

Centralizar o consumo da proteção antes de emitir `playerDied`. A proteção deve funcionar para a colisão de espinhos, mas não deve impedir o cume, duplicar pontos ou reverter uma copa já colapsada.

- [ ] **Step 5: Exibir função e objetivo no HUD**

Substituir o contador isolado por uma mensagem clara, como `Solar 3/5` e `Proteção pronta`. O texto deve existir em inglês e português e permanecer legível em portrait e landscape.

- [ ] **Step 6: Rodar a regressão**

Executar `npm test`. Esperado: os testes existentes e os novos testes da mecânica solar passam sem alterar a regra de altura máxima.

---

### Task 3: Tornar a progressão visual e persistente

**Files:**
- Modify: `D:\LEONARDO\Games\sproutbound\src\game\progression.js`
- Modify: `D:\LEONARDO\Games\sproutbound\src\game\model.js`
- Modify: `D:\LEONARDO\Games\sproutbound\src\app.js`
- Modify: `D:\LEONARDO\Games\sproutbound\src\render\canvas-renderer.js`
- Modify: `D:\LEONARDO\Games\sproutbound\src\ui\screens.js`
- Modify: `D:\LEONARDO\Games\sproutbound\src\ui\hud.js`
- Modify: `D:\LEONARDO\Games\sproutbound\src\i18n.js`
- Modify: `D:\LEONARDO\Games\sproutbound\index.html`
- Modify: `D:\LEONARDO\Games\sproutbound\styles.css`
- Test: `D:\LEONARDO\Games\sproutbound\tests\progression.test.js`
- Test: `D:\LEONARDO\Games\sproutbound\tests\renderer.test.js`
- Test: `D:\LEONARDO\Games\sproutbound\tests\ui.test.js`

**Interfaces:**
- `getVisualTier(progress)` returns `{ id, label, height, accent }`.
- `createRun(seed, progress)` receives persisted progress without fazer o gameplay depender do storage.
- The renderer consumes `snapshot.visualTier` and never reads storage directly.

- [ ] **Step 1: Definir quatro marcos com efeito observável**

Manter os marcos existentes, mas dar-lhes representação real:

| Altura | Marco | Efeito visível |
| --- | --- | --- |
| 10 m | Two-leaf sprout | Pip recebe duas folhas mais expressivas |
| 25 m | Blooming Pip | Pip recebe broto/flor e nova cor de acento |
| 60 m | Solar cape | Pip recebe uma trilha curta de luz durante o salto |
| 240 m | Summit Crown | Cume exibe a coroa e o estado de conquista |

- [ ] **Step 2: Criar teste de persistência visual**

Salvar `unlocked: ['bud']`, recriar a corrida e verificar que `visualTier.id === 'bud'` sem exigir nova coleta ou nova altura.

- [ ] **Step 3: Integrar o tier à criação da corrida**

Passar o progresso carregado para `createRun`. Se o armazenamento estiver bloqueado, usar o tier inicial e manter a partida jogável.

- [ ] **Step 4: Renderizar evolução sem duplicar a lógica**

Alterar `drawPip` para receber a aparência calculada no snapshot. Não ler `localStorage` nem consultar milestones dentro do renderer.

- [ ] **Step 5: Tornar o próximo marco uma meta concreta**

O HUD e Game Over devem informar altura restante, nome do próximo marco e recompensa. No cume, a tela deve informar que a meta foi concluída e qual aparência foi desbloqueada.

- [ ] **Step 6: Verificar falha do storage**

Executar a suíte de storage e UI com `getItem`/`setItem` lançando erro. Esperado: o visual volta ao tier inicial sem congelar ou quebrar o fluxo.

---

### Task 4: Corrigir onboarding e input no navegador real

**Files:**
- Modify: `D:\LEONARDO\Games\sproutbound\index.html`
- Modify: `D:\LEONARDO\Games\sproutbound\src\input.js`
- Modify: `D:\LEONARDO\Games\sproutbound\src\ui\screens.js`
- Modify: `D:\LEONARDO\Games\sproutbound\styles.css`
- Modify: `D:\LEONARDO\Games\sproutbound\src\i18n.js`
- Test: `D:\LEONARDO\Games\sproutbound\tests\input.test.js`
- Test: `D:\LEONARDO\Games\sproutbound\tests\smoke.test.js`

**Interfaces:**
- `bindInput(target, state, { documentRef, windowRef })` registra foco e limpeza nos alvos corretos.
- `readInput` mantém `{ axis, primary }` para não quebrar a simulação existente.

- [ ] **Step 1: Tornar o canvas focável**

Adicionar `tabindex="0"`, `role="application"` e foco visível acessível sem transformar a área inteira em botão de restart.

- [ ] **Step 2: Corrigir ciclo de foco**

Focar o canvas no primeiro `pointerdown` e `keydown`; limpar input em `window.blur` e `document.visibilitychange`. O `visibilitychange` não deve ser registrado somente no canvas.

- [ ] **Step 3: Adaptar layouts de teclado**

Manter setas e A/D; adicionar `KeyQ` e `KeyZ` como direção esquerda e `KeyD` como direção direita, cobrindo QWERTY e AZERTY sem capturar Escape, Ctrl/Cmd+W ou teclas de navegação do navegador.

- [ ] **Step 4: Criar onboarding visual dentro do gameplay**

Adicionar uma indicação curta com duas setas ou gesto de toque sobre a primeira rota. A indicação desaparece após o primeiro input físico e nunca bloqueia o canvas.

- [ ] **Step 5: Testar a regra do primeiro input**

Verificar que:

- clicar no card Ready não inicia a rodada se o card for informativo;
- tocar ou clicar no canvas inicia a rodada;
- pressionar uma tecla válida inicia a rodada;
- clicar em `Jogar novamente` apenas prepara Ready;
- o próximo input físico inicia a nova rodada;
- nenhuma tela secundária dispara `gameplayStart` automaticamente.

- [ ] **Step 6: Testar em navegador**

Validar manualmente Chrome e Edge com mouse, toque emulado, A/D, Q/D, Z/D e setas. Registrar o resultado em `docs/qa.md`.

---

### Task 5: Reestruturar a dificuldade em segmentos com rota garantida

**Files:**
- Modify: `D:\LEONARDO\Games\sproutbound\src\game\world.js`
- Modify: `D:\LEONARDO\Games\sproutbound\src\game\model.js`
- Modify: `D:\LEONARDO\Games\sproutbound\src\game\simulation.js`
- Test: `D:\LEONARDO\Games\sproutbound\tests\world.test.js`
- Test: `D:\LEONARDO\Games\sproutbound\tests\simulation.test.js`

**Interfaces:**
- `createWorld(seed, options)` mantém saída determinística.
- Cada faixa deve conter `routeId`, `safeRoute` e `riskType` para facilitar QA e debugging.
- `createWorld` deve permitir verificar uma rota segura sem depender do renderer.

- [ ] **Step 1: Formalizar segmentos de altura**

Usar quatro segmentos:

| Altura | Objetivo de design |
| --- | --- |
| 0–30 m | Ensino: copas verdes fixas, distâncias permissivas, gotas fáceis |
| 30–90 m | Introdução: uma copa móvel, rachada ou com espinhos por faixa, sempre com rota segura |
| 90–180 m | Domínio: alternância de riscos, gotas móveis e decisões de posicionamento |
| 180–249 m | Cume: maior pressão, leitura clara, rota ainda vencível e final explícito |

- [ ] **Step 2: Criar teste de alcançabilidade**

Para seeds representativas, verificar que existe uma copa segura alcançável a cada faixa e que a distância horizontal/vertical não excede o deslocamento máximo do Pip.

- [ ] **Step 3: Preservar as regras já aprovadas**

Manter: primeiros 30 m sem espinhos, faixa móvel com apenas uma copa móvel, copa rachada acompanhada de alternativa segura na mesma faixa e espinhos integrados à copa perigosa.

- [ ] **Step 4: Adicionar função de rota aos riscos**

As copas móveis devem exigir posicionamento; as rachadas devem exigir decisão de permanência; as copas com espinhos devem funcionar como risco opcional. Nenhum risco pode ser a única passagem obrigatória sem aviso legível.

- [ ] **Step 5: Testar seeds e extremos**

Executar testes com seeds `1`, `2`, `7`, `42`, `99` e uma seed negativa. Esperado: mundo determinístico, rota segura e cume alcançável em todos os casos.

- [ ] **Step 6: Ajustar a curva por playtest**

Somente depois dos testes automatizados, observar os primeiros 60 segundos em Chrome e Chromebook. Ajustar espaçamento ou velocidade com base na taxa de erro observada, não por impressão isolada.

---

### Task 6: Implementar feedback integrado de ação, perigo e recompensa

**Files:**
- Create: `D:\LEONARDO\Games\sproutbound\src\feedback.js`
- Create: `D:\LEONARDO\Games\sproutbound\src\audio.js`
- Modify: `D:\LEONARDO\Games\sproutbound\src\app.js`
- Modify: `D:\LEONARDO\Games\sproutbound\src\render\canvas-renderer.js`
- Modify: `D:\LEONARDO\Games\sproutbound\src\platform-adapter.js`
- Modify: `D:\LEONARDO\Games\sproutbound\src\platform-adapters\gamedistribution.js`
- Test: `D:\LEONARDO\Games\sproutbound\tests\renderer.test.js`
- Test: `D:\LEONARDO\Games\sproutbound\tests\platform-adapter.test.js`
- Test: `D:\LEONARDO\Games\sproutbound\tests\gamedistribution-adapter.test.js`

**Interfaces:**
- `createFeedbackState()` returns only serializable transient effects.
- `emitFeedback(state, event, payload)` maps `landed`, `collectedSun`, `solarShieldUsed`, `milestoneReached`, `hazardHit`, `playerDied` and `summitReached` to effects.
- `createAudioManager(windowRef)` exposes `playCue(name)`, `setMuted(value)` and `dispose()`; failure to create Web Audio is a no-op seguro.

- [ ] **Step 1: Criar feedback de aterrissagem**

Adicionar compressão visual curta de Pip, deslocamento de copa e micro-shake de câmera somente na aterrissagem; não alterar a caixa de colisão nem a física.

- [ ] **Step 2: Criar feedback de coleta e proteção**

Adicionar brilho curto na gota, incremento visual do HUD e destaque quando a proteção fica pronta ou é consumida.

- [ ] **Step 3: Criar feedback de risco e morte**

Adicionar aviso visual antes de uma copa com espinhos, impacto distinto ao tocar nela e transição clara para Game Over.

- [ ] **Step 4: Criar áudio local e seguro**

Usar Web Audio procedural ou arquivos locais pequenos. Nunca iniciar áudio antes do primeiro input físico. O áudio deve respeitar `muteAudio` do adaptador e não fazer requests externos.

- [ ] **Step 5: Integrar lifecycle e mute**

Substituir os callbacks vazios de `onMute` e `onUnmute` em `app.js` pelo controle do `AudioManager`. O adapter neutro deve continuar sem SDK e sem requests.

- [ ] **Step 6: Testar ausência de Web Audio**

Simular `AudioContext` indisponível. Esperado: o jogo permanece totalmente jogável, sem exceção e sem bloquear o primeiro input.

---

### Task 7: Tornar a apresentação desktop intencional e útil

**Files:**
- Modify: `D:\LEONARDO\Games\sproutbound\index.html`
- Modify: `D:\LEONARDO\Games\sproutbound\styles.css`
- Modify: `D:\LEONARDO\Games\sproutbound\src\ui\hud.js`
- Modify: `D:\LEONARDO\Games\sproutbound\src\ui\screens.js`
- Modify: `D:\LEONARDO\Games\sproutbound\src\i18n.js`
- Modify: `D:\LEONARDO\Games\sproutbound\src\render\canvas-renderer.js`
- Test: `D:\LEONARDO\Games\sproutbound\tests\ui.test.js`

**Interfaces:**
- O canvas continua 9:16 e jogável.
- A interface externa pode usar as áreas laterais em landscape para exibir estado de progresso, proteção solar e próximo marco, sem duplicar o HUD principal.

- [ ] **Step 1: Definir conteúdo funcional para landscape**

Exibir nas laterais, quando houver espaço: `Run goal`, progresso solar, marco atual e próximo desbloqueio. Não usar áreas laterais apenas como decoração.

- [ ] **Step 2: Manter prioridade mobile**

Em portrait, recolher as informações laterais para o HUD compacto sem reduzir a área útil de gameplay.

- [ ] **Step 3: Auditar legibilidade em DPR 1**

Testar os viewports CrazyGames `907×510`, `1216×684`, `1366×768`, `800×450` e `1080×607`. A UI precisa continuar legível sem sobrepor a rota.

- [ ] **Step 4: Verificar que nenhum clique acidental inicia ou reinicia**

Somente o input físico no canvas inicia gameplay; somente o botão explícito reinicia a corrida.

---

### Task 8: Atualizar a suíte automatizada e os gates de qualidade

**Files:**
- Modify: `D:\LEONARDO\Games\sproutbound\tests\simulation.test.js`
- Modify: `D:\LEONARDO\Games\sproutbound\tests\progression.test.js`
- Modify: `D:\LEONARDO\Games\sproutbound\tests\input.test.js`
- Modify: `D:\LEONARDO\Games\sproutbound\tests\renderer.test.js`
- Modify: `D:\LEONARDO\Games\sproutbound\tests\ui.test.js`
- Modify: `D:\LEONARDO\Games\sproutbound\tests\smoke.test.js`
- Modify: `D:\LEONARDO\Games\sproutbound\docs\qa.md`
- Modify: `D:\LEONARDO\Games\sproutbound\docs\crazygames-submission.md`

**Interfaces:**
- `npm test` deve cobrir a nova mecânica solar, progressão visual, foco, teclado, lifecycle e falhas de áudio/storage.
- `npm run check:build` deve continuar rejeitando URLs externas, `console.log` de release e total acima de 8 MB.

- [ ] **Step 1: Adicionar testes de regressão do core loop**

Cobrir coleta única, proteção única, altura máxima, morte, restart, cume, copa móvel, copa rachada e rota segura.

- [ ] **Step 2: Adicionar testes de onboarding**

Cobrir foco, primeiro input, tecla Q/Z, clique no canvas, botão de restart e ausência de start automático.

- [ ] **Step 3: Adicionar testes de feedback/lifecycle**

Cobrir ordem idempotente `start → stop`, mute durante pausa e ausência de exceção quando áudio não estiver disponível.

- [ ] **Step 4: Atualizar a contagem e os cenários manuais**

Substituir o número desatualizado de `49 automated tests` em `docs/crazygames-submission.md` pelo resultado real da suíte. Manter o cenário manual de 249 m e acrescentar proteção solar, evolução visual, foco, teclado AZERTY e modo low-end.

- [ ] **Step 5: Executar os gates locais**

```powershell
npm test
npm run check:build
```

Esperado: zero falhas, build abaixo de 8 MB e nenhum request externo no build-base.

---

### Task 9: QA real, mídia e pacote da nova versão

**Files:**
- Modify: `D:\LEONARDO\Games\sproutbound\media\README.md`
- Create: `D:\LEONARDO\Games\sproutbound\media\videos\sproutbound-quality-landscape.mp4`
- Create: `D:\LEONARDO\Games\sproutbound\media\videos\sproutbound-quality-portrait.mp4`
- Modify: `D:\LEONARDO\Games\sproutbound\docs\crazygames-submission.md`
- Modify: `D:\LEONARDO\Games\sproutbound\docs\qa.md`

**Interfaces:**
- Os vídeos devem representar uma sessão real da versão `0.2.0-quality`, sem áudio quando exigido, com abertura compatível com a capa e duração máxima de 20 segundos.
- O pacote enviado deve ser gerado depois dos gates de código e conter o artefato exato exibido nos vídeos.

- [ ] **Step 1: Servir a versão final localmente**

Usar `python -m http.server 8080` na raiz do projeto e testar o fluxo completo em Chrome e Edge.

- [ ] **Step 2: Testar no perfil de baixo desempenho**

Validar Chromebook de entrada ou emulação equivalente, observando carregamento, FPS, input, resize, pausa, perda de foco e armazenamento indisponível.

- [ ] **Step 3: Testar o Preview Tool**

Enviar o build final ao Preview Tool da CrazyGames. Registrar console, loading, viewport, onboarding, restart, mobile, mute e ausência de bloqueios.

- [ ] **Step 4: Gravar os vídeos reais**

Gravar landscape e portrait a partir do gameplay real. Remover os drafts derivados de capas da função de mídia final; não reutilizar os MP4 atuais como vídeos de publicação.

- [ ] **Step 5: Gerar o pacote identificável**

Gerar `submission/sproutbound-quality-0.2.0.zip` apenas depois de `npm test`, `npm run check:build` e Preview Tool aprovados. Calcular hash do ZIP e registrar no documento de release.

- [ ] **Step 6: Confirmar metadados**

Revisar título, descrição, controles, idioma, classificação, capas e vídeos. O texto e a mídia devem refletir a experiência real da nova versão.

---

### Task 10: Gate de decisão e nova submissão

**Files:**
- Modify: `D:\LEONARDO\Games\sproutbound\docs\quality-release-0.2.0.md`
- Modify: `D:\LEONARDO\Games\sproutbound\docs\crazygames-submission.md`

**Interfaces:**
- Produces: decisão documentada `READY_TO_SUBMIT` ou `NEEDS_WORK`; nunca marcar aprovação com base apenas nos testes locais.

- [ ] **Step 1: Aprovar os gates P0**

Todos devem estar verdadeiros:

- [ ] carregamento e primeira interação funcionam no artefato final;
- [ ] foco do canvas e teclado funcionam em Chrome/Edge;
- [ ] toque e mouse funcionam em mobile/desktop;
- [ ] nenhum erro crítico de console;
- [ ] rota segura existe para seeds avaliadas;
- [ ] storage e áudio falham com segurança;
- [ ] viewport e legibilidade passam nos tamanhos do portal;
- [ ] vídeos representam gameplay real.

- [ ] **Step 2: Aprovar as melhorias P1**

As quatro mudanças abaixo devem ser observáveis sem explicação externa:

- coleta solar possui função e risco/recompensa;
- progressão altera a aparência de Pip e permanece após reinício;
- onboarding visual demonstra o controle no gameplay;
- rota e dificuldade apresentam variedade com justiça.

- [ ] **Step 3: Decidir o estado**

Usar `READY_TO_SUBMIT` somente quando todos os P0 e P1 estiverem aprovados. Caso contrário, manter `NEEDS_WORK` e corrigir o menor bloqueio restante.

- [ ] **Step 4: Submeter somente a nova versão**

No portal CrazyGames, criar uma nova release usando o ZIP identificado, covers finais, vídeos reais e metadados revisados. Não substituir o artefato recusado sem manter a identificação de versão e o histórico local.

- [ ] **Step 5: Registrar o estado externo**

Separar no documento: upload realizado, Preview Tool aprovado, enviado para revisão, aprovação, distribuição e métricas. Nenhum desses estados deve ser inferido do build local.

---

## Critério de sucesso da versão

A versão `0.2.0-quality` só será considerada pronta para nova submissão quando:

- a coleta solar gerar uma decisão real;
- a proteção solar funcionar uma única vez e ser legível;
- os marcos alterarem Pip ou o mundo de forma visível;
- o primeiro minuto ensinar controle, risco e objetivo visualmente;
- a rota tiver variedade e garantia de passagem;
- a resposta de aterrissagem, coleta, perigo, morte e cume for perceptível;
- o áudio for local, opcional e silenciável;
- o jogo funcionar em Chrome, Edge, mobile e Chromebook de entrada;
- o Preview Tool não apresentar bloqueio;
- os vídeos mostrarem gameplay real;
- o pacote final permanecer abaixo de 8 MB;
- a nova versão for identificável e diferente da versão recusada.

## Decisão final

**Recomendação: não submeter o Sproutbound imediatamente.**

A versão atual deve entrar em uma iteração de produto `0.2.0-quality`, com prioridade nesta ordem:

1. coleta solar com função;
2. progressão visível e persistente;
3. onboarding e input real de navegador;
4. rota/dificuldade com decisões e alcançabilidade garantida;
5. feedback audiovisual integrado;
6. QA real, vídeos de gameplay e nova submissão.

Essa sequência ataca diretamente os riscos que podem ter provocado a recusa por qualidade geral. Partículas, transições e refinamentos de capa ficam subordinados a essas mudanças e não são considerados suficientes isoladamente.

## Referências operacionais

- `D:\LEONARDO\Games\cofre-games\03 - Projetos\Sproutbound\04 - Validação\Diagnóstico da recusa CrazyGames - Sproutbound.md`
- [[Manual Operacional para Jogos de Navegador]]
- [[Manual Operacional de Validação, Distribuição e Lançamento de Jogos para Plataformas de Navegador]]
- [[Diretrizes multiplataforma para jogos de navegador]]
- [[Diretrizes específicas CrazyGames]]
- [[Playbook de recuperação após recusa por qualidade em plataformas de navegador]]
- [CrazyGames Gameplay Requirements](https://docs.crazygames.com/requirements/gameplay/)
- [CrazyGames Quality Guidelines](https://docs.crazygames.com/requirements/quality/)
- [CrazyGames Basic Launch Guide](https://docs.crazygames.com/resources/basic-launch-metrics/)
