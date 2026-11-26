import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,channel:'chrome'});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile MicroMessenger/8.0'});const errors=[];page.on('pageerror',e=>errors.push(e.message));let blocked=0;
 await page.route('**/photos/**',route=>{blocked++;return route.abort();});
 await page.goto(process.env.TEST_URL||'http://127.0.0.1:4173/docs/wechat.html',{waitUntil:'networkidle'});
 if(await page.getByTestId('opening').count()){await page.getByTestId('start-opening').click();await page.getByTestId('release-wish').click();await page.getByTestId('opening').waitFor({state:'detached'});}
 await page.waitForFunction(()=>document.querySelector('.scene')?.getAttribute('data-loaded')==='20');
 const embedded=await page.evaluate(()=>JSON.parse(document.getElementById('birthday-photos').textContent));
 assert.equal(Object.keys(embedded).length,20);assert.ok(Object.values(embedded).every(x=>x.startsWith('data:image/jpeg;base64,')));
 await page.getByTestId('toggle').click();await page.waitForTimeout(2800);
 await page.screenshot({path:'test-results/wechat-all-photos.png'});
 const box=await page.locator('.scene').boundingBox();await page.mouse.click(box.x+box.width*.8225,box.y+box.height*.844);
 await page.getByRole('dialog').waitFor();await page.waitForFunction(()=>document.querySelector('.large-photo')?.naturalWidth>0);
 assert.ok((await page.locator('.large-photo').getAttribute('src')).startsWith('data:image/jpeg;'));
 assert.equal(await page.locator('.memory-date').innerText(),'20');
 await page.waitForTimeout(1300);await page.screenshot({path:'test-results/wechat-large-photo.png'});await page.getByRole('button',{name:'上一张照片'}).click();await page.waitForFunction(()=>document.querySelector('.caption-art')?.naturalWidth===1086);assert.ok((await page.locator('.caption-art').getAttribute('src')).startsWith('data:image/jpeg;'));await page.screenshot({path:'test-results/wechat-caption19.png'});assert.deepEqual(errors,[]);
 console.log(JSON.stringify({embeddedJPEGs:20,sceneLoaded:20,allPhotoRequestsBlocked:true,blocked,largePhotoVisible:true,caption19Visible:true,errors}));
}finally{await browser.close();}
