// Release Gate CrazyGames — executável.
//
// As duas recusas do Sproutbound não vieram de análise errada: vieram de submeter
// com o gate aberto, porque o gate era uma lista em markdown que alguém marcava.
// Este arquivo torna o gate mecânico. O que dá para medir, ele mede. O que depende
// de uma pessoa abrir o jogo, ele exige registrado com data, navegador e commit —
// e recusa registros de outro commit.
//
// Uso:  node tools/check-gate.mjs
// Saída: 0 somente se todos os itens passarem.

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { createRun } from '../src/game/model.js';
import { stepRun } from '../src/game/simulation.js';
import { createWorld } from '../src/game/world.js';
import { getMilestones } from '../src/game/progression.js';
import { getRoutes, getRoute, BIOMES } from '../src/game/campaign.js';
import { createFeedbackState, stepFeedback, PULSE_SECONDS } from '../src/game/feedback.js';
import { createCanvasRenderer, createBackdropRenderer } from '../src/render/canvas-renderer.js';
import { createAudio, getBiomeScale } from '../src/audio.js';
import { wrapX, playerGhosts, rectsOverlap } from '../src/game/player.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MANUAL_LOG = path.join(ROOT, 'docs', 'gate-manual-evidence.json');

export const THRESHOLDS = Object.freeze({
  contentSeconds: 360,
  maxRewardGapSeconds: 90,
  maxMilestonesInFirstMinute: 2,
  minRoutes: 20,
  minBiomes: 4,
  minObjectiveTypes: 4,
  coverFormats: [
    { id: 'landscape', width: 1920, height: 1080 },
    { id: 'portrait', width: 800, height: 1200 },
    { id: 'square', width: 800, height: 800 },
  ],
  video: { minSeconds: 15, maxSeconds: 20, minLandscapeWidth: 1920, minPortraitWidth: 1080, maxBytes: 50 * 1024 * 1024 },
  manualItems: [
    'preview-tool',
    'console-clean-10min',
    'fps-stable-10min',
    'desktop-occupancy',
    'playtest-five-strangers',
  ],
});

// ---------------------------------------------------------------- utilidades

function currentCommit() {
  try {
    return execSync('git rev-parse HEAD', { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

function readFileSafe(relative) {
  try {
    return fs.readFileSync(path.join(ROOT, relative), 'utf8');
  } catch {
    return null;
  }
}

// Agente determinístico: persegue a plataforma alcançável mais próxima acima.
// Não é um jogador humano, é um limite superior — se nem ele estica o conteúdo,
// nenhum humano estica.
export function playToExhaustion({ seed = 1, route = null, maxSeconds = 900, dt = 1 / 60 } = {}) {
  let run = createRun(route ?? seed, { bestHeight: 0, unlocked: [] });
  let result = stepRun(run, { left: false, right: false, primary: true }, 0);
  run = result.run;

  let elapsed = 0;
  const milestoneTimes = [];
  let lastRewardAt = 0;
  let maxRewardGap = 0;

  while (elapsed < maxSeconds && run.state === 'playing') {
    const player = run.player;
    const platforms = run.platforms ?? [];
    const above = platforms
      .filter((p) => p.y < player.y - 4 && !p.collapsed && p.kind !== 'thorn-leaf')
      .sort((a, b) => b.y - a.y)[0];

    // O agente precisa ser competente para servir de medida: mira no lado da
    // folha oposto ao espinho da mesma linha, em vez de no centro geométrico.
    let target = 180;
    if (above) {
      target = above.x + above.width / 2;
      const thorn = platforms.find((p) => p.kind === 'thorn-leaf' && Math.abs(p.y - above.y) < 2);
      if (thorn) {
        const margin = player.width / 2 + 4;
        const safeSpan = Math.max(0, above.width / 2 - margin);
        target = thorn.x > above.x ? above.x + margin : above.x + above.width - margin;
        if (safeSpan <= 0) target = above.x + above.width / 2;
      }
    }
    const centre = player.x + player.width / 2;

    result = stepRun(run, { left: centre - target > 6, right: target - centre > 6, primary: false }, dt);
    run = result.run;
    elapsed += dt;

    for (const event of result.events) {
      if (event === 'milestoneReached' || event === 'summitReached') {
        milestoneTimes.push(Number(elapsed.toFixed(2)));
        maxRewardGap = Math.max(maxRewardGap, elapsed - lastRewardAt);
        lastRewardAt = elapsed;
      }
    }
  }

  return {
    seconds: Number(elapsed.toFixed(2)),
    height: run.score,
    endState: run.state,
    milestoneTimes,
    milestonesInFirstMinute: milestoneTimes.filter((t) => t <= 60).length,
    maxRewardGap: Number(Math.max(maxRewardGap, elapsed - lastRewardAt).toFixed(2)),
  };
}

// Mede a campanha inteira. O jogo deixou de ser uma corrida: medir uma partida
// diria 10 segundos e esconderia o que importa.
export function playCampaign({ maxSecondsPerRoute = 300 } = {}) {
  const routes = getRoutes();
  const perRoute = [];
  let total = 0;
  for (const route of routes) {
    const session = playToExhaustion({ route, maxSeconds: maxSecondsPerRoute });
    perRoute.push({ id: route.id, seconds: session.seconds, endState: session.endState });
    total += session.seconds;
  }
  return {
    totalSeconds: Number(total.toFixed(2)),
    routes: perRoute,
    unbeatable: perRoute.filter((r) => r.endState !== 'summit').map((r) => r.id),
  };
}

export function worldSignature(seed) {
  return createWorld(seed, { platformCount: 60 })
    .map((e) => `${e.type}:${e.kind ?? ''}:${Math.round(e.x)}:${Math.round(e.y)}`)
    .join('|');
}

function pngSize(buffer) {
  if (buffer.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function mp4Info(buffer) {
  const info = { seconds: null, width: null, height: null, hasAudio: buffer.includes(Buffer.from('mp4a')) };
  const walk = (start, end) => {
    let p = start;
    while (p + 8 <= end) {
      let size = buffer.readUInt32BE(p);
      const type = buffer.toString('latin1', p + 4, p + 8);
      if (size === 1) size = Number(buffer.readBigUInt64BE(p + 8));
      if (size < 8 || p + size > end) break;
      if (type === 'mvhd') {
        const version = buffer[p + 8];
        const scale = version === 1 ? buffer.readUInt32BE(p + 28) : buffer.readUInt32BE(p + 20);
        const duration = version === 1 ? Number(buffer.readBigUInt64BE(p + 32)) : buffer.readUInt32BE(p + 24);
        if (scale) info.seconds = Number((duration / scale).toFixed(2));
      }
      if (type === 'tkhd') {
        // Largura e altura são os últimos 8 bytes da box, em ponto fixo 16.16.
        // Calcular o offset a partir do início erra por causa dos campos de
        // tamanho variável entre versão 0 e 1, e o gate lia a altura como se
        // fosse a largura — reprovava arquivo correto pelo motivo errado.
        const width = buffer.readUInt32BE(p + size - 8) / 65536;
        const height = buffer.readUInt32BE(p + size - 4) / 65536;
        if (width > 0 && height > 0) {
          info.width = Math.round(width);
          info.height = Math.round(height);
        }
      }
      if (['moov', 'trak', 'mdia', 'minf', 'stbl'].includes(type)) walk(p + 8, p + size);
      p += size;
    }
  };
  walk(0, buffer.length);
  return info;
}


// Grava cores e contagem de desenho. Serve para provar que a paleta declarada
// chega ao pixel, e que o fundo realmente se move — os dois defeitos que a
// auditoria encontrou: pulso calculado e nunca desenhado, paralaxe calculada e
// aplicada a um só elemento.
function paintProbe(snapshot) {
  const colours = new Set();
  const geometry = [];
  let calls = 0;
  const context = new Proxy({}, {
    get: (_t, prop) => {
      if (prop === 'createLinearGradient') return () => ({ addColorStop: (_stop, colour) => colours.add(String(colour)) });
      if (prop === 'canvas') return { width: 360, height: 640 };
      if (typeof prop === 'string' && /^(fill|stroke|arc|moveTo|lineTo|rect|ellipse|quadraticCurveTo|closePath)/.test(prop)) {
        return (...args) => {
          calls += 1;
          // guardar a geometria permite provar movimento, e não apenas atividade
          if (args.length >= 2 && Number.isFinite(args[1])) geometry.push(Math.round(args[1]));
        };
      }
      return () => undefined;
    },
    set: (_t, prop, value) => {
      if (prop === 'fillStyle' || prop === 'strokeStyle') colours.add(String(value));
      return true;
    },
  });
  const renderer = createCanvasRenderer({ width: 360, height: 640, getContext: () => context });
  renderer.resize({ width: 360, height: 640, dpr: 1 });
  renderer.render(snapshot);
  return { colours, calls, geometry: geometry.join(',') };
}

// ------------------------------------------------------------------- checagens

const checks = [];
const check = (id, title, run) => checks.push({ id, title, run });

check('P0-1', 'Conteúdo passa de 6 minutos', () => {
  const campaign = playCampaign();
  const minutes = (campaign.totalSeconds / 60).toFixed(1);
  return {
    ok: campaign.totalSeconds >= THRESHOLDS.contentSeconds,
    detail: `campanha de ${campaign.routes.length} rotas exaurida em ${minutes} min (${campaign.totalSeconds}s) por um agente sem mortes; mínimo ${THRESHOLDS.contentSeconds / 60} min`,
  };
});

check('P0-2', 'Variedade vem de rotas desenhadas e completáveis', () => {
  const routes = getRoutes();
  const biomes = new Set(routes.map((route) => route.biome));
  const objectives = new Set(routes.map((route) => route.objective.type));

  // Rota desenhada é fixa por definição: repetir uma fase precisa dar a mesma
  // fase. A variedade vem do catálogo, não de aleatoriedade por partida.
  const signatures = new Set(routes.map((route) => worldSignature(route.seed)));
  const campaign = playCampaign();

  const problems = [];
  if (routes.length < THRESHOLDS.minRoutes) problems.push(`apenas ${routes.length} rotas, mínimo ${THRESHOLDS.minRoutes}`);
  if (signatures.size !== routes.length) problems.push(`${routes.length - signatures.size} rotas repetem o mesmo traçado`);
  if (biomes.size < THRESHOLDS.minBiomes) problems.push(`apenas ${biomes.size} biomas, mínimo ${THRESHOLDS.minBiomes}`);
  if (objectives.size < THRESHOLDS.minObjectiveTypes) problems.push(`apenas ${objectives.size} tipos de objetivo, mínimo ${THRESHOLDS.minObjectiveTypes}`);
  if (campaign.unbeatable.length) problems.push(`rotas invencíveis pelo agente: ${campaign.unbeatable.join(', ')}`);

  // A mesma rota precisa gerar o mesmo mundo em execuções distintas.
  const first = routes[0];
  if (worldSignature(first.seed) !== worldSignature(getRoute(first.id).seed)) {
    problems.push('a mesma rota não é reprodutível');
  }

  return {
    ok: problems.length === 0,
    detail: problems.length
      ? problems.join('; ')
      : `${routes.length} rotas distintas em ${biomes.size} biomas, ${objectives.size} tipos de objetivo, todas completáveis`,
  };
});

check('P0-3', 'Todo evento de gameplay chega ao renderer', () => {
  const EVENT_BY_PULSE = {
    impact: 'platformImpact',
    collect: 'collectedSun',
    shield: 'solarShieldReady',
    milestone: 'milestoneReached',
    death: 'playerDied',
  };
  const player = { x: 160, y: 320, width: 26, height: 34, grounded: true, dead: false };

  // Contexto falso que apenas conta operações de desenho. Grep é burlável;
  // contagem de chamadas não é. Se um pulso não muda a contagem, ele não chega
  // ao pixel, independente do que o código pareça fazer.
  const drawCount = (feedback) => {
    let calls = 0;
    const context = new Proxy({}, {
      get: (_target, prop) => {
        if (prop === 'createLinearGradient') return () => ({ addColorStop: () => {} });
        if (prop === 'canvas') return { width: 360, height: 640 };
        if (typeof prop === 'string' && /^(fill|stroke|arc|moveTo|lineTo|rect|ellipse|quadraticCurveTo|closePath)/.test(prop)) {
          return () => { calls += 1; };
        }
        return () => undefined;
      },
      set: () => true,
    });
    const renderer = createCanvasRenderer({ width: 360, height: 640, getContext: () => context });
    renderer.resize({ width: 360, height: 640, dpr: 1 });
    renderer.render({ player, platforms: [], sunDrops: [], thorns: [], cameraY: 0, feedback });
    return calls;
  };

  const baseline = drawCount(createFeedbackState());
  const silent = [];
  for (const [pulse, event] of Object.entries(EVENT_BY_PULSE)) {
    const active = stepFeedback(createFeedbackState(), [event], PULSE_SECONDS[pulse] * 0.35, { player });
    if (drawCount(active) <= baseline) silent.push(pulse);
  }
  return {
    ok: silent.length === 0,
    detail: silent.length
      ? `pulsos que não alteram nada em tela: ${silent.join(', ')}`
      : `${Object.keys(EVENT_BY_PULSE).length} pulsos alteram o desenho (base ${baseline} chamadas)`,
  };
});

check('P1-1', 'Trilha musical presente e mute exposto', () => {
  // Sonda de Web Audio: conta osciladores agendados. Provar que o módulo declara
  // uma função de música não basta — o defeito recorrente deste projeto é
  // exatamente declarar e não emitir.
  const probe = () => {
    const started = [];
    class FakeContext {
      constructor() { this.currentTime = 0; this.state = 'running'; this.destination = {}; }
      createOscillator() {
        const node = { type: 'sine', frequency: { setValueAtTime: (value) => { node.hz = value; } }, connect: () => {}, start: () => started.push(node.hz ?? 0), stop: () => {} };
        return node;
      }
      createGain() { return { gain: { setValueAtTime: () => {} }, connect: () => {} }; }
    }
    const store = new Map();
    const windowRef = {
      AudioContext: FakeContext,
      setInterval: () => 1,
      clearInterval: () => {},
      localStorage: { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, v) },
    };
    return { audio: createAudio({ windowRef }), started, store };
  };

  const problems = [];

  // 1. efeitos com camadas, não um bipe
  const layered = probe();
  layered.audio.playEvents(['collectedSun']);
  if (layered.started.length < 2) problems.push(`coleta emite ${layered.started.length} voz, esperado ao menos 2`);

  // 2. música toca e continua tocando
  const music = probe();
  music.audio.startMusic('canopy');
  const afterStart = music.started.length;
  for (let step = 0; step < 6; step += 1) music.audio.stepMusic();
  if (afterStart === 0) problems.push('startMusic não emite som');
  if (music.started.length <= afterStart) problems.push('a música não continua após o primeiro passo');
  if (!music.audio.isMusicRunning()) problems.push('a música não permanece em execução');

  // 3. cada bioma tem escala própria
  const scales = new Set(['canopy', 'dusk', 'crystal', 'storm', 'summit'].map((b) => getBiomeScale(b).join(',')));
  if (scales.size < 5) problems.push(`apenas ${scales.size} escalas distintas para 5 biomas`);

  // 4. mute silencia de fato e é lembrado
  const silence = probe();
  silence.audio.setMuted(true);
  silence.audio.playEvents(['collectedSun', 'summitReached']);
  silence.audio.startMusic('dusk');
  silence.audio.stepMusic();
  if (silence.started.length !== 0) problems.push(`mute não silencia: ${silence.started.length} vozes emitidas`);
  if (!silence.audio.isMuted()) problems.push('mute não fica ativo');
  if (![...silence.store.values()].includes('true')) problems.push('a preferência de som não é persistida');

  // 5. o controle existe na interface
  const html = readFileSafe('index.html') ?? '';
  if (!/data-action="sound"/.test(html)) problems.push('sem controle de som na interface');

  return {
    ok: problems.length === 0,
    detail: problems.length
      ? problems.join('; ')
      : `música em loop por bioma, efeitos com camadas e mute persistido`,
  };
});

check('P1-3', 'Progressão distribuída ao longo da sessão', () => {
  const session = playToExhaustion();
  const okCount = session.milestonesInFirstMinute <= THRESHOLDS.maxMilestonesInFirstMinute;
  const okGap = session.maxRewardGap <= THRESHOLDS.maxRewardGapSeconds;
  return {
    ok: okCount && okGap,
    detail: `${session.milestonesInFirstMinute} marcos no primeiro minuto (máx ${THRESHOLDS.maxMilestonesInFirstMinute}); maior intervalo entre recompensas ${session.maxRewardGap}s (máx ${THRESHOLDS.maxRewardGapSeconds}s); total de marcos ${getMilestones().length}`,
  };
});

check('P1-4', 'Menu, pausa e retomada por perda de foco', () => {
  const html = readFileSafe('index.html') ?? '';
  const sources = ['src/app.js', 'src/input.js', 'src/game/game-loop.js', 'src/ui/screens.js']
    .map((f) => readFileSafe(f) ?? '').join('\n');
  const hasPauseScreen = /id="pause-screen"|id="menu-screen"/.test(html);
  const pausesOnHide = /visibilitychange[\s\S]{0,400}?(pause|loop\.pause|pauseInput)/.test(sources);
  return {
    ok: hasPauseScreen && pausesOnHide,
    detail: `${hasPauseScreen ? 'telas de menu/pausa presentes' : 'sem tela de menu ou pausa'}; ${pausesOnHide ? 'pausa ao perder visibilidade' : 'perder a aba não pausa a partida'}`,
  };
});

check('BIOME-1', 'Cada bioma pinta a tela com a própria paleta', () => {
  const player = { x: 160, y: 320, width: 26, height: 34, grounded: true, dead: false };
  const scene = (biome) => ({
    route: { biome },
    player,
    platforms: [
      { x: 60, y: 300, width: 90, height: 18, kind: 'leaf' },
      { x: 200, y: 220, width: 80, height: 18, kind: 'cracked-leaf' },
      { x: 60, y: 140, width: 80, height: 18, kind: 'moving-leaf' },
      { x: 200, y: 60, width: 80, height: 18, kind: 'thorn-leaf' },
    ],
    sunDrops: [{ x: 180, y: 260, radius: 8 }],
    thorns: [],
    cameraY: 0,
    feedback: {},
  });

  const problems = [];
  const fingerprints = new Map();
  for (const biome of Object.values(BIOMES)) {
    const { colours } = paintProbe(scene(biome.id));
    const declared = ['leaf', 'cracked', 'moving', 'thorn', 'sun', 'leafEdge', 'silhouette'];
    const missing = declared.filter((token) => !colours.has(biome[token]));
    if (missing.length) problems.push(`${biome.id} declara mas não pinta: ${missing.join(', ')}`);
    if (!colours.has(biome.sky[0])) problems.push(`${biome.id} não usa o próprio céu`);
    fingerprints.set(biome.id, [...colours].sort().join('|'));
  }
  if (new Set(fingerprints.values()).size !== fingerprints.size) {
    problems.push('dois biomas produzem exatamente as mesmas cores em tela');
  }
  return {
    ok: problems.length === 0,
    detail: problems.length ? problems.join('; ') : `${fingerprints.size} biomas com pintura distinta e completa`,
  };
});

check('BIOME-2', 'O fundo se move enquanto Pip sobe', () => {
  const base = { route: { biome: 'canopy' }, player: null, platforms: [], sunDrops: [], thorns: [], feedback: {} };
  const heights = [0, -90, -260, -640, -1180];
  const shapes = heights.map((cameraY) => paintProbe({ ...base, cameraY }).geometry);
  const distinct = new Set(shapes);

  // Camadas distintas precisam andar a velocidades distintas, senão é rolagem,
  // não paralaxe. Um passo curto de câmera já deve mover o fundo.
  const movedOnShortStep = shapes[0] !== shapes[1];
  const ok = distinct.size === heights.length && movedOnShortStep;
  return {
    ok,
    detail: ok
      ? `a silhueta de fundo é diferente em ${distinct.size} alturas distintas`
      : `${heights.length - distinct.size + 1} alturas desenham o mesmo fundo: a paralaxe não chega à tela`,
  };
});

check('DESKTOP-1', 'A janela inteira é mundo do jogo', () => {
  // O jogo ocupava 31% da largura no desktop, com faixa vazia e uma barra de
  // texto ao lado. O que importa não é a coluna jogável ser larga, é não sobrar
  // vazio: o fundo precisa cobrir a viewport em qualquer proporção.
  const cover = (width, height) => {
    let painted = null;
    const context = new Proxy({}, {
      get: (_t, prop) => {
        if (prop === 'createLinearGradient') return () => ({ addColorStop: () => {} });
        if (prop === 'fillRect') return (x, y, w, h) => { if (w >= width && h >= height) painted = { x, y, w, h }; };
        if (typeof prop === 'string') return () => undefined;
        return () => undefined;
      },
      set: () => true,
    });
    const backdrop = createBackdropRenderer({ getContext: () => context });
    backdrop.resize({ width, height, dpr: 1 });
    backdrop.render({ route: { biome: 'canopy' }, cameraY: -400 });
    return painted;
  };

  const problems = [];
  for (const [width, height] of [[1280, 720], [1920, 1080], [907, 510], [375, 812]]) {
    const painted = cover(width, height);
    if (!painted) problems.push(`${width}x${height} não é coberto pelo fundo`);
    else if (painted.x > 0 || painted.y > 0) problems.push(`${width}x${height} deixa faixa em ${painted.x},${painted.y}`);
  }
  const html = readFileSafe('index.html') ?? '';
  if (!/id="backdrop-canvas"/.test(html)) problems.push('sem canvas de fundo na marcação');
  if (/id="desktop-guide"/.test(html)) problems.push('a barra de texto lateral ainda ocupa o espaço');

  return {
    ok: problems.length === 0,
    detail: problems.length ? problems.join('; ') : 'fundo cobre a viewport em 4 proporções, sem faixa vazia',
  };
});

check('WRAP-1', 'A borda lateral atravessa em vez de bloquear', () => {
  const stage = 360;
  const width = 26;
  const problems = [];

  // continuidade: nenhum salto entre passos vizinhos
  let previous = wrapX(-width, width, stage);
  for (let x = -width; x < stage + width; x += 1) {
    const current = wrapX(x, width, stage);
    const jump = Math.abs(current - previous);
    if (jump > 1 && Math.abs(jump - stage) > 1) { problems.push(`salto de ${jump.toFixed(1)}px em x=${x}`); break; }
    previous = current;
  }

  // a cópia da borda precisa colidir, não só aparecer
  const straddling = { x: -13, y: 100, width, height: 34 };
  const leafOnFarEdge = { x: 340, y: 100, width: 20, height: 18 };
  const ghosts = playerGhosts(straddling, stage);
  if (ghosts.length !== 2) problems.push('atravessando a borda Pip não existe dos dois lados');
  if (!ghosts.some((ghost) => rectsOverlap(ghost, leafOnFarEdge))) {
    problems.push('a cópia da borda não colide: envoltória que desenha e não colide é pior que a parede');
  }

  return {
    ok: problems.length === 0,
    detail: problems.length ? problems.join('; ') : 'travessia contínua e colidindo dos dois lados',
  };
});

check('MEDIA-1', 'Capas nos três formatos exigidos', () => {
  const problems = [];
  for (const format of THRESHOLDS.coverFormats) {
    const file = path.join(ROOT, 'media', 'covers', `sproutbound-${format.id}.png`);
    if (!fs.existsSync(file)) { problems.push(`${format.id} ausente`); continue; }
    const size = pngSize(fs.readFileSync(file));
    if (!size) { problems.push(`${format.id} não é PNG`); continue; }
    if (size.width !== format.width || size.height !== format.height) {
      problems.push(`${format.id} é ${size.width}x${size.height}, exigido ${format.width}x${format.height}`);
    }
  }
  return { ok: problems.length === 0, detail: problems.length ? problems.join('; ') : 'três capas nas dimensões exigidas' };
});

check('P0-4', 'Vídeos de preview dentro da especificação', () => {
  const wanted = [
    { id: 'landscape', minWidth: 1920, minHeight: 1080 },
    { id: 'portrait', minWidth: 1080, minHeight: 1620 },
  ];
  const problems = [];

  // Arquivo antigo fora de especificação não pode sobrar na pasta: foi assim que
  // a segunda submissão enviou um preview pior que o da primeira.
  const dir = path.join(ROOT, 'media', 'videos');
  const esperados = new Set(wanted.map((item) => `sproutbound-${item.id}-preview.mp4`));
  if (fs.existsSync(dir)) {
    for (const file of fs.readdirSync(dir)) {
      if (/preview/i.test(file) && !esperados.has(file)) {
        problems.push(`arquivo antigo na pasta: ${file}, remova para não enviar por engano`);
      }
    }
  }

  for (const item of wanted) {
    const candidates = ['media/videos/sproutbound-' + item.id + '-preview.mp4'];
    const found = candidates.map((c) => path.join(ROOT, c)).find((f) => fs.existsSync(f));
    if (!found) { problems.push(`${item.id}: nenhum vídeo encontrado`); continue; }
    const buffer = fs.readFileSync(found);
    const info = mp4Info(buffer);
    const name = path.basename(found);
    if (info.seconds === null || info.seconds < THRESHOLDS.video.minSeconds || info.seconds > THRESHOLDS.video.maxSeconds) {
      problems.push(`${name}: ${info.seconds}s, exigido ${THRESHOLDS.video.minSeconds}-${THRESHOLDS.video.maxSeconds}s`);
    }
    if (info.width === null || info.width < item.minWidth || info.height < item.minHeight) {
      problems.push(`${name}: ${info.width}x${info.height}, exigido ${item.minWidth}x${item.minHeight}`);
    }
    if (info.hasAudio) problems.push(`${name}: contém faixa de áudio, o portal exige sem som`);
    if (buffer.length > THRESHOLDS.video.maxBytes) problems.push(`${name}: acima de 50 MB`);
  }
  return { ok: problems.length === 0, detail: problems.length ? problems.join('; ') : 'dois vídeos dentro da especificação' };
});

check('PORTAL-1', 'Sem branding de outro portal no runtime', () => {
  const runtime = ['index.html', 'styles.css', 'src/app.js', 'src/main.js', 'src/platform-adapter.js']
    .map((f) => `${f}\n${readFileSafe(f) ?? ''}`).join('\n');
  const hits = ['poki', 'gamedistribution', 'gd_options', 'gamepix', 'kongregate', 'armorgames']
    .filter((portal) => new RegExp(portal, 'i').test(runtime));
  return { ok: hits.length === 0, detail: hits.length ? `portais citados no runtime: ${hits.join(', ')}` : 'runtime neutro' };
});

check('MANUAL', 'Evidência manual registrada para o commit atual', () => {
  const commit = currentCommit();
  if (!fs.existsSync(MANUAL_LOG)) {
    return { ok: false, detail: `docs/gate-manual-evidence.json ausente; itens que exigem pessoa: ${THRESHOLDS.manualItems.join(', ')}` };
  }
  let log;
  try { log = JSON.parse(fs.readFileSync(MANUAL_LOG, 'utf8')); } catch { return { ok: false, detail: 'gate-manual-evidence.json inválido' }; }
  const problems = [];
  for (const item of THRESHOLDS.manualItems) {
    const entry = log[item];
    if (!entry) { problems.push(`${item}: não registrado`); continue; }
    if (!entry.pass) { problems.push(`${item}: registrado como reprovado`); continue; }
    if (!entry.date || !entry.browser || !entry.commit) { problems.push(`${item}: registro incompleto, exige date, browser e commit`); continue; }
    if (commit && entry.commit !== commit) problems.push(`${item}: registrado no commit ${entry.commit.slice(0, 7)}, atual é ${commit.slice(0, 7)}`);
  }
  return { ok: problems.length === 0, detail: problems.length ? problems.join('; ') : `${THRESHOLDS.manualItems.length} itens manuais registrados para este commit` };
});

// ---------------------------------------------------------------------- saída

export function runGate() {
  return checks.map(({ id, title, run }) => {
    try {
      return { id, title, ...run() };
    } catch (error) {
      return { id, title, ok: false, detail: `erro ao avaliar: ${error.message}` };
    }
  });
}

function cli() {
  const results = runGate();
  const width = Math.max(...results.map((r) => r.title.length));
  const lines = ['', 'Release Gate CrazyGames — Sproutbound', ''];
  for (const result of results) {
    lines.push(`  ${result.ok ? 'PASSA' : 'FALHA'}  ${result.id.padEnd(8)} ${result.title.padEnd(width)}  ${result.detail}`);
  }
  const failed = results.filter((r) => !r.ok);
  lines.push('');
  lines.push(failed.length
    ? `  ${failed.length} de ${results.length} itens em aberto. SUBMISSÃO BLOQUEADA.`
    : `  ${results.length} de ${results.length} itens fechados. Submissão liberada.`);
  lines.push('');
  process.stdout.write(lines.join('\n'));
  process.exitCode = failed.length ? 1 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) cli();
