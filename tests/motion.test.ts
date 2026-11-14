import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateMarbles, tiers, springStep, photoSlot } from '../src/motion';

test('all elements have stable, finite home and deep scatter endpoints', () => {
 const first=generateMarbles(450,1027), second=generateMarbles(450,1027);
 assert.deepEqual(first,second); assert.equal(first.length,450);
 for(const item of first) { assert.ok([...item.home,...item.scatter].every(Number.isFinite)); assert.ok(Math.hypot(item.home[0],item.home[2])<=tiers[item.layer].radius+.05); }
 assert.ok(Math.max(...first.map(p=>p.scatter[2]))-Math.min(...first.map(p=>p.scatter[2]))>4);
 assert.equal(new Set(first.map(p=>p.layer)).size,3);
 assert.ok(tiers[0].radius>tiers[1].radius && tiers[1].radius>tiers[2].radius);
});
test('reversing an in-flight animation preserves position and velocity, and converges', () => {
 let p=0,v=0;
 for(let i=0;i<45;i++){const s=springStep(p,v,1,1/60,2.1);p=s.position;v=s.velocity;}
 const reversal=springStep(p,v,0,0,2.1);assert.equal(reversal.position,p);assert.equal(reversal.velocity,v);
 for(let i=0;i<30;i++) {const s=springStep(p,v,i%2,1/60,2.1);assert.ok(Math.abs(s.position-p)<.03);p=s.position;v=s.velocity;}
 for(let i=0;i<160;i++){const s=springStep(p,v,0,1/60,2.1);p=s.position;v=s.velocity;}
 assert.ok(Math.abs(p)<.001);assert.ok(Math.abs(v)<.004);
});
test('mobile photo destinations are unique, ordered, bounded, and use depth', () => {
 const positions=Array.from({length:19},(_,i)=>photoSlot(i,19,.65));
 assert.equal(new Set(positions.map(p=>p.join(','))).size,19);
 assert.ok(positions.every(p=>Math.abs(p[0])<.9 && Math.abs(p[1])<.9));
 assert.ok(new Set(positions.map(p=>p[2])).size>3);
});
