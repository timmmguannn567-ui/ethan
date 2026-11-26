import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,channel:'chrome'});const reports=[];
await mkdir('test-results',{recursive:true});
try{
 for(const settings of [{width:390,height:844,full:true},{width:1440,height:1000,full:true},{width:320,height:568,full:false,reduced:true}]){
  const page=await browser.newPage({viewport:{width:settings.width,height:settings.height},reducedMotion:settings.reduced?'reduce':'no-preference'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.TEST_URL||'http://127.0.0.1:4173/docs/wechat.html',{waitUntil:'networkidle'});
  assert.ok(await page.evaluate(()=>document.fonts.check('24px BirthdayOpening')));const intro=page.getByTestId('opening');await intro.waitFor();assert.equal(await intro.getAttribute('data-phase'),'invitation');
  assert.ok(await page.locator('.experience').evaluate(el=>el.inert));
  await page.waitForTimeout(750);await page.screenshot({path:`test-results/opening-invitation-${settings.width}.png`});
  const start=await page.getByTestId('start-opening').boundingBox();const top=await page.locator('.opening-copy').boundingBox();assert.ok(start.y>top.y+top.height);assert.ok(start.y+start.height<settings.height-20);
  await page.mouse.move(settings.width*.3,settings.height*.47);await page.mouse.down();await page.mouse.move(settings.width*.65,settings.height*.52,{steps:12});await page.mouse.up();
  if(settings.full){
   await page.getByTestId('start-opening').focus();await page.keyboard.press('Enter');
   await page.waitForFunction(()=>document.querySelector('.opening')?.getAttribute('data-phase')==='countdown');
   await page.waitForTimeout(850);const before=await page.locator('.opening-canvas').screenshot();await page.screenshot({path:`test-results/opening-countdown-${settings.width}.png`});await page.waitForTimeout(400);const after=await page.locator('.opening-canvas').screenshot();assert.notDeepEqual(before,after,'Particle field must remain alive after the number forms');await page.screenshot({path:`test-results/opening-countdown-drift-${settings.width}.png`});
   await page.waitForFunction(()=>document.querySelector('.opening')?.getAttribute('data-phase')==='name');await page.waitForTimeout(900);await page.screenshot({path:`test-results/opening-name-${settings.width}.png`});
   await page.waitForFunction(()=>document.querySelector('.opening')?.getAttribute('data-phase')==='birthday');await page.waitForTimeout(900);await page.screenshot({path:`test-results/opening-birthday-${settings.width}.png`});
   await page.getByTestId('release-wish').waitFor();await page.waitForTimeout(900);await page.screenshot({path:`test-results/opening-wish-${settings.width}.png`});
   await page.getByTestId('release-wish').click();await page.waitForTimeout(600);await page.screenshot({path:`test-results/opening-release-${settings.width}.png`});
  } else {await page.getByTestId('skip-opening').click();}
  await intro.waitFor({state:'detached'});await page.waitForTimeout(1000);
  await page.waitForFunction(()=>document.querySelector('.scene')?.getAttribute('data-loaded')==='20');
  assert.equal(await page.locator('.experience').evaluate(el=>el.inert),false);assert.equal(await page.getByTestId('toggle').getAttribute('aria-expanded'),'false');
  await page.screenshot({path:`test-results/opening-cake-${settings.width}.png`});
  await page.getByTestId('toggle').click();assert.equal(await page.getByTestId('toggle').getAttribute('aria-expanded'),'true');
  await page.getByTestId('replay-opening').click();await intro.waitFor();assert.equal(await intro.getAttribute('data-phase'),'invitation');assert.equal(await page.locator('.opening-canvas').count(),1);
  await page.getByTestId('start-opening').click();await page.waitForTimeout(150);await page.getByTestId('skip-opening').click();await intro.waitFor({state:'detached'});
  assert.equal(await page.getByTestId('toggle').getAttribute('aria-expanded'),'false');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
  reports.push({viewport:settings,fullSequence:settings.full,skip:true,replay:true,preservedCake:true,photos:20,errors});await page.close();
 }
 await writeFile('test-results/opening-report.json',JSON.stringify(reports,null,2));console.log(JSON.stringify(reports));
}finally{await browser.close();}
