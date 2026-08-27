const MILESTONES = [
  { id: 'bud', height: 10, label: 'Two-leaf sprout', accent: '#b9f46b' },
  { id: 'bloom', height: 25, label: 'Blooming Pip', accent: '#ff9ac2' },
  { id: 'sun-cape', height: 60, label: 'Solar cape', accent: '#ffd166' },
  { id: 'summit-crown', height: 240, label: 'Summit Crown', accent: '#b9f46b' },
];

const BASE_VISUAL_TIER = {
  id: 'seed',
  label: 'Fresh Pip',
  accent: '#86e6a8',
};

export function createDefaultProgress() {
  return {
    version: 1,
    bestHeight: 0,
    unlocked: [],
  };
}

export function getMilestone(height = 0) {
  return MILESTONES.find((milestone) => milestone.height > height) ?? null;
}

export function applyProgression(progress, event) {
  const current = progress && progress.version === 1 ? progress : createDefaultProgress();
  if (event?.type !== 'height' || !Number.isFinite(event.height)) {
    return { progress: { ...current }, unlocked: [] };
  }

  const height = Math.max(0, event.height);
  const known = new Set(current.unlocked);
  const unlocked = MILESTONES
    .filter((milestone) => milestone.height <= height && !known.has(milestone.id))
    .map((milestone) => milestone.id);

  return {
    progress: {
      ...current,
      bestHeight: Math.max(current.bestHeight, height),
      unlocked: [...current.unlocked, ...unlocked],
    },
    unlocked,
  };
}

export function getMilestones() {
  return MILESTONES.map((milestone) => ({ ...milestone }));
}

export function getVisualTier(progress) {
  const unlocked = new Set(progress?.version === 1 ? progress.unlocked : []);
  const highest = [...MILESTONES].reverse().find((milestone) => unlocked.has(milestone.id));
  return highest
    ? { id: highest.id, label: highest.label, accent: highest.accent }
    : { ...BASE_VISUAL_TIER };
}
