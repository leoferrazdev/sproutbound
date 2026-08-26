import { STAGE_WIDTH } from './stage.js';

export const PLAYER_GRAVITY = 950;
export const PLAYER_BOUNCE = -420;
export const PLAYER_MAX_SPEED = 150;
export const PLAYER_ACCELERATION = 720;

export function createPlayer({ x, y }) {
  return {
    x,
    y,
    vx: 0,
    vy: 0,
    width: 26,
    height: 34,
    grounded: true,
    dead: false,
  };
}

// Cópias do jogador que existem em tela ao mesmo tempo. Quando Pip atravessa a
// borda ele aparece dos dois lados, e precisa colidir dos dois lados: envoltória
// que desenha mas não colide é injustiça pior que a parede que ela substituiu.
export function playerGhosts(player, stageWidth = STAGE_WIDTH) {
  const width = player.width ?? 0;
  const ghosts = [player];
  if (player.x < 0) ghosts.push({ ...player, x: player.x + stageWidth });
  else if (player.x + width > stageWidth) ghosts.push({ ...player, x: player.x - stageWidth });
  return ghosts;
}

export function rectsOverlap(a, b) {
  return a.x < b.x + b.width
    && a.x + a.width > b.x
    && a.y < b.y + b.height
    && a.y + a.height > b.y;
}

// Envoltória lateral. O gênero espera atravessar a borda e reentrar do outro
// lado; travar numa parede invisível transforma correção lateral em colisão
// morta. Também encurta a distância real entre duas folhas afastadas, porque
// dar a volta pode ser o caminho curto.
// O palco é um cilindro de circunferência stageWidth. A referência é o CENTRO de
// Pip: assim ele nunca fica invisível dos dois lados ao mesmo tempo, e a cópia da
// borda cai exatamente onde a outra metade dele aparece.
export function wrapX(x, width, stageWidth) {
  const half = (width ?? 0) / 2;
  const centre = x + half;
  const wrapped = ((centre % stageWidth) + stageWidth) % stageWidth;
  return wrapped - half;
}

// Distância lateral considerando a envoltória: usada para saber o quanto Pip
// realmente precisa percorrer entre dois pontos.
export function wrappedDistance(from, to, stageWidth) {
  const direct = Math.abs(to - from);
  return Math.min(direct, stageWidth - direct);
}

export function stepPlayer(player, input = {}, dt, bounds) {
  const safeDt = Math.min(Math.max(dt, 0), 1 / 30);
  const direction = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  let vx = player.vx + direction * PLAYER_ACCELERATION * safeDt;

  if (direction === 0) {
    vx *= Math.pow(0.001, safeDt);
  }

  vx = Math.max(-PLAYER_MAX_SPEED, Math.min(PLAYER_MAX_SPEED, vx));
  const vy = player.vy + PLAYER_GRAVITY * safeDt;
  const x = wrapX(player.x + vx * safeDt, player.width, bounds.width);

  return {
    ...player,
    x,
    y: player.y + vy * safeDt,
    vx,
    vy,
    grounded: false,
  };
}
