import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePrayerTimes, getJumuahFirstAdhanTime, getPrayerNameAr, getPrayerNameEn, recommendedCalculationMethod } from '../src/services/prayerTimes';

const toMinutes = (value: string) => {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
};

test('Doha coordinates select the Qatar calculation method', () => {
  assert.equal(recommendedCalculationMethod(25.25, 51.6, 'QA'), 'Qatar');
});

test('Doha prayer times stay aligned with the official MOI fixture for 2026-08-07', () => {
  const actual = calculatePrayerTimes({
    date: new Date(2026, 7, 7),
    latitude: 25.25,
    longitude: 51.6,
    timezone: 3,
    method: 'Qatar',
  });
  const official = {
    fajr: '03:42', sunrise: '05:05', dhuhr: '11:39',
    asr: '15:08', maghrib: '18:16', isha: '19:46',
  };
  for (const prayer of Object.keys(official) as (keyof typeof official)[]) {
    assert.ok(
      Math.abs(toMinutes(actual[prayer]) - toMinutes(official[prayer])) <= 2,
      `${prayer}: calculated ${actual[prayer]}, official ${official[prayer]}`,
    );
  }
});

test('Qatar Isha remains exactly 90 minutes after Maghrib', () => {
  const times = calculatePrayerTimes({
    date: new Date(2026, 0, 15), latitude: 25.2854, longitude: 51.531, timezone: 3, method: 'Qatar',
  });
  assert.equal(toMinutes(times.isha) - toMinutes(times.maghrib), 90);
});

test('Friday noon prayer is presented as Jumuah without changing its calculation key', () => {
  const friday = new Date(2026, 7, 7);
  const thursday = new Date(2026, 7, 6);
  assert.equal(getPrayerNameAr('dhuhr', friday), 'الجمعة');
  assert.equal(getPrayerNameEn('dhuhr', friday), "Jumu'ah");
  assert.equal(getPrayerNameAr('dhuhr', thursday), 'الظهر');
  assert.equal(getPrayerNameAr('asr', friday), 'العصر');
});

test('first Friday adhaan reminder is 45 minutes before the second by default', () => {
  assert.equal(getJumuahFirstAdhanTime('11:40'), '10:55');
  assert.equal(getJumuahFirstAdhanTime('12:05', 30), '11:35');
});
