import { PLAYER_BOUNCE, rectsOverlap, stepPlayer } from './player.js';
import { getMilestone } from './progression.js';

const WORLD_BOUNDS = { width: 360, height: 640 };
export const HEIGHT_PIXELS_PER_METER = 12;

function circleOverlapsRect(circle, rect) {
  const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
  const distanceX = circle.x - closestX;
  const distanceY = circle.y - closestY;
  return distanceX * distanceX + distanceY * distanceY <= circle.radius * circle.radius;
}

export function stepRun(run, input = {}, dt) {
  if (run.player.dead) {
    return { run, events: [] };
  }

  if (run.state === 'ready' && !input.primary) {
    return { run, events: [] };
  }

  const previousPlayer = run.player;
  const started = run.state === 'ready' && input.primary;
  const startingPlayer = started
    ? { ...previousPlayer, grounded: false, vy: PLAYER_BOUNCE }
    : previousPlayer;
  let player = stepPlayer(startingPlayer, input, dt, WORLD_BOUNDS);
  let score = run.score ?? 0;
  const startY = Number.isFinite(run.startY) ? run.startY : previousPlayer.y;
  let sunCount = run.sunCount ?? 0;
  let sunDrops = run.sunDrops ?? [];
  let nextUnlock = run.nextUnlock ?? getMilestone(score);
  const events = started ? ['gameplayStarted'] : [];

  if (run.state !== 'ready' && player.vy > 0) {
    const previousBottom = previousPlayer.y + previousPlayer.height;
    const currentBottom = player.y + player.height;
    const platform = run.platforms.find((candidate) => {
      const horizontallyAligned = player.x < candidate.x + candidate.width
        && player.x + player.width > candidate.x;
      return horizontallyAligned
        && previousBottom <= candidate.y
        && currentBottom >= candidate.y;
    });

    if (platform) {
      player = {
        ...player,
        y: platform.y - player.height,
        vy: PLAYER_BOUNCE,
        grounded: false,
      };
      events.push('landed');
    }
  }

  const measuredHeight = Math.floor(Math.max(0, (startY - player.y) / HEIGHT_PIXELS_PER_METER));
  score = Math.max(score, measuredHeight);

  const collectedSunDrops = sunDrops.filter((sun) => circleOverlapsRect(sun, player));
  if (collectedSunDrops.length > 0) {
    sunCount += collectedSunDrops.length;
    const collected = new Set(collectedSunDrops);
    sunDrops = sunDrops.filter((sun) => !collected.has(sun));
    events.push('collectedSun');
  }

  if (nextUnlock && score >= nextUnlock.height) {
    events.push('milestoneReached');
    nextUnlock = getMilestone(score);
  }

  const hitThorn = run.thorns.some((thorn) => rectsOverlap(player, thorn));
  const fell = player.y > (run.cameraY ?? 0) + 740;
  const died = hitThorn || fell;
  const nextPlayer = died ? { ...player, dead: true, grounded: false } : player;
  const nextRun = {
    ...run,
    state: died ? 'gameOver' : (started ? 'playing' : run.state),
    score,
    bestScore: Math.max(run.bestScore ?? 0, score),
    startY,
    sunCount,
    sunDrops,
    player: nextPlayer,
    nextUnlock,
  };

  if (died) {
    events.push('playerDied');
  }

  return { run: nextRun, events };
}
