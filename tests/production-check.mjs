import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,channel:'chrome'});
try {
 const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[];const missing=[];const photos=new Set();
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)missing.push(r.url());if(r.ok()&&r.url().includes('-thumb.webp'))photos.add(r.url());});
 await page.goto(process.env.PRODUCTION_URL||'http://127.0.0.1:4173/docs/',{waitUntil:'networkidle'});
 assert.equal(photos.size,19);await page.getByTestId('toggle').click();await page.waitForTimeout(2600);
 assert.equal(await page.getByTestId('toggle').getAttribute('aria-expanded'),'true');
 await page.screenshot({path:'test-results/cosmic-production.png'});assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
 console.log(JSON.stringify({productionSubpath:true,loadedPhotos:photos.size,errors,missing}));
}finally{await browser.close();}
