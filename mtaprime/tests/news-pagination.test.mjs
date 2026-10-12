import test from 'node:test';
import assert from 'node:assert/strict';
import { paginateNews } from '../src/models/news-pagination.js';

test('News pages contain ten items, with no overlap or omitted records', () => {
  const items=Array.from({length:54},(_,index)=>index);
  const pages=Array.from({length:6},(_,index)=>paginateNews(items,index+1));
  assert.deepEqual(pages.flatMap(p=>p.news),items);
  assert.deepEqual(pages.map(p=>p.news.length),[10,10,10,10,10,4]);
});
test('Empty, malformed and out-of-range page values are safe', () => {
  const items=Array.from({length:54},(_,index)=>index);
  for (const value of [undefined,'',0,-1,'bad','2.5','999999999999999999']) assert.equal(paginateNews(items,value).page,1);
  assert.equal(paginateNews(items,999).page,6);
  assert.deepEqual(paginateNews([],1),{news:[],page:1,pageCount:1});
});
