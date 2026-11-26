import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { birthdayConfig as config } from './config';
import { OpeningParticles, type OpeningShape } from './OpeningParticles';
import './opening.css';

type Phase='invitation'|'countdown'|'name'|'birthday'|'wish'|'release'|'reveal';
interface Props { onComplete:()=>void; onReveal:()=>void; onStart:()=>void; sound:boolean; onToggleSound:()=>void }
export function Opening({onComplete,onReveal,onStart,sound,onToggleSound}:Props){
  const [phase,setPhase]=useState<Phase>('invitation');const [count,setCount]=useState(3);
  const [canvasReady,setCanvasReady]=useState(false);
  const canvas=useRef<HTMLCanvasElement>(null);const engine=useRef<OpeningParticles|null>(null);
  const callbacks=useRef({onComplete,onReveal,onStart});callbacks.current={onComplete,onReveal,onStart};
  const reduced=useRef(matchMedia('(prefers-reduced-motion: reduce)').matches);
  const started=useRef(false);const finishing=useRef(false);
  useEffect(()=>{if(!canvas.current)return;let cancelled=false;
    const init=()=>{if(cancelled)return;try{engine.current=new OpeningParticles(canvas.current!,config.name);setCanvasReady(true);}catch{setCanvasReady(false);}};
    document.fonts.ready.then(init,init);return()=>{cancelled=true;engine.current?.dispose();engine.current=null;};
  },[]);
  useEffect(()=>{
    let timer:number|undefined;
    const shape:OpeningShape=phase==='invitation'?'orbit':phase==='countdown'?String(count) as OpeningShape:phase==='name'?'name':phase==='birthday'?'birthday':phase==='wish'?'heart':'burst';
    engine.current?.morph(shape);
    const later=(fn:()=>void,ms:number)=>{timer=window.setTimeout(fn,ms);};
    if(phase==='countdown')later(()=>count>1?setCount(count-1):setPhase('name'),reduced.current?650:config.opening.countdownBeatMs);
    if(phase==='name')later(()=>setPhase('birthday'),reduced.current?1000:2100);
    if(phase==='birthday')later(()=>setPhase('wish'),reduced.current?1000:2400);
    if(phase==='release')later(()=>{callbacks.current.onReveal();setPhase('reveal');},reduced.current?150:1400);
    if(phase==='reveal')later(()=>callbacks.current.onComplete(),reduced.current?150:1000);
    return()=>clearTimeout(timer);
  },[phase,count,canvasReady]);
  const start=()=>{if(started.current)return;started.current=true;callbacks.current.onStart();setPhase('countdown');};
  const release=()=>{if(finishing.current)return;finishing.current=true;setPhase('release');};
  const skip=()=>{if(finishing.current)return;finishing.current=true;callbacks.current.onStart();callbacks.current.onReveal();setPhase('reveal');};
  const stageTitle=phase==='countdown'?String(count):phase==='name'?config.name:phase==='birthday'?'生日快乐':phase==='wish'?'把愿望，交给星空':phase==='release'?'愿望已送达':'一整个宇宙，正在为你亮起';
  return <section className={`opening opening--${phase}`} data-testid="opening" data-phase={phase} aria-label="专属生日序章">
    <div className="opening-nebula" aria-hidden="true"/>
    <canvas ref={canvas} className="opening-canvas" aria-hidden="true" onPointerMove={e=>{engine.current?.move(e.clientX,e.clientY);}} onPointerLeave={()=>engine.current?.move(0,0,false)} onPointerDown={e=>{engine.current?.move(e.clientX,e.clientY);engine.current?.bloom(e.clientX,e.clientY);}} onPointerUp={e=>{if(e.pointerType!=='mouse')engine.current?.move(0,0,false);}} onPointerCancel={()=>engine.current?.move(0,0,false)}/>
    <div className="opening-frame" aria-hidden="true"/>
    <header className="opening-top"><span>FOR {config.name.toUpperCase()} <i>✦</i> ONLY YOU</span><button onClick={skip} data-testid="skip-opening">直接看蛋糕</button></header>
    <div className="opening-copy" key={phase==='countdown'?'countdown':phase}>
      <p className="opening-eyebrow">{phase==='invitation'?'SOME STARS ARE MEANT TO MEET':phase==='countdown'?'YOUR LITTLE UNIVERSE IS WAKING UP':phase==='wish'?'MAKE A WISH':'A MOMENT THAT BELONGS TO US'}</p>
      {phase==='invitation'?<><h2>有一整个宇宙<br/>想对你说<span>生日快乐</span></h2><p className="opening-subtitle">{config.opening.invitation}</p></>:<><h2 className="opening-small-title">{phase==='countdown'?'让惊喜，慢慢靠近你':phase==='name'?'万千星光，只为你而来':phase==='birthday'?'今天，你是宇宙的中心':phase==='wish'?'闭上眼，许一个愿望':phase==='release'?'每一个明天，都想陪你':'这是属于我们的生日宇宙'}</h2></>}
    </div>
    <div className="opening-announcement" aria-live="polite" aria-atomic="true">{stageTitle}</div>
    {!canvasReady&&phase!=='invitation'&&<div className="opening-text-fallback">{stageTitle}</div>}
    <div className="opening-bottom">
      {phase==='invitation'&&<><p className="opening-orbit-note">两颗星的相遇，成为我们的宇宙</p><button className="opening-primary" onClick={start} data-testid="start-opening"><span>✦</span> 开启专属生日</button><p className="opening-hint">轻触或划过星光，看看它的回应</p></>}
      {phase==='countdown'&&<><p className="opening-caption">把所有温柔，慢慢交到你手里</p><div className="opening-beats" aria-hidden="true">{[3,2,1].map(n=><i className={n>=count?'lit':''} key={n}/>)}</div></>}
      {(phase==='name'||phase==='birthday')&&<p className="opening-caption">{phase==='name'?config.opening.nameMessage:config.dedication}</p>}
      {phase==='wish'&&<><p className="opening-caption">{config.opening.wishMessage}</p><button className="opening-primary" onClick={release} data-testid="release-wish"><span>✧</span> 许好啦，点亮这一岁</button><p className="opening-hint">愿望留在心里，星光替你记住</p></>}
      {(phase==='release'||phase==='reveal')&&<p className="opening-caption">{config.opening.closingMessage}</p>}
    </div>
    <button className={`opening-sound ${sound?'is-playing':''}`} aria-label={sound?'关闭背景音乐':'播放背景音乐'} aria-pressed={sound} onClick={onToggleSound}><span aria-hidden="true">{[0,1,2,3].map(i=><i key={i} style={{'--i':i} as CSSProperties}/>)}</span>{sound?'音乐已开启':'开启音乐'}</button>
  </section>;
}
