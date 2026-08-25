import test from 'node:test';
import assert from 'node:assert/strict';
import { createFeedbackState, stepFeedback } from '../src/game/feedback.js';

test('feedback maps gameplay events to short readable pulses', () => {
  const next = stepFeedback(
    createFeedbackState(),
    ['platformImpact', 'collectedSun', 'solarShieldReady', 'milestoneReached'],
    1 / 60,
  );

  assert.ok(next.impact > 0);
  assert.ok(next.collect > 0);
  assert.ok(next.shield > 0);
  assert.ok(next.milestone > 0);
});

test('feedback pulses decay deterministically and never become negative', () => {
  const active = stepFeedback(createFeedbackState(), ['playerDied'], 0);
  const settled = stepFeedback(active, [], 2);

  assert.equal(settled.death, 0);
  assert.equal(settled.impact, 0);
  assert.equal(settled.collect, 0);
  assert.equal(settled.shield, 0);
  assert.equal(settled.milestone, 0);
});
