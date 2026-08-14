import assert from 'node:assert/strict';
import test from 'node:test';

import { ALL_ADHKAR } from '../src/data/adhkar';

test('sleep adhkar link Surah Al-Mulk to the canonical Mushaf', () => {
  const item = ALL_ADHKAR.find((dhikr) => dhikr.id === 'sleep-mulk');
  assert.ok(item);
  assert.equal(item.category, 'sleep');
  assert.equal(item.surahId, 67);
  assert.equal(item.count, 1);
});

test('after-prayer adhkar show Al-Ikhlas and both Muawwidhat in full', () => {
  const item = ALL_ADHKAR.find((dhikr) => dhikr.id === 'p-6');
  assert.ok(item);
  assert.equal(item.quranic, true);
  assert.deepEqual(item.quranicGroupTitles, ['سورة الإخلاص', 'سورة الفلق', 'سورة الناس']);
  assert.match(item.body, /اللَّهُ الصَّمَدُ/);
  assert.match(item.body, /مِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ/);
  assert.match(item.body, /مِنَ الْجِنَّةِ وَالنَّاسِ/);
});

test('morning and evening wards include the complete canonical core', () => {
  const morning = ALL_ADHKAR.filter((dhikr) => dhikr.category === 'morning');
  const evening = ALL_ADHKAR.filter((dhikr) => dhikr.category === 'evening');

  assert.equal(morning.length, 24);
  assert.equal(evening.length, 20);
  for (const title of ['اللهم إني أسألك العفو والعافية', 'اللهم عالم الغيب والشهادة']) {
    assert.ok(morning.some((dhikr) => dhikr.title === title));
    assert.ok(evening.some((dhikr) => dhikr.title === title));
  }
  assert.ok(morning.some((dhikr) => dhikr.title === 'أصبحنا وأصبح الملك لله رب العالمين'));
  assert.ok(evening.some((dhikr) => dhikr.title === 'أمسينا وأمسى الملك لله رب العالمين'));
});

test('sleep ward includes the closing prophetic supplications and both surahs', () => {
  const sleep = ALL_ADHKAR.filter((dhikr) => dhikr.category === 'sleep');
  assert.ok(sleep.some((dhikr) => dhikr.title === 'اللهم إنك خلقت نفسي'));
  assert.ok(sleep.some((dhikr) => dhikr.title === 'اللهم عالم الغيب والشهادة'));
  assert.ok(sleep.some((dhikr) => dhikr.title === 'اللهم أسلمت نفسي إليك'));
  assert.equal(sleep.find((dhikr) => dhikr.id === 'sleep-sajdah')?.surahId, 32);
  assert.equal(sleep.find((dhikr) => dhikr.id === 'sleep-mulk')?.surahId, 67);
});
