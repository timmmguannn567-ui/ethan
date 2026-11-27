import { useEffect, useRef } from 'react';
import { drawSpectralHalo } from './SpectralHalo';
import { CosmicAtmosphere } from './CosmicAtmosphere';

/** Local, deterministic star field. No image download, camera or remote service. */
export function CosmicBackdrop() {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = canvas.current!; const ctx = el.getContext('2d'); if (!ctx) return;
    const atmosphere=new CosmicAtmosphere(180);
    let w=1,h=1,raf=0,last=0; const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const resize=()=>{w=el.clientWidth;h=el.clientHeight;const dpr=Math.min(devicePixelRatio,1.5);el.width=w*dpr;el.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);};
    const observer=new ResizeObserver(resize);observer.observe(el);resize();
    const draw=(now:number)=>{
      raf=requestAnimationFrame(draw);if(document.hidden||now-last<40)return;last=now;
      const t=reduced?0:now*.00008;ctx.clearRect(0,0,w,h);
      drawSpectralHalo(ctx,w*.5,h*.59,Math.min(w*.52,h*.28,360),t*8,.12,false);
      atmosphere.draw(ctx,w,h,t*12,.65,0,0,reduced);
    };raf=requestAnimationFrame(draw);
    return()=>{cancelAnimationFrame(raf);observer.disconnect();};
  },[]);
  return <div className="cosmos" aria-hidden="true"><div className="nebula nebula-blue"/><div className="nebula nebula-violet"/><div className="cosmic-haze"/><canvas ref={canvas}/><div className="cosmic-vignette"/></div>;
}
