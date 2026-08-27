export const PLAYER_GRAVITY = 950;
export const PLAYER_BOUNCE = -420;
export const PLAYER_MAX_SPEED = 150;

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

export function rectsOverlap(a, b) {
  return a.x < b.x + b.width
    && a.x + a.width > b.x
    && a.y < b.y + b.height
    && a.y + a.height > b.y;
}

export function stepPlayer(player, input = {}, dt, bounds) {
  const safeDt = Math.min(Math.max(dt, 0), 1 / 30);
  const direction = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  let vx = player.vx + direction * 720 * safeDt;

  if (direction === 0) {
    vx *= Math.pow(0.001, safeDt);
  }

  vx = Math.max(-PLAYER_MAX_SPEED, Math.min(PLAYER_MAX_SPEED, vx));
  const vy = player.vy + PLAYER_GRAVITY * safeDt;
  const x = Math.max(0, Math.min(bounds.width - player.width, player.x + vx * safeDt));

  return {
    ...player,
    x,
    y: player.y + vy * safeDt,
    vx,
    vy,
    grounded: false,
  };
}
