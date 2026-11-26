import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,channel:'chrome'});
try {
 const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  const Original=window.AudioContext;
  window.AudioContext=class extends Original{
   constructor(...args){super(...args);window.__musicContext=this;}
   createDynamicsCompressor(){const node=super.createDynamicsCompressor();const connect=node.connect.bind(node);node.connect=(target,...args)=>{const result=connect(target,...args);if(target===this.destination){window.__musicAnalyser=this.createAnalyser();connect(window.__musicAnalyser);}return result;};return node;}
  };
 });
 await page.goto(process.env.TEST_URL||'http://localhost:5173/',{waitUntil:'networkidle'});
 assert.equal(await page.evaluate(()=>!!window.__musicContext),false);
 if(await page.getByTestId('skip-opening').count()){await page.getByTestId('skip-opening').click();await page.getByTestId('opening').waitFor({state:'detached'});}
 await page.getByTestId('toggle').click();await page.waitForTimeout(2200);
 assert.equal(await page.getByTestId('music').getAttribute('aria-pressed'),'true');
 const rms=()=>{const a=window.__musicAnalyser;const data=new Float32Array(a.fftSize);a.getFloatTimeDomainData(data);return Math.sqrt(data.reduce((s,x)=>s+x*x,0)/data.length);};
 const active=await page.evaluate(rms);assert.ok(active>.0001);
 await page.getByTestId('music').click();await page.waitForTimeout(1800);
 assert.equal(await page.getByTestId('music').getAttribute('aria-pressed'),'false');const muted=await page.evaluate(rms);assert.ok(muted<active*.01);
 await page.getByTestId('toggle').click();assert.equal(await page.getByTestId('music').getAttribute('aria-pressed'),'false');
 await page.getByTestId('music').click();await page.waitForTimeout(1000);assert.equal(await page.getByTestId('music').getAttribute('aria-pressed'),'true');
 assert.deepEqual(errors,[]);console.log(JSON.stringify({noAutoplay:true,firstClickStarts:true,audibleSignal:active,mutedSignal:muted,mutePersists:true,resume:true,errors}));
}finally{await browser.close();}
