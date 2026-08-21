import { createPlatform } from './model.js';

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

export function createWorld(seed = 1, { width = 360, height = 640 } = {}) {
  const random = createRandom(seed);
  const entities = [];
  const platformCount = Math.max(4, Math.ceil(height / 96) + 2);
  const firstY = height - 64;
  let previousX = width / 2 - 48;
  let previousWidth = 96;
  let currentY = firstY;

  for (let index = 0; index < platformCount; index += 1) {
    const platformWidth = index === 0 ? previousWidth : 76 + Math.floor(random() * 37);
    const y = currentY;
    const drift = index === 0
      ? 0
      : (random() * 2 - 1) * (index <= 2 ? 30 : 90);
    const x = index === 0
      ? previousX
      : clamp(previousX + drift, 0, width - platformWidth);
    const platform = createPlatform({ x, y, width: platformWidth });

    entities.push({ type: 'platform', ...platform });
    previousX = x;
    previousWidth = platformWidth;
    currentY -= index < 3 ? 72 : 84;

    if (index >= 2 && index % 3 === 0) {
      entities.push({
        type: 'sun',
        x: x + platformWidth / 2,
        y: y - 30,
        radius: 8,
        kind: 'sun',
      });
    }

    if (height > 640 && index >= 4 && index % 3 === 0) {
      entities.push({
        type: 'thorn',
        x: clamp(x + platformWidth - 24, 0, width - 22),
        y: y - 18,
        width: 22,
        height: 18,
        kind: 'thorn',
      });
    }
  }

  return entities;
}
