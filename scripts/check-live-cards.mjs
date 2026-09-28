import assert from 'node:assert/strict';
import { observationState, metricNumber, liveStatuses } from '../mtaprime/src/models/live-conditions.js';
const now = Date.parse('2026-09-25T12:00:00Z');
const reading = age => ({ status: 'open', lastUpdatedAt: new Date(now - age).toISOString() });
assert.equal(observationState(reading(0), now).minutes, 0);
assert.equal(observationState(reading(44 * 60000), now).stale, false);
assert.equal(observationState(reading(45 * 60000), now).stale, true);
assert.equal(observationState(reading(6 * 3600000), now).unavailable, true);
assert.equal(observationState(reading(-120000), now).unavailable, true);
for (const input of [null, {}, {status: {}}, {status: 'invented', lastUpdatedAt: reading(0).lastUpdatedAt}])
  assert.equal(observationState(input, now).unavailable, true);
for (const status of Object.keys(liveStatuses))
  assert.equal(observationState({...reading(0), status}, now).status, status);
assert.equal(metricNumber(0), 0);
for (const value of [null, undefined, '12', NaN, Infinity]) assert.equal(metricNumber(value), null);
console.log('PASS: fresh/stale/expired/future timestamps, all statuses, malformed observations, zero and missing metrics.');
