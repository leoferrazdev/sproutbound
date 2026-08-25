import { createPlatform } from './model.js';

const ROUTE_SEGMENTS = [
  { id: 'intro', label: 'Safe canopy', until: 30, maxGap: 34 },
  { id: 'risk', label: 'First hazards', until: 90, maxGap: 56 },
  { id: 'variation', label: 'Moving canopy', until: 180, maxGap: 70 },
  { id: 'summit', label: 'Summit push', until: Infinity, maxGap: 78 },
];

function createRandom(seed) {
  let value = (Math.abs(Math.trunc(seed)) % 2147483647) || 1;

  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function getRouteSegment(altitudeMeters = 0) {
  const safeAltitude = Math.max(0, Number.isFinite(altitudeMeters) ? altitudeMeters : 0);
  return ROUTE_SEGMENTS.find((segment) => safeAltitude < segment.until) ?? ROUTE_SEGMENTS.at(-1);
}

export function createWorld(seed = 1, {
  width = 360,
  height = 640,
  platformCount,
} = {}) {
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
  let currentY = firstY;

  for (let index = 0; index < totalPlatforms; index += 1) {
    const platformWidth = index === 0 ? previousWidth : 76 + Math.floor(random() * 37);
    const y = currentY;
    const altitudeMeters = Math.floor((firstY - y) / 12);
    const routeSegment = getRouteSegment(altitudeMeters);
    const drift = index === 0
      ? 0
      : (random() * 2 - 1) * (index <= 2 ? 30 : routeSegment.maxGap);
    const x = index === 0
      ? previousX
      : clamp(previousX + drift, 0, width - platformWidth);
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

      if (hazardRow) {
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
      } else if (index % 2 !== 0) {
        const movingX = clamp(x, 0, width - specialWidth);
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
          motionRange: 24 + Math.floor(random() * 12),
          motionPhase: random() * Math.PI * 2,
          motionSpeed: 1.1 + random() * 0.5,
        });
        routeX = movingX;
        routeWidth = specialWidth;
      } else {
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
      }
    } else {
      entities.push({ type: 'platform', row: index, ...platform });
    }

    previousX = routeX;
    previousWidth = routeWidth;
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
