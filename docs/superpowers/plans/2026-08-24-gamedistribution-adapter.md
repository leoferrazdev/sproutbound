# GameDistribution Adapter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (\`- [ ]\`) syntax for tracking.

**Goal:** Criar, testar, empacotar e validar uma variante do Sproutbound com o SDK HTML5 da GameDistribution, preservando o build-base offline.

**Architecture:** O gameplay será extraído para uma factory de aplicação que recebe uma factory de adaptador. O build-base usa o adaptador neutro existente; o build GameDistribution usa um entrypoint próprio e um adaptador que recebe os eventos SDK_GAME_PAUSE e SDK_GAME_START por window.__sproutboundGameDistributionEvent. O SDK remoto aparece somente no index.html gerado da variante.

**Tech Stack:** HTML5, JavaScript ES modules, Canvas 2D, Node.js built-in test runner, Node.js fs/promises e tar para o ZIP em ambiente Windows.

## Global Constraints

- O index.html base e o pacote submission/sproutbound-basic-launch.zip não podem receber SDK, analytics, anúncios ou URL externa.
- O SDK GameDistribution só pode existir na variante gamedistribution-adapter.
- O Game ID é 8ccb967dc0be492c9be5fc5a95f32fd5.
- SDK_GAME_PAUSE deve pausar loop, bloquear input e silenciar áudio; SDK_GAME_START deve retomar loop, input e áudio.
- gdsdk.showAd() só pode ser acionado por input físico no reinício, fora do gameplay.
- Ausência, erro ou bloqueio do SDK não pode congelar o jogo.
- gameplayStart() e gameplayStop() continuam protegidos contra chamadas duplicadas consecutivas.
- Nenhum arquivo de release pode conter console.log.
- O build da plataforma deve permanecer abaixo de 8 MB.
- O pedido final de ativação no portal exige confirmação de estado imediatamente antes do clique.

---

### Task 1: Definir o contrato testável do adaptador

**Files:**
- Create: tests/gamedistribution-adapter.test.js
- Read: src/platform-adapter.js

**Interfaces:**
- Consumes: createGameDistributionAdapter(options).
- Produces: testes para handleEvent, requestCommercialBreak, lifecycle locks e ausência do SDK.

- [ ] **Step 1: Escrever os testes RED**

~~~js
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameDistributionAdapter } from '../src/platform-adapters/gamedistribution.js';

const fakeWindow = () => ({ setTimeout, clearTimeout });

test('pauses and resumes once for SDK lifecycle events', () => {
  const calls = [];
  const adapter = createGameDistributionAdapter({
    windowRef: fakeWindow(),
    onPause: () => calls.push('pause-loop'),
    onResume: () => calls.push('resume-loop'),
    onMute: () => calls.push('mute'),
    onUnmute: () => calls.push('unmute'),
  });

  adapter.handleEvent({ name: 'SDK_GAME_PAUSE' });
  adapter.handleEvent({ name: 'SDK_GAME_PAUSE' });
  adapter.handleEvent({ name: 'SDK_GAME_START' });
  adapter.handleEvent({ name: 'SDK_GAME_START' });

  assert.deepEqual(calls, ['pause-loop', 'mute', 'resume-loop', 'unmute']);
  assert.equal(adapter.isInputPaused(), false);
});

test('calls showAd and resolves after SDK_GAME_START', async () => {
  let calls = 0;
  const adapter = createGameDistributionAdapter({
    windowRef: fakeWindow(),
    sdk: { showAd: () => { calls += 1; } },
  });

  const resultPromise = adapter.requestCommercialBreak();
  assert.equal(calls, 1);
  adapter.handleEvent({ name: 'SDK_GAME_START' });
  assert.equal(await resultPromise, true);
});

test('fails open when SDK or showAd is unavailable', async () => {
  const adapter = createGameDistributionAdapter({ windowRef: fakeWindow() });

  assert.equal(await adapter.requestCommercialBreak(), false);
  assert.equal(adapter.getSdkStatus(), 'unavailable');
});

test('preserves duplicate lifecycle locks', async () => {
  const adapter = createGameDistributionAdapter({ windowRef: fakeWindow() });

  assert.equal(await adapter.startGameplay(), true);
  assert.equal(await adapter.startGameplay(), false);
  assert.equal(await adapter.stopGameplay(), true);
  assert.equal(await adapter.stopGameplay(), false);
  assert.deepEqual(adapter.getEvents(), ['start', 'stop']);
});
~~~

- [ ] **Step 2: Verificar RED**

Run: node --test tests/gamedistribution-adapter.test.js

Expected: FAIL because src/platform-adapters/gamedistribution.js does not exist.

- [ ] **Step 3: Commit the contract test**

~~~bash
git add tests/gamedistribution-adapter.test.js
git commit -m "test: define GameDistribution adapter contract"
~~~

---

### Task 2: Implementar o adaptador GameDistribution

**Files:**
- Create: src/platform-adapters/gamedistribution.js
- Test: tests/gamedistribution-adapter.test.js

**Interfaces:**
- Consumes: windowRef, optional sdk, onPause, onResume, onMute, onUnmute e commercialBreakTimeoutMs.
- Produces: startGameplay, stopGameplay, requestCommercialBreak, pauseInput, resumeInput, handleEvent, getSdkStatus, getState, getEvents e isInputPaused.

- [ ] **Step 1: Implementar a camada mínima sobre o adaptador neutro**

~~~js
import { createPlatformAdapter } from '../platform-adapter.js';

export function createGameDistributionAdapter({
  windowRef = globalThis,
  sdk,
  onPause,
  onResume,
  onMute = () => {},
  onUnmute = () => {},
  commercialBreakTimeoutMs = 5000,
} = {}) {
  const base = createPlatformAdapter({ onPause, onResume });
  let pendingBreak = null;

  const getSdk = () => sdk ?? windowRef.gdsdk;
  const finishBreak = (result) => {
    if (!pendingBreak) return;
    const pending = pendingBreak;
    pendingBreak = null;
    windowRef.clearTimeout?.(pending.timer);
    pending.resolve(result);
  };

  const handleEvent = (event = {}) => {
    if (event.name === 'SDK_GAME_PAUSE') {
      base.pauseInput();
      onMute();
      return;
    }
    if (event.name === 'SDK_GAME_START') {
      base.resumeInput();
      onUnmute();
      finishBreak(true);
    }
  };

  windowRef.__sproutboundGameDistributionEvent = handleEvent;

  const requestCommercialBreak = async () => {
    const currentSdk = getSdk();
    if (typeof currentSdk?.showAd !== 'function') return false;

    return new Promise((resolve) => {
      const timer = windowRef.setTimeout?.(
        () => finishBreak(false),
        commercialBreakTimeoutMs,
      );
      pendingBreak = { resolve, timer };
      try {
        currentSdk.showAd();
      } catch {
        finishBreak(false);
      }
    });
  };

  return {
    ...base,
    handleEvent,
    requestCommercialBreak,
    getSdkStatus: () => (
      typeof getSdk()?.showAd === 'function' ? 'available' : 'unavailable'
    ),
  };
}
~~~

- [ ] **Step 2: Verificar GREEN**

Run: node --test tests/gamedistribution-adapter.test.js

Expected: all four tests pass.

- [ ] **Step 3: Verificar regressão**

Run: node --test tests/platform-adapter.test.js tests/gamedistribution-adapter.test.js

Expected: all neutral and GameDistribution lifecycle tests pass.

- [ ] **Step 4: Commit**

~~~bash
git add src/platform-adapters/gamedistribution.js tests/gamedistribution-adapter.test.js
git commit -m "feat: add GameDistribution platform adapter"
~~~

---

### Task 3: Separar os entrypoints sem alterar o build-base

**Files:**
- Create: src/app.js
- Create: src/main-gamedistribution.js
- Modify: src/main.js
- Modify: tests/smoke.test.js

- [ ] **Step 1: Mover createApp para src/app.js**

Preservar a lógica existente de storage, input, HUD, telas, renderer e restart. Alterar apenas a fronteira da factory:

~~~js
export function createApp(
  documentRef,
  { platformAdapterFactory = createPlatformAdapter } = {},
) {
  let loop;
  const platformAdapter = platformAdapterFactory({
    onPause: () => loop?.pause(),
    onResume: () => loop?.resume(),
    onMute: () => {},
    onUnmute: () => {},
  });
  // restante da implementação atual de createApp
}
~~~

O callback onRestart continuará aguardando requestCommercialBreak antes de resetar a rodada e retomar o loop.

- [ ] **Step 2: Manter src/main.js neutro**

~~~js
import { createApp } from './app.js';
import { createPlatformAdapter } from './platform-adapter.js';

export { createApp } from './app.js';

if (typeof window !== 'undefined' && window.document) {
  createApp(window.document, { platformAdapterFactory: createPlatformAdapter });
}
~~~

- [ ] **Step 3: Criar o entrypoint da plataforma**

~~~js
import { createApp } from './app.js';
import { createGameDistributionAdapter } from './platform-adapters/gamedistribution.js';

if (typeof window !== 'undefined' && window.document) {
  createApp(window.document, {
    platformAdapterFactory: createGameDistributionAdapter,
  });
}
~~~

- [ ] **Step 4: Estender o smoke test**

Verificar que index.html referencia ./src/main.js, não contém http e que src/main-gamedistribution.js existe como módulo local. Run: node --test tests/smoke.test.js. Expected: PASS.

- [ ] **Step 5: Rodar a suíte e commit**

Run: npm test

Expected: todos os testes passam sem warnings.

~~~bash
git add src/app.js src/main.js src/main-gamedistribution.js tests/smoke.test.js
git commit -m "refactor: separate platform bootstraps"
~~~

---

### Task 4: Gerar e auditar o pacote GameDistribution

**Files:**
- Create: tools/build-gamedistribution.mjs
- Modify: tools/check-build.mjs
- Modify: tests/build.test.js
- Modify: package.json

**Interfaces:**
- buildGameDistribution({ outputRoot, zipPath }) cria a pasta de plataforma e o ZIP.
- auditBuild(projectRoot, { allowedExternalUrls }) audita o pacote com política explícita de URL.

- [ ] **Step 1: Escrever o teste RED do builder**

O teste deve chamar buildGameDistribution com pasta temporária e verificar:

~~~js
assert.match(indexHtml, /gameId:\s*["']8ccb967dc0be492c9be5fc5a95f32fd5["']/);
assert.match(indexHtml, /html5\.api\.gamedistribution\.com\/main\.min\.js/);
assert.match(indexHtml, /src\/main-gamedistribution\.js/);
assert.equal(await stat(join(outputRoot, 'index.html')).then(() => true), true);
~~~

Run: node --test tests/build.test.js

Expected: FAIL porque o builder não existe.

- [ ] **Step 2: Implementar o builder**

O builder deverá copiar styles.css e src/ para submission/sproutbound-gamedistribution-build/, gerar index.html com o DOM atual, o GD_OPTIONS, o Game ID exato, o SDK oficial e ./src/main-gamedistribution.js, e criar submission/sproutbound-gamedistribution.zip usando:

~~~text
tar -a -c -f <zipPath> -C <outputRoot> .
~~~

Exportar buildGameDistribution para os testes e imprimir somente um resumo final quando executado pelo npm.

- [ ] **Step 3: Separar a política de auditoria**

Alterar auditBuild para ignorar submission/ no build-base e aceitar allowedExternalUrls. O build-base continuará rejeitando https://example.com/sdk.js. A auditoria da variante permitirá apenas https://html5.api.gamedistribution.com/main.min.js.

- [ ] **Step 4: Adicionar comando npm**

Adicionar:

~~~json
"build:gamedistribution": "node tools/build-gamedistribution.mjs"
~~~

- [ ] **Step 5: Rodar e commit**

Run: node --test tests/build.test.js

Expected: PASS, incluindo as regras base e a política explícita da variante.

~~~bash
git add tools/build-gamedistribution.mjs tools/check-build.mjs tests/build.test.js package.json
git commit -m "build: generate GameDistribution package"
~~~

---

### Task 5: Registrar a entrega específica da plataforma

**Files:**
- Create: docs/gamedistribution-submission.md
- Modify: README.md

- [ ] **Step 1: Criar o checklist operacional**

Registrar Game ID, comando de build, exceção de rede restrita à variante e:

~~~markdown
- [x] Game record criado no GameDistribution.
- [x] Build HTML5 enviado.
- [x] Thumbnails obrigatórios enviados.
- [ ] SDK detectado como Yes.
- [ ] Anúncio de teste assistido até o fim no iframe.
- [ ] Request Activation enviado.
~~~

- [ ] **Step 2: Linkar o comando no README**

Adicionar npm run build:gamedistribution na seção de entregas, informando que ele gera pacote separado e não altera o build offline.

- [ ] **Step 3: Verificar e commit**

Run: git diff --check

~~~bash
git add docs/gamedistribution-submission.md README.md
git commit -m "docs: record GameDistribution submission flow"
~~~

---

### Task 6: Verificar localmente e preparar o upload

**Files:**
- Generated: submission/sproutbound-gamedistribution-build/
- Generated: submission/sproutbound-gamedistribution.zip

- [ ] **Step 1: Rodar a verificação completa**

~~~bash
npm test
npm run check:build
npm run build:gamedistribution
~~~

Expected: testes passam, auditoria base passa, auditoria da variante aceita somente o SDK oficial e o ZIP fica abaixo de 8 MB.

- [ ] **Step 2: Inspecionar o arquivo**

Run: tar -tf submission/sproutbound-gamedistribution.zip

Expected: index.html está na raiz e src/main-gamedistribution.js está presente.

- [ ] **Step 3: Preservar o pacote CrazyGames**

Confirmar que submission/sproutbound-basic-launch.zip não foi alterado e não adicionar ao commit as pastas de upload já existentes.

---

### Task 7: Reenviar, validar e solicitar ativação

**Files:**
- Browser: registro GameDistribution 75315
- Upload: submission/sproutbound-gamedistribution.zip

- [ ] **Step 1: Enviar o novo ZIP**

Usar o portal autenticado, selecionar o novo ZIP e aguardar o portal confirmar o upload concluído.

- [ ] **Step 2: Abrir o iframe de teste**

Confirmar carregamento, primeiro input, controles, responsividade e ausência de erro bloqueante.

- [ ] **Step 3: Validar anúncio e lifecycle**

Abrir os controles de debug, chamar o anúncio de teste a partir de ação do usuário, confirmar pausa/input bloqueado/mute durante o anúncio e assistir até o evento de retomada.

- [ ] **Step 4: Conferir o gate do portal**

Confirmar visualmente SDK: Yes e Request Activation habilitado. Se continuar SDK: No, interromper e registrar o bloqueio.

- [ ] **Step 5: Confirmar antes do pedido externo**

Depois de Request Activation habilitado, pedir confirmação imediata para clicar no botão final. Não combinar essa ação com as verificações anteriores.

- [ ] **Step 6: Registrar resultado**

Atualizar docs/gamedistribution-submission.md com build, data do upload, resultado do SDK, preview e ativação.

---

## Self-review

- Cada comportamento novo tem teste RED antes da implementação.
- O build-base e o pacote GameDistribution possuem políticas de rede separadas.
- O adaptador preserva as travas de start e stop.
- O builder produz entrypoint, Game ID e raiz de ZIP verificáveis.
- A ativação final fica protegida por confirmação imediata.
- Nenhum segredo ou dado pessoal entra nos artefatos.

