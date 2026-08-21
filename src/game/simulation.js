import { PLAYER_BOUNCE, rectsOverlap, stepPlayer } from './player.js';

const WORLD_BOUNDS = { width: 360, height: 640 };

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
  let score = run.score;
  const events = [];

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
      score += 1;
      events.push('landed');
    }
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
    player: nextPlayer,
  };

  if (died) {
    events.push('playerDied');
  }

  return { run: nextRun, events };
}
