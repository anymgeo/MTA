import { test } from 'node:test';
import assert from 'node:assert/strict';
import { allowResortVideo } from '../src/models/resort-media.js';
import { portalDateParts } from '../src/lib/portal-date.js';

test('Hero video is allowed only on desktop without reduced motion or data saving', () => {
  for (const mobile of [true,false]) for (const reducedMotion of [true,false]) for (const saveData of [true,false])
    assert.equal(allowResortVideo({mobile,reducedMotion,saveData}), !mobile && !reducedMotion && !saveData);
  assert.equal(allowResortVideo({mobile:false,reducedMotion:false}),true);
});
test('Event date parts are stable across browser locale support and use Tbilisi time', () => {
  assert.deepEqual(portalDateParts('2026-08-22T15:00:00+04:00'), {day:'22',month:'8',year:'2026',hour:'15',minute:'00'});
  assert.deepEqual(portalDateParts('2024-02-29'), {day:'29',month:'2',year:'2024'});
  assert.deepEqual(portalDateParts('2026-08-22T22:30:00Z'), {day:'23',month:'8',year:'2026',hour:'02',minute:'30'});
  assert.equal(portalDateParts('invalid'),null);
});
