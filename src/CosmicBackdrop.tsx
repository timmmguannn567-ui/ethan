import { useEffect, useRef } from 'react';
import { randomGenerator } from './motion';

/** Local, deterministic star field. No image download, camera or remote service. */
export function CosmicBackdrop() {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = canvas.current!; const ctx = el.getContext('2d'); if (!ctx) return;
    const rng = randomGenerator(4219);
    const stars = Array.from({length: 210}, (_,i)=>({x:rng(), y:rng(), z:.2+rng()*.8, r:i%23===0?1.4:.25+rng()*.7, phase:rng()*6.28}));
    let w=1,h=1,raf=0,last=0; const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const resize=()=>{w=el.clientWidth;h=el.clientHeight;const dpr=Math.min(devicePixelRatio,1.5);el.width=w*dpr;el.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);};
    const observer=new ResizeObserver(resize);observer.observe(el);resize();
    const draw=(now:number)=>{
      raf=requestAnimationFrame(draw);if(document.hidden||now-last<40)return;last=now;
      const t=reduced?0:now*.00008;ctx.clearRect(0,0,w,h);
      for(const s of stars){
        const x=(s.x*w+Math.sin(t+s.phase)*8*s.z+w)%w;
        const y=(s.y*h+Math.cos(t*.7+s.phase)*5*s.z+h)%h;
        const opacity=.22+s.z*.42+(reduced?0:Math.sin(t*9+s.phase)*.16);
        ctx.fillStyle=`rgba(${s.phase>3?'172,209,255':'226,198,255'},${opacity})`;
        ctx.beginPath();ctx.arc(x,y,s.r,0,Math.PI*2);ctx.fill();
        if(s.r>1.2){ctx.strokeStyle=`rgba(161,217,255,${opacity*.4})`;ctx.lineWidth=.5;ctx.beginPath();ctx.moveTo(x-4,y);ctx.lineTo(x+4,y);ctx.moveTo(x,y-4);ctx.lineTo(x,y+4);ctx.stroke();}
      }
    };raf=requestAnimationFrame(draw);
    return()=>{cancelAnimationFrame(raf);observer.disconnect();};
  },[]);
  return <div className="cosmos" aria-hidden="true"><div className="nebula nebula-blue"/><div className="nebula nebula-violet"/><div className="cosmic-haze"/><canvas ref={canvas}/><div className="cosmic-vignette"/></div>;
}
