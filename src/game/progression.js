const MILESTONES = [
  { id: 'bud', height: 10, label: 'Broto com duas folhas', accent: '#b9f46b' },
  { id: 'bloom', height: 25, label: 'Pip florescente', accent: '#ff9ac2' },
  { id: 'sun-cape', height: 60, label: 'Capa de luz solar', accent: '#ffd166' },
];

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
