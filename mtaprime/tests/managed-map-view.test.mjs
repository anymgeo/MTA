import test from 'node:test';
import assert from 'node:assert/strict';
import { managedMapView, mapPath } from '../src/models/managed-map-view.js';

test('CMS cubic handles and polygons are preserved in the original map viewer', () => {
  const points = [[10, 20, null, null, 30, 40], { x: 100, y: 200, inX: 70, inY: 80 }];
  assert.equal(mapPath(points), 'M 10 20 C 30 40 70 80 100 200');
  assert(mapPath(points, true).endsWith(' Z'));
  const result = managedMapView({ id: 'bakuriani', types: [{ key: 'lift', name: 'Chairlift', color: '#123456' }],
    features: [{ id: 'one', kind: 'lift', name: 'One', geometryKind: 'line', points, opens: '09:00', closes: '17:00' }],
    catalogRecords: [{ id: 'catalog:one', kind: 'lift', name: 'One' }, { id: 'catalog:two', kind: 'lift', name: 'Two', position: null }] });
  assert.equal(result.records.length, 2);
  assert.deepEqual(result.records[0].position, { x: 10, y: 20 });
  assert.equal(result.records[0].hours, '09:00–17:00');
  assert.equal(result.records[1].position, null, 'Unmapped catalogue entries must not acquire invented coordinates');
});

test('Official reference classifications and provenance survive the public adapter', () => {
  const result=managedMapView({types:[{key:'expert-trail',name:'Expert piste',color:'#171717'},{key:'ski-way',name:'Ski way',color:'#22385d'},{key:'official-hazard',name:'Hazard',color:'#fcb714'}],features:[
    {id:'expert',kind:'expert-trail',geometryKind:'line',points:[[10,20],[30,40]],description:'official-trace:gudauri-v1:test\nHistorical reference, not live.'},
    {id:'way',kind:'ski-way',geometryKind:'line',points:[[20,30],[40,50]]},
    {id:'hazard',kind:'official-hazard',geometryKind:'point',points:[[50,60]]},
  ]});
  assert.equal(result.records[0].kind,'trail');
  assert.equal(result.records[0].difficulty,'black');
  assert.equal(result.records[0].reference,true);
  assert.equal(result.records[0].description,'Historical reference, not live.');
  assert.equal(result.records[1].dashed,true);
  assert.equal(result.records[2].kind,'warning');
  assert.equal(result.records[2].color,'#fcb714');
});
