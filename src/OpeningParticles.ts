import { CosmicAtmosphere } from './CosmicAtmosphere';
import { dreamPalette, cakePalette } from './DreamPalette';
import { drawSpectralHalo } from './SpectralHalo';
import { randomGenerator } from './motion';

export type OpeningShape = 'orbit' | '3' | '2' | '1' | 'name' | 'birthday' | 'heart' | 'burst';
type Point = { x:number; y:number; z:number };
type Spark = { x:number; y:number; vx:number; vy:number; life:number; max:number; color:number };
/** Stable particle identities morph between sampled lettering, an orbit and a heart. */
export class OpeningParticles {
  private ctx:CanvasRenderingContext2D;
  private rng=randomGenerator(20261126);
  private width=1; private height=1; private size=1; private desiredSize=1; private centerY=0; private desiredY=0; private raf=0; private last=0; private time=0;
  private shape:OpeningShape='orbit'; private points:Point[]=[]; private targets:Point[]=[];
  private phases:number[]=[]; private depths:number[]=[];
  private atmosphere=new CosmicAtmosphere(innerWidth<700?190:280);
  private parallax={x:0,y:0};
  private pointer={x:0,y:0,active:false}; private sparks:Spark[]=[];
  private observer:ResizeObserver; private cache=new Map<string,Point[]>();
  private count:number; private reduced:boolean; private burstAge=0; private sparkClock=0;
  constructor(private canvas:HTMLCanvasElement,private name:string) {
    const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas unavailable');this.ctx=ctx;
    this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.count=this.reduced?850:innerWidth<700?1700:2600;
    this.points=Array.from({length:this.count},()=>({x:(this.rng()-.5)*2,y:(this.rng()-.5)*1.4,z:(this.rng()-.5)*.7}));
    this.phases=this.points.map(()=>this.rng()*Math.PI*2);this.depths=this.points.map(()=>this.rng());
    this.observer=new ResizeObserver(this.resize);this.observer.observe(canvas);this.resize();
    this.morph('orbit');this.raf=requestAnimationFrame(this.draw);
  }
  private resize=()=>{
    this.width=this.canvas.clientWidth;this.height=this.canvas.clientHeight;
    this.fitVisual();
    if(this.size===1){this.size=this.desiredSize;this.centerY=this.desiredY;}
    const dpr=Math.min(devicePixelRatio||1,innerWidth<700?1.75:1.5);
    this.canvas.width=Math.round(this.width*dpr);this.canvas.height=Math.round(this.height*dpr);
    this.ctx.setTransform(dpr,0,0,dpr,0,0);
  };
  private fitVisual(){
    const rect=this.canvas.getBoundingClientRect();
    const copy=this.canvas.parentElement?.querySelector('.opening-copy')?.getBoundingClientRect();
    const controls=this.canvas.parentElement?.querySelector('.opening-bottom')?.getBoundingClientRect();
    const top=copy?copy.bottom-rect.top+20:this.height*.28;
    const bottom=controls?controls.top-rect.top-20:this.height*.73;
    this.desiredY=(top+bottom)/2;
    this.desiredSize=Math.max(100,Math.min(this.width*.87,this.height*.55,720,(bottom-top)/.9));
  }
  private letters(value:string):Point[] {
    const mask=document.createElement('canvas');mask.width=960;mask.height=400;
    const ctx=mask.getContext('2d')!;ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';
    const numeral=/^[123]$/.test(value);let size=numeral?340:value==='生日快乐'?205:220;
    ctx.font=`${numeral?600:400} ${size}px ${value==='生日快乐'?'BirthdayOpening':'Fredoka'}, sans-serif`;
    while(ctx.measureText(value).width>880){size-=4;ctx.font=`${numeral?600:400} ${size}px ${value==='生日快乐'?'BirthdayOpening':'Fredoka'}, sans-serif`;}
    ctx.fillText(value,480,208);
    const pixels=ctx.getImageData(0,0,960,400).data;const points:Point[]=[];
    for(let y=0;y<400;y+=3)for(let x=0;x<960;x+=3)if(pixels[(y*960+x)*4+3]>160)points.push({x:(x-480)/960*(numeral?1.42:.88),y:(y-200)/960*(numeral?1.42:.88),z:0});
    return points;
  }
  morph(shape:OpeningShape) {
    this.shape=shape;this.burstAge=0;this.fitVisual();
    if(!this.cache.has(shape)){
      let samples:Point[]=[];
      if(['3','2','1','name','birthday'].includes(shape))samples=this.letters(shape==='name'?this.name:shape==='birthday'?'生日快乐':shape);
      const positions=this.points.map((_,i)=>{
        if(samples.length){const p=samples[Math.floor(this.rng()*samples.length)];return {x:p.x+(this.rng()-.5)*.002,y:p.y+(this.rng()-.5)*.002,z:(this.rng()-.5)*.045};}
        const angle=this.phases[i];
        if(shape==='heart'){
          const t=i/this.count*Math.PI*2;const shell=i%4===0?Math.sqrt(this.rng()):.92+this.rng()*.08;
          return {x:16*Math.sin(t)**3/40*shell,y:-(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))/40*shell,z:(this.rng()-.5)*.16};
        }
        if(shape==='burst'){const r=.7+this.rng()*1.9;return{x:Math.cos(angle)*r,y:Math.sin(angle)*r,z:-.7+this.rng()*2};}
        const radius=.30+Math.pow(this.rng(),.7)*.13;
        return {x:Math.cos(angle)*radius,y:Math.sin(angle)*radius*.84+(this.rng()-.5)*.024,z:Math.sin(angle)*radius*.19};
      });this.cache.set(shape,positions);
    }
    this.targets=this.cache.get(shape)!;
    if(shape==='burst')for(let i=0;i<5;i++)this.bloom(this.width*(.18+i*.16),this.height*(.30+(i%2)*.17));
  }
  move(x:number,y:number,active=true){this.pointer={x,y,active};}
  bloom(x:number,y:number){
    if(this.reduced)return;
    for(let i=0;i<70;i++){const angle=this.rng()*Math.PI*2,speed=30+this.rng()*100,life=.7+this.rng()*1.2;this.sparks.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life,max:life,color:Math.floor(this.rng()*dreamPalette.length)});}
    if(this.sparks.length>650)this.sparks.splice(0,this.sparks.length-650);
  }
  private draw=(now:number)=>{
    this.raf=requestAnimationFrame(this.draw);if(document.hidden){this.last=now;return;}
    if(now-this.last<(this.reduced?65:22))return;
    const dt=Math.min((now-(this.last||now-16))/1000,.05);this.last=now;this.time+=dt;this.burstAge+=dt;
    const framing=1-Math.exp(-dt*4);this.centerY+=(this.desiredY-this.centerY)*framing;this.size+=(this.desiredSize-this.size)*framing;
    const {ctx,width:w,height:h,size}=this;ctx.clearRect(0,0,w,h);
    const cx=w/2,cy=this.centerY;const t=this.reduced?0:this.time;
    const pointerEase=1-Math.exp(-dt*2.4);
    this.parallax.x+=((this.pointer.active?this.pointer.x/w*2-1:0)-this.parallax.x)*pointerEase;
    this.parallax.y+=((this.pointer.active?this.pointer.y/h*2-1:0)-this.parallax.y)*pointerEase;
    this.atmosphere.draw(ctx,w,h,t,1,this.parallax.x,this.parallax.y,this.reduced);
    ctx.globalAlpha=1;
    const glow=ctx.createRadialGradient(cx,cy,0,cx,cy,size*.62);glow.addColorStop(0,this.shape==='heart'?cakePalette[1]+'23':cakePalette[5]+'20');glow.addColorStop(1,'#11132c00');ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
    const orbit=this.shape==='orbit';const lettering=['3','2','1','name','birthday'].includes(this.shape);const fading=this.shape==='burst'?Math.max(0,1-(this.burstAge-.7)/1.5):1;
    drawSpectralHalo(ctx,cx,cy,size*.36,t,orbit ? .86 : this.shape==='burst' ? .36*fading : lettering ? .12 : .18,orbit);
    // One soft glow layer is cheaper and clearer than per-particle canvas shadows.
    ctx.globalCompositeOperation='lighter';
    for(let i=0;i<this.count;i++){
      const p=this.points[i],target=this.targets[i];if(!target)continue;
      let tx=target.x,ty=target.y,tz=target.z;
      if(orbit){const a=t*.19,cos=Math.cos(a),sin=Math.sin(a);tx=target.x*cos-target.z*sin;tz=target.x*sin+target.z*cos;ty=target.y+Math.sin(t*.95+this.phases[i])*.012;}
      // The glyph stays readable while each star drifts on its own seeded orbit.
      // Keep cached targets unchanged: motion is continuous, never re-randomized.
      if(!this.reduced&&!orbit&&this.shape!=='burst'){
        const phase=this.phases[i],depth=this.depths[i];
        const drift = lettering ? .005+depth*.009 : .006+depth*.007;
        tx+=Math.sin(t*(.65+depth*.35)+phase)*drift;
        ty+=Math.cos(t*(.55+depth*.3)+phase*1.7)*drift;
        tz+=Math.sin(t*.62+phase)*.06;
        if(i%31===0){tx+=Math.sin(t*.55+phase)*.018;ty+=Math.cos(t*.45+phase)*.018;}
      }
      const ease=1-Math.exp(-dt*(this.shape==='burst'?2.3:6));p.x+=(tx-p.x)*ease;p.y+=(ty-p.y)*ease;p.z+=(tz-p.z)*ease;
      const perspective=1/(1-p.z*.55);let x=cx+p.x*size*perspective,y=cy+p.y*size*perspective;
      if(this.pointer.active&&!this.reduced){const dx=x-this.pointer.x,dy=y-this.pointer.y,dist=Math.hypot(dx,dy);if(dist<85&&dist>1){const force=(1-dist/85)*(orbit?-13:20);x+=dx/dist*force;y+=dy/dist*force;}}
      const shimmer=this.reduced?1:.62+Math.sin(t*(1.05+this.depths[i]*.65)+this.phases[i])*.25+Math.sin(t*.63+this.phases[i]*2.1)*.13;
      const radius=(.5+this.depths[i]*.85)*perspective*(.85+shimmer*.25)*(lettering?.84:1);
      ctx.globalAlpha=(.32+this.depths[i]*.54)*shimmer*fading*(lettering?.72:1);
      ctx.fillStyle=lettering?(i%4===0?'#e4ebf8':'#ffffff'):this.shape==='heart'?(i%4?dreamPalette[1]:dreamPalette[i%dreamPalette.length]):dreamPalette[i%dreamPalette.length];
      ctx.beginPath();ctx.arc(x,y,Math.max(.3,radius),0,Math.PI*2);ctx.fill();
      if(i%19===0){
        const alpha=ctx.globalAlpha;ctx.fillStyle=dreamPalette[i%dreamPalette.length];ctx.globalAlpha=alpha*.12;ctx.beginPath();ctx.arc(x,y,radius*7,0,Math.PI*2);ctx.fill();
        ctx.globalAlpha=alpha*.18;ctx.beginPath();ctx.arc(x,y,radius*3.5,0,Math.PI*2);ctx.fill();
        if(shimmer>.74){ctx.globalAlpha=alpha*(shimmer-.65);ctx.strokeStyle=ctx.fillStyle;ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(x-radius*4,y);ctx.lineTo(x+radius*4,y);ctx.moveTo(x,y-radius*5);ctx.lineTo(x,y+radius*5);ctx.stroke();}
      }
    }
    if(orbit){
      const a=t*.35;for(let i=0;i<2;i++){const angle=a+i*Math.PI,x=cx+Math.cos(angle)*size*.33,y=cy+Math.sin(angle)*size*.29;
        const halo=ctx.createRadialGradient(x,y,0,x,y,24);const color=dreamPalette[i?1:4];halo.addColorStop(0,'#fffffff0');halo.addColorStop(.12,color+'d0');halo.addColorStop(.45,color+'44');halo.addColorStop(1,color+'00');ctx.globalAlpha=1;ctx.fillStyle=halo;ctx.fillRect(x-24,y-24,48,48);
      }
    }
    if(this.shape==='burst'&&!this.reduced){this.sparkClock+=dt;if(this.sparkClock>.38&&this.burstAge<1.4){this.sparkClock=0;this.bloom(w*(.18+this.rng()*.64),h*(.2+this.rng()*.4));}}
    for(const s of this.sparks){s.life-=dt;s.x+=s.vx*dt;s.y+=s.vy*dt;s.vx*=Math.exp(-dt*.65);s.vy+=18*dt;ctx.globalAlpha=Math.max(0,s.life/s.max)*.8;ctx.strokeStyle=dreamPalette[s.color];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(s.x-s.vx*.025,s.y-s.vy*.025);ctx.stroke();}
    this.sparks=this.sparks.filter(s=>s.life>0);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
  };
  dispose(){cancelAnimationFrame(this.raf);this.observer.disconnect();this.sparks=[];this.cache.clear();}
}
