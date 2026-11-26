import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,channel:'chrome'});
const errors=[];const results=[];
try {
 for(const viewport of [{width:390,height:844},{width:1440,height:1000},{width:320,height:568}]){
  const page=await browser.newPage({viewport,deviceScaleFactor:1});
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.TEST_URL||'http://localhost:5173/',{waitUntil:'networkidle'});
 if(await page.getByTestId('skip-opening').count()){await page.getByTestId('skip-opening').click();await page.getByTestId('opening').waitFor({state:'detached'});}
  await page.waitForFunction(()=>window.__birthday?.snapshot().loadedPhotos===20,null,{timeout:45000});
  await mkdir('test-results',{recursive:true});
  await page.screenshot({path:`test-results/cake-${viewport.width}.png`});
  const initial=await page.evaluate(()=>window.__birthday.snapshot());
  assert.equal(initial.photoCount,20);assert.equal(initial.target,0);
  const box=await page.locator('.scene').boundingBox();
  const heading=await page.locator('.heading').boundingBox();
  const controls=await page.locator('.controls').boundingBox();
  assert.ok(heading.y+heading.height<=box.y);assert.ok(box.y+box.height<=controls.y);
  await page.getByTestId('toggle').click(); await page.waitForTimeout(2800);
  const expanded=await page.evaluate(()=>window.__birthday.snapshot());assert.ok(expanded.progress>.99);
  assert.ok(expanded.photoPositions.every(p=>Math.abs(p.ndc[0])<.9&&Math.abs(p.ndc[1])<.9));
  assert.notDeepEqual(initial.marblePositions,expanded.marblePositions);
  await page.screenshot({path:`test-results/scatter-${viewport.width}.png`});
  const ndc=expanded.photoPositions[9].ndc;
  await page.mouse.click(box.x+(ndc[0]+1)*box.width/2,box.y+(1-ndc[1])*box.height/2);
  await page.getByRole('dialog').waitFor({state:'visible',timeout:5000});
  await page.waitForFunction(()=>document.querySelector('.large-photo')?.naturalWidth>0);
  await page.waitForTimeout(1300);await page.screenshot({path:`test-results/photo-${viewport.width}.png`});
  await page.getByRole('button',{name:'下一张照片'}).click();
  await page.getByRole('button',{name:'关闭照片'}).click();await page.waitForTimeout(400);
  for(let i=0;i<8;i++){await page.getByTestId('toggle').click();await page.waitForTimeout(95);}
  if(await page.getByTestId('toggle').getAttribute('aria-expanded')==='true') await page.getByTestId('toggle').click();
  await page.waitForTimeout(2800);assert.ok((await page.evaluate(()=>window.__birthday.snapshot().progress))<.001);
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2+65,box.y+box.height/2+8,{steps:10});await page.mouse.up();
  assert.ok(Math.abs(await page.evaluate(()=>window.__birthday.snapshot().yaw))>.2);
  await page.mouse.click(viewport.width/2,60);assert.equal(await page.getByTestId('toggle').getAttribute('aria-expanded'),'true');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  results.push({viewport,photos:20,loaded:20,fullExpansion:true,photoViewer:true,rapidReversal:true,drag:true,noOverlap:true});await page.close();
 }
 assert.deepEqual(errors,[]);await writeFile('test-results/browser-report.json',JSON.stringify({date:'2026-11-14',results,errors},null,2));console.log(JSON.stringify({results,errors}));
} finally {await browser.close();}
