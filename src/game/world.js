import { createPlatform } from './model.js';
import { PLAYER_BOUNCE, PLAYER_GRAVITY, PLAYER_MAX_SPEED, PLAYER_ACCELERATION } from './player.js';
import { STAGE_WIDTH, STAGE_HEIGHT } from './stage.js';

const ROW_RISE = 87.5;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// Quanto Pip consegue corrigir lateralmente entre uma folha e a próxima, derivado
// das constantes de física em vez de arbitrado. Com salto de 420 e gravidade de
// 950, o ápice sobe 92,8 px contra 87,5 px de espaçamento: a janela para alcançar
// a linha seguinte é de 0,336 s. Gerar deriva acima disso produz rota invencível
// mesmo para um jogador perfeito.
export function getLateralReach() {
  const launch = Math.abs(PLAYER_BOUNCE);
  const discriminant = launch * launch - 2 * PLAYER_GRAVITY * ROW_RISE;
  if (discriminant <= 0) return PLAYER_MAX_SPEED * 0.3;
  const time = (launch - Math.sqrt(discriminant)) / PLAYER_GRAVITY;
  const rampTime = Math.min(time, PLAYER_MAX_SPEED / PLAYER_ACCELERATION);
  const ramped = 0.5 * PLAYER_ACCELERATION * rampTime * rampTime;
  const cruising = Math.max(0, time - rampTime) * PLAYER_MAX_SPEED;
  return ramped + cruising;
}

// Frações da folga alcançável, não valores absolutos: se a física mudar, a rota
// acompanha sozinha.
const ROUTE_SEGMENTS = [
  { id: 'intro', label: 'Safe canopy', until: 30, reach: 0.35 },
  { id: 'risk', label: 'First hazards', until: 90, reach: 0.62 },
  { id: 'variation', label: 'Moving canopy', until: 180, reach: 0.82 },
  { id: 'summit', label: 'Summit push', until: Infinity, reach: 0.94 },
];

// Alcance quando Pip já chega com velocidade lateral acumulada, que é o caso
// normal em sequência. getLateralReach é o piso garantido, partindo parado.
export function getCarriedReach() {
  const launch = Math.abs(PLAYER_BOUNCE);
  const discriminant = launch * launch - 2 * PLAYER_GRAVITY * ROW_RISE;
  if (discriminant <= 0) return getLateralReach();
  const time = (launch - Math.sqrt(discriminant)) / PLAYER_GRAVITY;
  return time * PLAYER_MAX_SPEED;
}

export function getSegmentMaxGap(segment, reachScale = null) {
  const fraction = Number.isFinite(reachScale) ? reachScale : (segment?.reach ?? 0.35);
  return Math.round(getCarriedReach() * Math.max(0.1, Math.min(1, fraction)));
}

// Garantia, não calibração: a linha seguinte da rota é puxada para dentro do
// alcance real, descontando o quanto uma folha móvel pode se afastar. Calibrar
// frações por tentativa deixa sementes invencíveis passarem; isto não deixa.
export function constrainRouteX({
  previousCentre,
  candidateX,
  width,
  stageWidth = STAGE_WIDTH,
  motionRange = 0,
  segment,
  reachScale = null,
}) {
  const budget = Math.max(8, getSegmentMaxGap(segment, reachScale) - motionRange);
  const candidateCentre = candidateX + width / 2;
  const centre = clamp(candidateCentre, previousCentre - budget, previousCentre + budget);
  return clamp(centre - width / 2, 0, stageWidth - width);
}

function createRandom(seed) {
  let value = (Math.abs(Math.trunc(seed)) % 2147483647) || 1;

  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

export function getRouteSegment(altitudeMeters = 0) {
  const safeAltitude = Math.max(0, Number.isFinite(altitudeMeters) ? altitudeMeters : 0);
  return ROUTE_SEGMENTS.find((segment) => safeAltitude < segment.until) ?? ROUTE_SEGMENTS.at(-1);
}

export function createWorld(seed = 1, {
  width = STAGE_WIDTH,
  height = STAGE_HEIGHT,
  platformCount,
  reachScale = null,
  hazards = null,
} = {}) {
  // hazards nulo mantém o comportamento anterior; uma receita de rota liga e
  // desliga cada tipo de folha especial, que é o que dá identidade a cada fase.
  const allow = hazards ?? { cracked: true, moving: true, thorn: true };
  const random = createRandom(seed);
  const entities = [];
  const defaultPlatformCount = Math.max(4, Math.ceil(height / 96) + 2);
  const totalPlatforms = Number.isInteger(platformCount)
    ? Math.max(defaultPlatformCount, platformCount)
    : defaultPlatformCount;
  const extendedWorld = totalPlatforms > defaultPlatformCount;
  const firstY = height - 64;
  let previousX = width / 2 - 48;
  let previousWidth = 96;
  let previousCentre = previousX + previousWidth / 2;
  let currentY = firstY;

  for (let index = 0; index < totalPlatforms; index += 1) {
    const platformWidth = index === 0 ? previousWidth : 76 + Math.floor(random() * 37);
    const y = currentY;
    const altitudeMeters = Math.floor((firstY - y) / 12);
    const routeSegment = getRouteSegment(altitudeMeters);
    const drift = index === 0
      ? 0
      : (random() * 2 - 1) * (index <= 2 ? 24 : getSegmentMaxGap(routeSegment, reachScale));
    const x = index === 0
      ? previousX
      : constrainRouteX({
        previousCentre,
        candidateX: previousX + drift,
        width: platformWidth,
        stageWidth: width,
        segment: routeSegment,
        reachScale,
      });
    const platform = {
      ...createPlatform({ x, y, width: platformWidth }),
      segment: routeSegment.id,
    };
    let routeX = x;
    let routeWidth = platformWidth;
    const hazardRow = extendedWorld && altitudeMeters >= 30
      && index >= 8 && index % 6 === 4;

    if (extendedWorld && routeSegment.id !== 'intro') {
      const specialWidth = routeSegment.id === 'risk'
        ? 78 + Math.floor(random() * 17)
        : 70 + Math.floor(random() * 21);

      if (hazardRow && allow.thorn) {
        entities.push({ type: 'platform', row: index, ...platform });
        const specialX = x < width / 2
          ? clamp(x + platformWidth + 18, 0, width - specialWidth)
          : clamp(x - specialWidth - 18, 0, width - specialWidth);
        entities.push({
          type: 'platform',
          row: index,
          ...createPlatform({ x: specialX, y, width: specialWidth, kind: 'thorn-leaf' }),
          segment: routeSegment.id,
        });
      } else if (index % 2 !== 0 && allow.moving) {
        const motionRange = 24 + Math.floor(random() * 12);
        const movingX = constrainRouteX({
          previousCentre,
          candidateX: x,
          width: specialWidth,
          stageWidth: width,
          motionRange,
          segment: routeSegment,
          reachScale,
        });
        const special = createPlatform({
          x: movingX,
          y,
          width: specialWidth,
          kind: 'moving-leaf',
        });
        entities.push({
          type: 'platform',
          row: index,
          ...special,
          segment: routeSegment.id,
          baseX: movingX,
          motionRange,
          motionPhase: random() * Math.PI * 2,
          motionSpeed: 1.1 + random() * 0.5,
        });
        routeX = movingX;
        routeWidth = specialWidth;
      } else if (allow.cracked) {
        entities.push({ type: 'platform', row: index, ...platform });
        const specialX = x < width / 2
          ? clamp(x + platformWidth + 18, 0, width - specialWidth)
          : clamp(x - specialWidth - 18, 0, width - specialWidth);
        entities.push({
          type: 'platform',
          row: index,
          ...createPlatform({ x: specialX, y, width: specialWidth, kind: 'cracked-leaf' }),
          segment: routeSegment.id,
        });
      } else {
        entities.push({ type: 'platform', row: index, ...platform });
      }
    } else {
      entities.push({ type: 'platform', row: index, ...platform });
    }

    previousX = routeX;
    previousWidth = routeWidth;
    previousCentre = routeX + routeWidth / 2;
    currentY -= index < 3 ? 72 : 87.5;

    if (index >= 2 && index % 3 === 0) {
      const sun = {
        type: 'sun',
        x: routeX + routeWidth / 2,
        y: y - 30,
        radius: 8,
        kind: 'sun',
        segment: routeSegment.id,
      };

      if (extendedWorld && routeSegment.id !== 'intro') {
        sun.baseX = sun.x;
        sun.motionRange = 16 + Math.floor(random() * 10);
        sun.motionPhase = random() * Math.PI * 2;
        sun.motionSpeed = 1.25 + random() * 0.45;
      }

      entities.push(sun);
    }

  }

  return entities;
}
