import test from 'node:test';
import assert from 'node:assert/strict';
import { createTranslator, getLocale, getPreferredLanguage } from '../src/i18n.js';

test('english is the default locale and exposes the complete onboarding vocabulary', () => {
  const translator = createTranslator();

  assert.equal(translator.locale, 'en');
  assert.equal(translator.t('ready.title'), 'Help Pip climb.');
  assert.equal(translator.t('ready.instructions'), 'Tap left or right, or use ← → / A D / Q Z to guide Pip.');
  assert.equal(translator.t('guide.title'), 'Reach the summit.');
  assert.equal(translator.t('restart'), 'Play again');
});

test('Portuguese browser locale keeps the existing localized experience', () => {
  const translator = createTranslator('pt-BR');

  assert.equal(translator.locale, 'pt');
  assert.equal(translator.t('ready.title'), 'Ajude Pip a subir.');
  assert.equal(translator.t('guide.title'), 'Alcance o cume.');
  assert.equal(translator.t('restart'), 'Jogar novamente');
});

test('unsupported locales fall back to English', () => {
  assert.equal(getLocale('de-DE'), 'en');
  assert.equal(createTranslator('de-DE').t('hud.height'), 'Height');
});

test('preview language can be forced without changing the player browser locale', () => {
  assert.equal(getPreferredLanguage({ navigator: { language: 'pt-BR' }, location: { search: '?lang=en' } }), 'en');
  assert.equal(getPreferredLanguage({ navigator: { language: 'pt-BR' }, location: { search: '' } }), 'pt-BR');
});

test('localized templates interpolate gameplay values', () => {
  const translator = createTranslator('en-US');

  assert.equal(translator.t('hud.heightValue', { value: 42 }), '42 m');
  assert.equal(translator.t('objective.next', { label: 'Solar cape' }), 'Next: Solar cape');
  assert.equal(translator.t('hud.solarCharge', { value: 3, max: 5 }), 'Solar charge: 3/5');
  assert.equal(translator.t('hud.shieldReady'), 'Solar shield ready');
});
