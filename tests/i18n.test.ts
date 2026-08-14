import assert from 'node:assert/strict';
import test from 'node:test';

import { LANGUAGE_CODES, translate } from '../src/i18n';
import { ar } from '../src/i18n/translations/ar';
import { en } from '../src/i18n/translations/en';
import { fa } from '../src/i18n/translations/fa';
import { fr } from '../src/i18n/translations/fr';
import { ha } from '../src/i18n/translations/ha';
import { id } from '../src/i18n/translations/id';
import { ms } from '../src/i18n/translations/ms';
import { sw } from '../src/i18n/translations/sw';
import { tr } from '../src/i18n/translations/tr';
import { ur } from '../src/i18n/translations/ur';

const dictionaries = { ar, en, fa, fr, ha, id, ms, sw, tr, ur };

test('Arabic and English provide the complete canonical translation key set', () => {
  assert.deepEqual(Object.keys(en).sort(), Object.keys(ar).sort());
});

test('every partial translation only contains known, non-empty keys', () => {
  const canonicalKeys = new Set(Object.keys(ar));
  for (const [language, dictionary] of Object.entries(dictionaries)) {
    for (const [key, value] of Object.entries(dictionary)) {
      assert.ok(canonicalKeys.has(key), `${language} contains unknown key: ${key}`);
      assert.ok(value.trim().length > 0, `${language} contains an empty value for: ${key}`);
    }
  }
});

test('fallback translation never exposes an internal key to users', () => {
  for (const language of LANGUAGE_CODES) {
    for (const key of Object.keys(ar) as (keyof typeof ar)[]) {
      assert.notEqual(translate(key, language), key, `${language} has no safe fallback for ${key}`);
    }
  }
});
