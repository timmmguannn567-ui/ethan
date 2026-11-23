import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,channel:'chrome'});
try {
 const page=await browser.newPage({viewport:{width:390,height:844}});let blocked=0,originalRecovered=false;
 await page.route('**/01-thumb.webp*',route=>{blocked++;return route.abort();});
 page.on('response',r=>{if(r.url().includes('/01.webp')&&r.ok())originalRecovered=true;});
 const url=process.env.TEST_URL||'http://127.0.0.1:4173/docs/birthday.html';
 await page.goto(url,{waitUntil:'networkidle'});await page.getByTestId('toggle').waitFor();
 for(let i=0;i<40&&!originalRecovered;i++)await page.waitForTimeout(250);
 assert.equal(blocked,2);assert.ok(originalRecovered,'Original photo recovers after two thumbnail failures');
 await page.unroute('**/01-thumb.webp*');
 const list=JSON.parse(await readFile(new URL('../src/photos.json',import.meta.url),'utf8'));
 const images=await page.evaluate(async paths=>Promise.all(paths.map(path=>new Promise(resolve=>{const img=new Image();img.onload=()=>resolve({path,ok:img.naturalWidth>0});img.onerror=()=>resolve({path,ok:false});img.src=new URL(path.replace(/^\//,''),location.href).href;}))),list.flatMap(p=>[p.src,p.thumbnail]));
 assert.equal(images.length,40);assert.ok(images.every(p=>p.ok),JSON.stringify(images.filter(p=>!p.ok)));
 await page.getByTestId('toggle').click();await page.waitForTimeout(2600);await page.screenshot({path:'test-results/photo-recovery.png'});
 console.log(JSON.stringify({thumbnailFailures:blocked,originalRecovered,decodedPhotos:images.length,newPage:url}));
}finally{await browser.close();}
