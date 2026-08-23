import test from 'node:test';
import assert from 'node:assert/strict';
import { createTranslator, getLocale } from '../src/i18n.js';

test('english is the default locale and exposes the complete onboarding vocabulary', () => {
  const translator = createTranslator();

  assert.equal(translator.locale, 'en');
  assert.equal(translator.t('ready.title'), 'Help Pip climb.');
  assert.equal(translator.t('ready.instructions'), 'Tap or use ← → to guide the sprout between the leaves.');
  assert.equal(translator.t('restart'), 'Play again');
});

test('Portuguese browser locale keeps the existing localized experience', () => {
  const translator = createTranslator('pt-BR');

  assert.equal(translator.locale, 'pt');
  assert.equal(translator.t('ready.title'), 'Ajude Pip a subir.');
  assert.equal(translator.t('restart'), 'Jogar novamente');
});

test('unsupported locales fall back to English', () => {
  assert.equal(getLocale('de-DE'), 'en');
  assert.equal(createTranslator('de-DE').t('hud.height'), 'Height');
});

test('localized templates interpolate gameplay values', () => {
  const translator = createTranslator('en-US');

  assert.equal(translator.t('hud.heightValue', { value: 42 }), '42 m');
  assert.equal(translator.t('objective.next', { label: 'Solar cape' }), 'Next: Solar cape');
});
