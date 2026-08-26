import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { STAGE_WIDTH, STAGE_HEIGHT } from '../src/game/stage.js';
import { getRoutes } from '../src/game/campaign.js';

const recorderPath = new URL('../tools/record-preview.html', import.meta.url);
const cssPath = new URL('../styles.css', import.meta.url);

test('o gravador importa as dimensões do palco em vez de fixá-las', async () => {
  const fonte = await readFile(recorderPath, 'utf8');
  assert.match(fonte, /from '\.\.\/src\/game\/stage\.js'/);
  assert.ok(!/STAGE_W\s*=\s*\d+/.test(fonte), 'o gravador voltou a fixar a largura do palco');
  // um import duplicado já quebrou o módulo uma vez
  const imports = (fonte.match(/from '\.\.\/src\/game\/stage\.js'/g) ?? []).length;
  assert.equal(imports, 1, `${imports} imports do módulo de palco`);
});

test('o enquadramento cabe no quadro nos dois formatos', async () => {
  for (const [largura, altura] of [[1920, 1080], [1080, 1620]]) {
    const escala = Math.min(largura / STAGE_WIDTH, altura / STAGE_HEIGHT);
    const lw = STAGE_WIDTH * escala;
    const lh = STAGE_HEIGHT * escala;
    assert.ok(lw <= largura + 0.5 && lh <= altura + 0.5, `palco ${Math.round(lw)}x${Math.round(lh)} estoura ${largura}x${altura}`);
    // e precisa ocupar pelo menos um dos lados por inteiro, senão sobra faixa dos dois lados
    assert.ok(Math.abs(lw - largura) < 1 || Math.abs(lh - altura) < 1, 'o palco não encosta em nenhum lado do quadro');
  }
});

test('o HUD desenhado usa os tokens do jogo, nunca cores próprias', async () => {
  const fonte = await readFile(recorderPath, 'utf8');
  const bloco = fonte.split('function desenharHud')[1]?.split('function escolherMime')[0] ?? '';
  assert.ok(bloco.length > 0, 'função de HUD não encontrada');
  const fixas = [...new Set(bloco.match(/rgba?\([^)]*\)|#[0-9a-f]{6}/gi) ?? [])];
  // O gravador desenhava o HUD com cores copiadas e ficou defasado assim que o
  // HUD mudou: o vídeo mostrava a superfície de baixo contraste já corrigida.
  assert.deepEqual(fixas, [], `cores fixas no HUD do gravador: ${fixas.join(', ')}`);
  assert.match(bloco, /TOKENS\./);
});

test('todo token que o gravador lê existe no styles.css', async () => {
  const fonte = await readFile(recorderPath, 'utf8');
  const css = await readFile(cssPath, 'utf8');
  const lidos = [...fonte.matchAll(/ler\('([a-z-]+)'\)/g)].map((m) => m[1]);
  assert.ok(lidos.length >= 6, `apenas ${lidos.length} tokens lidos`);
  for (const nome of lidos) {
    assert.match(css, new RegExp(`--hud-${nome}:`), `styles.css não define --hud-${nome}`);
  }
});

test('o gravador mostra os mesmos indicadores que o HUD do jogo', async () => {
  const fonte = await readFile(recorderPath, 'utf8');
  const bloco = fonte.split('function desenharHud')[1]?.split('function escolherMime')[0] ?? '';
  for (const [rotulo, padrao] of [['altura', /HEIGHT/], ['recorde', /BEST/], ['rota', /routeLabel/], ['objetivo', /objectiveText/], ['solar', /Solar light/]]) {
    assert.match(bloco, padrao, `o gravador não desenha ${rotulo}`);
  }
});

test('a gravação respeita a especificação da plataforma', async () => {
  const fonte = await readFile(recorderPath, 'utf8');
  const duracoes = [...fonte.matchAll(/<option value="(\d+)"/g)].map((m) => Number(m[1]));
  assert.ok(duracoes.length > 0, 'sem opções de duração');
  for (const d of duracoes) assert.ok(d >= 15 && d <= 20, `duração ${d}s fora de 15 a 20`);
  assert.match(fonte, /video\/mp4;codecs=avc1/, 'MP4 precisa ser a primeira escolha');
  assert.ok(!/getUserMedia|audioBitsPerSecond|createMediaStreamSource/.test(fonte), 'o gravador não pode capturar áudio');
  assert.match(fonte, /captureStream\(60\)/);
  assert.match(fonte, /formato\.largura === 1920|landscape: \{ largura: 1920, altura: 1080/);
  assert.match(fonte, /portrait: \{ largura: 1080, altura: 1620/);
});

test('o seletor de rota cobre a campanha inteira', async () => {
  const fonte = await readFile(recorderPath, 'utf8');
  assert.match(fonte, /for \(const rota of getRoutes\(\)\)/);
  const padrao = fonte.match(/if \(rota\.order === (\d+)\) opcao\.selected/)?.[1];
  assert.ok(padrao, 'sem rota padrão selecionada');
  assert.ok(Number(padrao) >= 1 && Number(padrao) <= getRoutes().length, 'rota padrão fora do catálogo');
});

test('o gravador recusa gravar em aba que o navegador estrangula', async () => {
  const fonte = await readFile(recorderPath, 'utf8');
  // Medido: em aba oculta o rAF fica em 0 quadro e o setInterval vai a 1006 ms.
  // MediaRecorder grava em tempo real, então a tomada sairia com um punhado de
  // quadros e um arquivo de tamanho aparentemente normal.
  assert.match(fonte, /medirAptidao/);
  assert.match(fonte, /document\.visibilityState !== 'visible'/);
  assert.match(fonte, /if \(!aptidao\.apta\)/, 'a gravação precisa parar antes de começar');
});

test('a tomada é descartada se a aba perder o foco no meio', async () => {
  const fonte = await readFile(recorderPath, 'utf8');
  assert.match(fonte, /perdeuFoco/);
  assert.match(fonte, /addEventListener\('visibilitychange', aoEsconder\)/);
  assert.match(fonte, /removeEventListener\('visibilitychange', aoEsconder\)/, 'o ouvinte precisa ser removido');
  assert.match(fonte, /descartado: true/);
});

test('a conferência reprova tomada abaixo de 30 quadros por segundo', async () => {
  const fonte = await readFile(recorderPath, 'utf8');
  assert.match(fonte, /fpsReal < 30/);
  assert.match(fonte, /\['Quadros por segundo', `\$\{fpsReal\}`, fpsReal >= 30\]/);
});

test('as dimensões do MP4 são lidas do fim da tkhd, não por offset calculado', async () => {
  const { runGate } = await import('../tools/check-gate.mjs');
  const resultado = runGate().find((r) => r.id === 'P0-4');
  assert.ok(resultado, 'o item de vídeos precisa existir no gate');
  // O offset a partir do início erra por causa dos campos de tamanho variável
  // entre tkhd versão 0 e 1: o gate lia a altura como largura e reprovava
  // arquivo correto pelo motivo errado.
  assert.ok(
    !/1080x0|x0,|: 1080px/.test(resultado.detail),
    `o parser voltou a ler a dimensão errada: ${resultado.detail}`,
  );
});

test('os dois vídeos entregues cumprem a especificação da plataforma', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const raiz = new URL('../media/videos/', import.meta.url);
  const esperado = {
    'sproutbound-landscape-preview.mp4': { w: 1920, h: 1080 },
    'sproutbound-portrait-preview.mp4': { w: 1080, h: 1620 },
  };

  const lerMp4 = (buffer) => {
    const info = { seconds: null, width: null, height: null, hasAudio: buffer.includes(Buffer.from('mp4a')) };
    let soma = 0;
    const walk = (start, end, nivel) => {
      let p = start;
      while (p + 8 <= end) {
        let size = buffer.readUInt32BE(p);
        const type = buffer.toString('latin1', p + 4, p + 8);
        if (size === 1) size = Number(buffer.readBigUInt64BE(p + 8));
        if (size < 8 || p + size > end) break;
        if (nivel === 0) soma += size;
        if (type === 'mvhd') {
          const v = buffer[p + 8];
          const escala = v === 1 ? buffer.readUInt32BE(p + 28) : buffer.readUInt32BE(p + 20);
          const dur = v === 1 ? Number(buffer.readBigUInt64BE(p + 32)) : buffer.readUInt32BE(p + 24);
          if (escala) info.seconds = dur / escala;
        }
        if (type === 'tkhd') {
          const w = buffer.readUInt32BE(p + size - 8) / 65536;
          const h = buffer.readUInt32BE(p + size - 4) / 65536;
          if (w > 0 && h > 0) { info.width = Math.round(w); info.height = Math.round(h); }
        }
        if (['moov', 'trak', 'mdia', 'minf', 'stbl'].includes(type)) walk(p + 8, p + size, nivel + 1);
        p += size;
      }
    };
    walk(0, buffer.length, 0);
    info.completo = soma === buffer.length;
    return info;
  };

  for (const [nome, alvo] of Object.entries(esperado)) {
    const arquivo = path.default.join(raiz.pathname.replace(/^\//, ''), nome);
    const buffer = fs.default.readFileSync(decodeURIComponent(arquivo));
    const info = lerMp4(buffer);
    assert.equal(info.width, alvo.w, `${nome}: largura`);
    assert.equal(info.height, alvo.h, `${nome}: altura`);
    assert.ok(info.seconds >= 15 && info.seconds <= 20, `${nome}: ${info.seconds?.toFixed(2)}s fora de 15 a 20`);
    assert.equal(info.hasAudio, false, `${nome}: contém faixa de áudio`);
    assert.ok(buffer.length <= 50 * 1024 * 1024, `${nome}: acima de 50 MB`);
    // a soma das caixas de topo tem de fechar com o arquivo, senão está truncado
    assert.ok(info.completo, `${nome}: arquivo truncado ou incompleto`);
  }
});
