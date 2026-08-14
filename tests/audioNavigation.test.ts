import test from 'node:test';
import assert from 'node:assert/strict';
import { nextSurahId, previousSurahId } from '../src/utils/audioNavigation';

test('audio advances across every surah boundary', () => {
  for (let surah = 1; surah < 114; surah += 1) assert.equal(nextSurahId(surah, 'none'), surah + 1);
});

test('audio stops after An-Nas unless repeat-all is selected', () => {
  assert.equal(nextSurahId(114, 'none'), null);
  assert.equal(nextSurahId(114, 'all'), 1);
});

test('repeat-one and previous navigation respect Quran boundaries', () => {
  assert.equal(nextSurahId(55, 'one'), 55);
  assert.equal(previousSurahId(1), 1);
  assert.equal(previousSurahId(114), 113);
});
