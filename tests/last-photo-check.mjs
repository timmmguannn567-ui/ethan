import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,channel:'chrome'});
try{
 const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.TEST_URL||'http://localhost:5173/',{waitUntil:'networkidle'});
 assert.ok(await page.evaluate(()=>document.fonts.check('24px BirthdayHandwriting')));await page.getByTestId('toggle').click();await page.waitForTimeout(3000);
 assert.ok((await page.locator('.moment-label').innerText()).includes('20'));
 const box=await page.locator('.scene').boundingBox();
 await page.mouse.click(box.x+box.width*.8225,box.y+box.height*.844);
 await page.getByRole('dialog').waitFor();
 await page.waitForFunction(()=>document.querySelector('.large-photo')?.naturalWidth===1282);
 assert.ok((await page.locator('.large-photo').getAttribute('src')).includes('/20.jpg'));
 assert.equal(await page.locator('.memory-date').innerText(),'20');
 assert.equal(await page.locator('.viewer-footer p').innerText(),'生日快乐，爱你的每一个当下，也期待陪你的每一个明天。');
 assert.equal((await page.locator('.framed-photo figcaption').innerText()).replace(/\s+/g,''),'生日快乐，爱你的每一个当下，也期待陪你的每一个明天。');
 const card=await page.locator('.framed-photo').evaluate(el=>({width:el.clientWidth,height:el.clientHeight})); assert.ok(Math.abs(card.width/card.height-.75)<.005);
 await page.waitForTimeout(1300);await page.screenshot({path:'test-results/last-photo-20.png'});
 await page.getByRole('button',{name:'上一张照片'}).click();assert.equal(await page.locator('.memory-date').innerText(),'19');assert.equal(await page.locator('.viewer-footer p').innerText(),'愿我们把平凡的日子，过成值得珍藏的回忆。');assert.equal((await page.locator('.caption-replacement figcaption').innerText()).replace(/\s+/g,''),'愿我们把平凡的日子，过成值得珍藏的回忆。');await page.waitForTimeout(1400);await page.screenshot({path:'test-results/photo-19-new-caption.png'});assert.equal(await page.locator('.framed-photo').count(),0);await page.getByRole('button',{name:'下一张照片'}).click();await page.getByRole('button',{name:'下一张照片'}).click();assert.equal(await page.locator('.memory-date').innerText(),'01');
 await page.setViewportSize({width:1440,height:1000});await page.getByRole('button',{name:'上一张照片'}).click();await page.waitForTimeout(1400);const desktop=await page.locator('.framed-photo').boundingBox();const desktopRatio=await page.locator('.framed-photo').evaluate(el=>el.clientWidth/el.clientHeight);assert.ok(Math.abs(desktopRatio-.75)<.005);assert.ok(desktop.y>=0 && desktop.y+desktop.height<=1000);await page.screenshot({path:'test-results/layout-desktop.png'});
 assert.deepEqual(errors,[]);console.log(JSON.stringify({count:20,lastPhoto:true,fullResolution:true,captionExact:true,wrapToFirst:true,errors}));
}finally{await browser.close();}
