import { PULSE_SECONDS, pulseProgress } from '../game/feedback.js';

const LOGICAL_WIDTH = 360;
const LOGICAL_HEIGHT = 640;
const CRACKED_LEAF_COLLAPSE_SECONDS = 0.45;
const FIXED_LEAF_IMPACT_SECONDS = 0.18;

function drawLeaf(ctx, platform, cameraY) {
  const x = platform.x;
  if (platform.collapsed) return;

  const isCracked = platform.kind === 'cracked-leaf';
  const isMoving = platform.kind === 'moving-leaf';
  const isThornLeaf = platform.kind === 'thorn-leaf';
  const collapseProgress = isCracked && platform.collapsing
    ? Math.max(0, Math.min(1, 1 - platform.collapseTime / CRACKED_LEAF_COLLAPSE_SECONDS))
    : 0;
  const wobble = isCracked && platform.collapsing
    ? Math.sin(collapseProgress * Math.PI * 5) * (1 - collapseProgress) * 3
    : 0;
  const drop = isCracked && platform.collapsing ? collapseProgress ** 2 * 26 : 0;
  const impactProgress = platform.kind === 'leaf' && platform.impactTime > 0
    ? 1 - platform.impactTime / FIXED_LEAF_IMPACT_SECONDS
    : 0;
  const impactOffset = Math.sin(Math.max(0, Math.min(1, impactProgress)) * Math.PI) * 5;
  const y = platform.y - cameraY + wobble + drop + impactOffset;
  const w = platform.width;
  const h = platform.height;

  ctx.save();
  if (isCracked && platform.collapsing) ctx.globalAlpha = 1 - collapseProgress * 0.72;
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.quadraticCurveTo(x + w * 0.08, y, x + w * 0.48, y);
  ctx.quadraticCurveTo(x + w * 0.88, y, x + w, y + h);
  ctx.quadraticCurveTo(x + w * 0.52, y + h + 9, x, y + h);
  ctx.closePath();
  ctx.fillStyle = isCracked
    ? '#4f8f68'
    : (isThornLeaf ? '#536b57' : (isMoving ? '#65c9a6' : '#79df8c'));
  ctx.fill();
  ctx.strokeStyle = isCracked
    ? '#a6d47e'
    : (isThornLeaf ? '#d2e58b' : (isMoving ? '#b6f5d0' : '#d5ff9c'));
  ctx.lineWidth = 2;
  ctx.stroke();

  if (isCracked) {
    ctx.beginPath();
    ctx.moveTo(x + w * 0.28, y + h * 0.24);
    ctx.lineTo(x + w * 0.38, y + h * 0.58);
    ctx.lineTo(x + w * 0.32, y + h * 0.86);
    ctx.moveTo(x + w * 0.63, y + h * 0.2);
    ctx.lineTo(x + w * 0.54, y + h * 0.5);
    ctx.lineTo(x + w * 0.68, y + h * 0.78);
    ctx.strokeStyle = '#1f5146';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  if (isThornLeaf) {
    ctx.beginPath();
    for (let index = 0; index < 3; index += 1) {
      const baseX = x + w * (0.16 + index * 0.28);
      ctx.moveTo(baseX, y + 3);
      ctx.lineTo(baseX + w * 0.08, y - 9);
      ctx.lineTo(baseX + w * 0.16, y + 3);
    }
    ctx.strokeStyle = '#ffcf5a';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();
}

function drawSun(ctx, sun, cameraY) {
  const y = sun.y - cameraY;
  ctx.beginPath();
  ctx.arc(sun.x, y, sun.radius, 0, Math.PI * 2);
  ctx.fillStyle = '#ffd166';
  ctx.fill();
  ctx.strokeStyle = '#fff3b0';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawPip(ctx, player, cameraY, visualTier = {}, feedback = {}) {
  const x = player.x + player.width / 2;
  const y = player.y - cameraY;
  const squash = player.dead ? 0.72 : (player.grounded ? 0.9 : 1);
  const accent = visualTier.accent ?? '#8be28f';

  ctx.save();
  ctx.translate(x, y + player.height / 2);
  ctx.scale(1, squash);
  if (feedback.shield > 0) {
    const pulse = Math.max(0, Math.min(1, feedback.shield / 0.72));
    ctx.beginPath();
    ctx.arc(0, 3, 22 + pulse * 4, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.32 + pulse * 0.5;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  if (visualTier.id === 'sun-cape') {
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(-11, 3);
    ctx.lineTo(-20, 19);
    ctx.lineTo(0, 13);
    ctx.lineTo(20, 19);
    ctx.lineTo(11, 3);
    ctx.closePath();
    ctx.globalAlpha = 0.78;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  if (visualTier.id === 'summit-crown') {
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(-11, -14);
    ctx.lineTo(-7, -24);
    ctx.lineTo(0, -16);
    ctx.lineTo(7, -24);
    ctx.lineTo(11, -14);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = player.dead ? '#627080' : '#8be28f';
  if (!player.dead) ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.ellipse(0, 5, 13, 17, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#e7ffb3';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#b9f46b';
  ctx.beginPath();
  ctx.ellipse(-7, -14, 7, 4, -0.35, 0, Math.PI * 2);
  ctx.ellipse(7, -14, 7, 4, 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#12233b';
  ctx.beginPath();
  ctx.arc(-4, 1, 2, 0, Math.PI * 2);
  ctx.arc(4, 1, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBackground(ctx, cameraY) {
  const gradient = ctx.createLinearGradient(0, 0, 0, LOGICAL_HEIGHT);
  gradient.addColorStop(0, '#13294b');
  gradient.addColorStop(1, '#09162b');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

  ctx.fillStyle = 'rgba(87, 196, 149, 0.14)';
  const offset = ((cameraY * 0.15) % 120 + 120) % 120;
  for (let x = -80; x < LOGICAL_WIDTH + 80; x += 84) {
    ctx.beginPath();
    ctx.moveTo(x, LOGICAL_HEIGHT);
    ctx.lineTo(x + 34, 0);
    ctx.lineTo(x + 70, 0);
    ctx.lineTo(x + 36, LOGICAL_HEIGHT);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255, 209, 102, 0.18)';
  ctx.beginPath();
  ctx.arc(300, 74 - offset, 34, 0, Math.PI * 2);
  ctx.fill();
}


// Feedback visual. Toda partícula é função pura de (progresso do pulso, índice):
// nenhum estado mutável, nenhum Math.random no caminho de render.
const SPARK_COUNT = 9;
const DUST_COUNT = 7;
const MOTE_COUNT = 12;

function drawCollectBurst(ctx, feedback, cameraY) {
  const progress = pulseProgress(feedback, 'collect');
  const origin = feedback?.origins?.collect;
  if (progress === null || !origin) return;

  const fade = 1 - progress;
  const y = origin.y - cameraY;
  ctx.save();
  ctx.globalAlpha = fade;
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 2;
  for (let index = 0; index < SPARK_COUNT; index += 1) {
    const angle = (index / SPARK_COUNT) * Math.PI * 2 + index * 0.21;
    const inner = 6 + progress * 16;
    const outer = inner + 5 * fade + 3;
    ctx.beginPath();
    ctx.moveTo(origin.x + Math.cos(angle) * inner, y + Math.sin(angle) * inner);
    ctx.lineTo(origin.x + Math.cos(angle) * outer, y + Math.sin(angle) * outer);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(origin.x, y, 5 + progress * 22, 0, Math.PI * 2);
  ctx.strokeStyle = '#fff3b0';
  ctx.globalAlpha = fade * 0.7;
  ctx.stroke();
  ctx.restore();
}

function drawImpactDust(ctx, feedback, cameraY) {
  const progress = pulseProgress(feedback, 'impact');
  const origin = feedback?.origins?.impact;
  if (progress === null || !origin) return;

  const fade = 1 - progress;
  const y = origin.y - cameraY;
  ctx.save();
  ctx.globalAlpha = fade * 0.75;
  ctx.fillStyle = '#d5ff9c';
  for (let index = 0; index < DUST_COUNT; index += 1) {
    const side = index % 2 === 0 ? -1 : 1;
    const spread = (Math.floor(index / 2) + 1) / (DUST_COUNT / 2 + 1);
    const x = origin.x + side * spread * (10 + progress * 20);
    const lift = progress * 9 * (1 - spread * 0.4);
    ctx.beginPath();
    ctx.arc(x, y - lift, 2.4 * fade + 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawMilestoneGlow(ctx, feedback, cameraY) {
  const progress = pulseProgress(feedback, 'milestone');
  const origin = feedback?.origins?.milestone;
  if (progress === null || !origin) return;

  const fade = 1 - progress;
  const y = origin.y - cameraY;
  ctx.save();
  ctx.globalAlpha = fade * 0.34;
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
  ctx.globalAlpha = fade * 0.85;
  ctx.strokeStyle = '#fff3b0';
  ctx.lineWidth = 3 * fade + 1;
  ctx.beginPath();
  ctx.arc(origin.x, y, 14 + progress * 92, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#b9f46b';
  for (let index = 0; index < MOTE_COUNT; index += 1) {
    const angle = (index / MOTE_COUNT) * Math.PI * 2 + 0.37;
    const distance = 18 + progress * 70;
    const rise = progress * 46;
    ctx.globalAlpha = fade * 0.9;
    ctx.beginPath();
    ctx.arc(origin.x + Math.cos(angle) * distance, y + Math.sin(angle) * distance * 0.6 - rise, 2.6 * fade + 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawDeathFade(ctx, feedback) {
  const progress = pulseProgress(feedback, 'death');
  if (progress === null) return;

  ctx.save();
  ctx.globalAlpha = Math.min(0.62, progress * 0.7);
  ctx.fillStyle = '#09162b';
  ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
  ctx.globalAlpha = (1 - progress) * 0.5;
  ctx.strokeStyle = '#627080';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2, 60 + progress * 240, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// Tremor de câmera derivado do pulso de impacto. Amplitude pequena e decrescente:
// comunica contato sem atrapalhar a leitura da próxima folha.
export function impactShake(feedback) {
  const progress = pulseProgress(feedback, 'impact');
  if (progress === null) return { x: 0, y: 0 };
  const fade = 1 - progress;
  return { x: 0, y: Math.sin(progress * Math.PI * 3) * 2.6 * fade };
}

export function createCanvasRenderer(canvas) {
  const context = canvas.getContext?.('2d') ?? null;
  let transform = { scale: 1, offsetX: 0, offsetY: 0, dpr: 1 };

  const resize = ({ width = LOGICAL_WIDTH, height = LOGICAL_HEIGHT, dpr = 1 } = {}) => {
    const safeDpr = Math.max(1, Math.min(2, dpr));
    const scale = Math.min(width / LOGICAL_WIDTH, height / LOGICAL_HEIGHT);
    transform = {
      scale: scale || 1,
      offsetX: (width - LOGICAL_WIDTH * (scale || 1)) / 2,
      offsetY: (height - LOGICAL_HEIGHT * (scale || 1)) / 2,
      dpr: safeDpr,
    };
    canvas.width = Math.max(1, Math.round(width * safeDpr));
    canvas.height = Math.max(1, Math.round(height * safeDpr));
    return transform;
  };

  const render = (snapshot = {}) => {
    if (!context) return;
    const { scale, offsetX, offsetY, dpr } = transform;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.setTransform(scale * dpr, 0, 0, scale * dpr, offsetX * dpr, offsetY * dpr);
    const feedback = snapshot.feedback ?? {};
    const shake = impactShake(feedback);
    const cameraY = (snapshot.cameraY ?? 0) - shake.y;

    drawBackground(context, cameraY);

    for (const platform of snapshot.platforms ?? []) drawLeaf(context, platform, cameraY);
    for (const sun of snapshot.sunDrops ?? []) drawSun(context, sun, cameraY);
    drawImpactDust(context, feedback, cameraY);
    if (snapshot.player) drawPip(
      context,
      snapshot.player,
      cameraY,
      snapshot.visualTier,
      feedback,
    );
    drawCollectBurst(context, feedback, cameraY);
    drawMilestoneGlow(context, feedback, cameraY);
    drawDeathFade(context, feedback);

    context.fillStyle = 'rgba(255, 255, 255, 0.06)';
    context.fillRect(12, 12, LOGICAL_WIDTH - 24, 2);
  };

  resize({ width: LOGICAL_WIDTH, height: LOGICAL_HEIGHT, dpr: 1 });
  return { resize, render };
}
