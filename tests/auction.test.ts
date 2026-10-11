import {test} from 'node:test';
import assert from 'node:assert/strict';
import {initial,sell,selectRandom,spent} from '../src/auction.ts';
const fresh=()=>structuredClone(initial);
test('sale assigns player and updates team spending',()=>{const s=sell(fresh());assert.equal(s.players[0].status,'sold');assert.equal(s.players[0].team,'t1');assert.equal(spent(s,'t1'),5000);assert.equal(s.history.length,1);});
test('a sold player cannot be sold twice',()=>{assert.throws(()=>sell(sell(fresh())),/eligible/);});
test('sale cannot exceed budget',()=>{const s=fresh();s.bid=150001;assert.throws(()=>sell(s),/budget/);});
test('sale must meet base price',()=>{const s=fresh();s.bid=4999;assert.throws(()=>sell(s),/base price/);s.bid=NaN;assert.throws(()=>sell(s),/base price/);});
test('full squad cannot acquire a player',()=>{const s=sell(fresh());s.teams[0].limit=1;s.active='p2';assert.throws(()=>sell(s),/full/);});
test('shuffle excludes sold and unsold players',()=>{const s=sell(fresh());s.players[1].status='unsold';for(let i=0;i<100;i++){const p=selectRandom(s.players);assert.ok(p);assert.equal(p.status,'waiting');assert.notEqual(p.id,'p1');assert.notEqual(p.id,'p2');}});
test('empty waiting pool produces no player',()=>{assert.equal(selectRandom([]),undefined);});

test('unsold players must re-enter a round before sale',()=>{const s=fresh();s.players[0].status='unsold';assert.throws(()=>sell(s),/eligible/);});
