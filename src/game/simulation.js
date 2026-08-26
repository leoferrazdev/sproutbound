import { PLAYER_BOUNCE, rectsOverlap, stepPlayer } from './player.js';

const WORLD_BOUNDS = { width: 360, height: 640 };
export const HEIGHT_PIXELS_PER_METER = 12;
export const CRACKED_LEAF_COLLAPSE_SECONDS = 0.45;
export const FIXED_LEAF_IMPACT_SECONDS = 0.18;
export const SOLAR_SHIELD_CHARGE = 5;

function circleOverlapsRect(circle, rect) {
  const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
  const distanceX = circle.x - closestX;
  const distanceY = circle.y - closestY;
  return distanceX * distanceX + distanceY * distanceY <= circle.radius * circle.radius;
}

function advanceMovingEntity(entity, safeDt) {
  if (!Number.isFinite(entity.motionSpeed)) return entity;

  const motionPhase = (entity.motionPhase ?? 0) + entity.motionSpeed * safeDt;
  const baseX = entity.baseX ?? entity.x;
  const rawX = baseX + Math.sin(motionPhase) * (entity.motionRange ?? 0);
  const halfSize = entity.radius ?? 0;
  const minX = halfSize;
  const maxX = Number.isFinite(entity.width)
    ? WORLD_BOUNDS.width - entity.width
    : WORLD_BOUNDS.width - halfSize;

  return {
    ...entity,
    x: Math.max(minX, Math.min(maxX, rawX)),
    motionPhase,
  };
}

function advancePlatforms(platforms, dt) {
  const safeDt = Math.min(Math.max(dt, 0), 1 / 30);
  const events = [];
  const nextPlatforms = platforms.map((platform) => {
    let moved = platform.kind === 'moving-leaf'
      ? advanceMovingEntity(platform, safeDt)
      : platform;
    if (moved.impactTime > 0) {
      moved = {
        ...moved,
        impactTime: Math.max(0, moved.impactTime - safeDt),
      };
    }
    if (!moved.collapsing) return moved;

    const collapseTime = Math.max(0, moved.collapseTime - safeDt);
    if (collapseTime > 0) {
      return { ...moved, collapseTime };
    }

    events.push('platformCollapsed');
    return {
      ...moved,
      collapsing: false,
      collapsed: true,
      collapseTime: 0,
    };
  });

  return { platforms: nextPlatforms, events };
}

function advanceSunDrops(sunDrops, dt) {
  const safeDt = Math.min(Math.max(dt, 0), 1 / 30);
  return sunDrops.map((sun) => advanceMovingEntity(sun, safeDt));
}

export function stepRun(run, input = {}, dt) {
  if (run.player.dead) {
    return { run, events: [] };
  }

  if (run.state === 'summit') {
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
  const platformState = advancePlatforms(run.platforms ?? [], dt);
  let platforms = platformState.platforms;
  const sunState = advanceSunDrops(run.sunDrops ?? [], dt);
  let score = run.score ?? 0;
  const startY = Number.isFinite(run.startY) ? run.startY : previousPlayer.y;
  let sunCount = run.sunCount ?? 0;
  let sunDrops = sunState;
  let solar = {
    collected: run.solar?.collected ?? sunCount,
    charge: Math.max(0, run.solar?.charge ?? 0),
    shieldAvailable: Boolean(run.solar?.shieldAvailable),
    shieldUsed: Boolean(run.solar?.shieldUsed),
  };
  const nextUnlock = run.nextUnlock ?? null;
  const events = [...platformState.events];
  if (started) events.push('gameplayStarted');
  const hazardPlatform = platforms.find((platform) => (
    platform.kind === 'thorn-leaf' && rectsOverlap(player, platform)
  ));
  const hitHazardPlatform = Boolean(hazardPlatform);
  if (hitHazardPlatform) events.push('hazardHit');

  if (!hitHazardPlatform && run.state !== 'ready' && player.vy > 0) {
    const previousBottom = previousPlayer.y + previousPlayer.height;
    const currentBottom = player.y + player.height;
    const platform = platforms.find((candidate) => {
      if (candidate.collapsing || candidate.collapsed) return false;
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

      if (platform.kind === 'cracked-leaf') {
        platforms = platforms.map((candidate) => candidate === platform
          ? {
            ...candidate,
            collapsing: true,
            collapsed: false,
            collapseTime: CRACKED_LEAF_COLLAPSE_SECONDS,
          }
          : candidate);
        events.push('platformTriggered');
      } else if (platform.kind === 'leaf') {
        platforms = platforms.map((candidate) => candidate === platform
          ? { ...candidate, impactTime: FIXED_LEAF_IMPACT_SECONDS }
          : candidate);
        events.push('platformImpact');
      }
    }
  }

  const measuredHeight = Math.floor(Math.max(0, (startY - player.y) / HEIGHT_PIXELS_PER_METER));
  score = Math.max(score, measuredHeight);

  const collectedSunDrops = sunDrops.filter((sun) => circleOverlapsRect(sun, player));
  if (collectedSunDrops.length > 0) {
    const collectedAmount = collectedSunDrops.length;
    sunCount += collectedAmount;
    solar = {
      ...solar,
      collected: solar.collected + collectedAmount,
    };
    if (!solar.shieldAvailable) {
      const charge = solar.charge + collectedAmount;
      const shieldReady = charge >= SOLAR_SHIELD_CHARGE;
      solar = {
        ...solar,
        charge: shieldReady ? 0 : charge,
        shieldAvailable: shieldReady,
        shieldUsed: shieldReady ? false : solar.shieldUsed,
      };
      if (shieldReady) events.push('solarShieldReady');
    }
    const collected = new Set(collectedSunDrops);
    sunDrops = sunDrops.filter((sun) => !collected.has(sun));
    events.push('collectedSun');
  }

  const reachedSummit = !run.summitReached
    && Number.isFinite(run.summitHeight)
    && score >= run.summitHeight;
  if (reachedSummit) events.push('summitReached');

  const hitThorn = run.thorns.some((thorn) => rectsOverlap(player, thorn));
  const fell = player.y > (run.cameraY ?? 0) + 740;
  const hazardCollision = hitHazardPlatform || hitThorn;
  const shieldBlockedHazard = hazardCollision && solar.shieldAvailable;
  if (shieldBlockedHazard) {
    solar = {
      ...solar,
      shieldAvailable: false,
      shieldUsed: true,
    };
    player = {
      ...player,
      y: hazardPlatform ? hazardPlatform.y - player.height : player.y,
      vy: PLAYER_BOUNCE,
      grounded: false,
    };
    events.push('solarShieldUsed');
  }
  const died = (hazardCollision && !shieldBlockedHazard) || fell;
  const nextPlayer = died ? { ...player, dead: true, grounded: false } : player;
  const nextRun = {
    ...run,
    state: died ? 'gameOver' : (reachedSummit ? 'summit' : (started ? 'playing' : run.state)),
    score,
    bestScore: Math.max(run.bestScore ?? 0, score),
    startY,
    summitReached: Boolean(run.summitReached || reachedSummit),
    sunCount,
    solar,
    sunDrops,
    platforms,
    player: nextPlayer,
    nextUnlock,
  };

  if (died) {
    events.push('playerDied');
  }

  return { run: nextRun, events };
}
