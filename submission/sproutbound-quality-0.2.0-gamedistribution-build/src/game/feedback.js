const PULSE_SECONDS = {
  impact: 0.18,
  collect: 0.32,
  shield: 0.72,
  milestone: 0.95,
  death: 0.8,
};

export function createFeedbackState() {
  return {
    impact: 0,
    collect: 0,
    shield: 0,
    milestone: 0,
    death: 0,
  };
}

export function stepFeedback(state = createFeedbackState(), events = [], dt = 0) {
  const safeDt = Math.max(0, Number.isFinite(dt) ? dt : 0);
  const next = Object.fromEntries(
    Object.entries({ ...createFeedbackState(), ...state })
      .map(([key, value]) => [key, Math.max(0, value - safeDt)]),
  );

  for (const event of events) {
    if (event === 'platformImpact' || event === 'landed') next.impact = PULSE_SECONDS.impact;
    if (event === 'collectedSun') next.collect = PULSE_SECONDS.collect;
    if (event === 'solarShieldReady' || event === 'solarShieldUsed') next.shield = PULSE_SECONDS.shield;
    if (event === 'milestoneReached' || event === 'summitReached') next.milestone = PULSE_SECONDS.milestone;
    if (event === 'playerDied') next.death = PULSE_SECONDS.death;
  }

  return next;
}
