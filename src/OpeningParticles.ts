import { randomGenerator } from './motion';

export type OpeningShape = 'orbit' | '3' | '2' | '1' | 'name' | 'birthday' | 'heart' | 'burst';
type Point = { x:number; y:number; z:number };
type Spark = { x:number; y:number; vx:number; vy:number; life:number; max:number; color:number };
/** Stable particle identities morph between sampled lettering, an orbit and a heart. */
export class OpeningParticles {
  private ctx:CanvasRenderingContext2D;
  private rng=randomGenerator(20261126);
  private width=1; private height=1; private size=1; private raf=0; private last=0; private time=0;
  private shape:OpeningShape='orbit'; private points:Point[]=[]; private targets:Point[]=[];
  private phases:number[]=[]; private depths:number[]=[]; private stars:Point[]=[];
  private pointer={x:0,y:0,active:false}; private sparks:Spark[]=[];
  private observer:ResizeObserver; private cache=new Map<string,Point[]>();
  private count:number; private reduced:boolean; private burstAge=0; private sparkClock=0;
  constructor(private canvas:HTMLCanvasElement,private name:string) {
    const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas unavailable');this.ctx=ctx;
    this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.count=this.reduced?850:innerWidth<700?1700:2600;
    this.points=Array.from({length:this.count},()=>({x:(this.rng()-.5)*2,y:(this.rng()-.5)*1.4,z:(this.rng()-.5)*.7}));
    this.phases=this.points.map(()=>this.rng()*Math.PI*2);this.depths=this.points.map(()=>this.rng());
    this.stars=Array.from({length:140},()=>({x:this.rng(),y:this.rng(),z:this.rng()}));
    this.observer=new ResizeObserver(this.resize);this.observer.observe(canvas);this.resize();
    this.morph('orbit');this.raf=requestAnimationFrame(this.draw);
  }
  private resize=()=>{
    this.width=this.canvas.clientWidth;this.height=this.canvas.clientHeight;
    this.size=Math.min(this.width*.87,this.height*.55,720);
    const dpr=Math.min(devicePixelRatio||1,innerWidth<700?1.75:1.5);
    this.canvas.width=Math.round(this.width*dpr);this.canvas.height=Math.round(this.height*dpr);
    this.ctx.setTransform(dpr,0,0,dpr,0,0);
  };
  private letters(value:string):Point[] {
    const mask=document.createElement('canvas');mask.width=960;mask.height=400;
    const ctx=mask.getContext('2d')!;ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';
    const numeral=/^[123]$/.test(value);let size=numeral?340:value==='生日快乐'?205:220;
    ctx.font=`${numeral?600:400} ${size}px ${value==='生日快乐'?'BirthdayOpening':'Fredoka'}, sans-serif`;
    while(ctx.measureText(value).width>880){size-=4;ctx.font=`${numeral?600:400} ${size}px ${value==='生日快乐'?'BirthdayOpening':'Fredoka'}, sans-serif`;}
    ctx.fillText(value,480,208);
    const pixels=ctx.getImageData(0,0,960,400).data;const points:Point[]=[];
    for(let y=0;y<400;y+=3)for(let x=0;x<960;x+=3)if(pixels[(y*960+x)*4+3]>160)points.push({x:(x-480)/960*(numeral?1.65:1),y:(y-200)/960*(numeral?1.65:1),z:0});
    return points;
  }
  morph(shape:OpeningShape) {
    this.shape=shape;this.burstAge=0;
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
        const radius=.11+Math.pow(this.rng(),.65)*.35;
        return {x:Math.cos(angle)*radius,y:Math.sin(angle)*radius*.32+(this.rng()-.5)*.045,z:Math.sin(angle)*radius*.55};
      });this.cache.set(shape,positions);
    }
    this.targets=this.cache.get(shape)!;
    if(shape==='burst')for(let i=0;i<5;i++)this.bloom(this.width*(.18+i*.16),this.height*(.30+(i%2)*.17));
  }
  move(x:number,y:number,active=true){this.pointer={x,y,active};}
  bloom(x:number,y:number){
    if(this.reduced)return;
    for(let i=0;i<70;i++){const angle=this.rng()*Math.PI*2,speed=30+this.rng()*100,life=.7+this.rng()*1.2;this.sparks.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life,max:life,color:Math.floor(this.rng()*3)});}
    if(this.sparks.length>650)this.sparks.splice(0,this.sparks.length-650);
  }
  private draw=(now:number)=>{
    this.raf=requestAnimationFrame(this.draw);if(document.hidden){this.last=now;return;}
    if(now-this.last<(this.reduced?65:22))return;
    const dt=Math.min((now-(this.last||now-16))/1000,.05);this.last=now;this.time+=dt;this.burstAge+=dt;
    const {ctx,width:w,height:h,size}=this;ctx.clearRect(0,0,w,h);
    const cx=w/2,cy=h*.48;const t=this.reduced?0:this.time;
    for(const star of this.stars){ctx.globalAlpha=.16+star.z*.36+Math.sin(t*.6+star.x*60)*.1;ctx.fillStyle=star.z>.5?'#b7cfff':'#f8cbdf';ctx.beginPath();ctx.arc(star.x*w,star.y*h,.4+star.z*.7,0,Math.PI*2);ctx.fill();}
    ctx.globalAlpha=1;
    const glow=ctx.createRadialGradient(cx,cy,0,cx,cy,size*.62);glow.addColorStop(0,this.shape==='heart'?'#a6366817':'#527cdc14');glow.addColorStop(1,'#11132c00');ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
    const orbit=this.shape==='orbit';const fading=this.shape==='burst'?Math.max(0,1-(this.burstAge-.7)/1.5):1;
    // One soft glow layer is cheaper and clearer than per-particle canvas shadows.
    ctx.globalCompositeOperation='lighter';
    for(let i=0;i<this.count;i++){
      const p=this.points[i],target=this.targets[i];if(!target)continue;
      let tx=target.x,ty=target.y,tz=target.z;
      if(orbit){const a=t*.14,cos=Math.cos(a),sin=Math.sin(a);tx=target.x*cos-target.z*sin;tz=target.x*sin+target.z*cos;ty=target.y+Math.sin(t*.8+this.phases[i])*.008;}
      const ease=1-Math.exp(-dt*(this.shape==='burst'?2.3:6));p.x+=(tx-p.x)*ease;p.y+=(ty-p.y)*ease;p.z+=(tz-p.z)*ease;
      const perspective=1/(1-p.z*.55);let x=cx+p.x*size*perspective,y=cy+p.y*size*perspective;
      if(this.pointer.active&&!this.reduced){const dx=x-this.pointer.x,dy=y-this.pointer.y,dist=Math.hypot(dx,dy);if(dist<85&&dist>1){const force=(1-dist/85)*(orbit?-13:20);x+=dx/dist*force;y+=dy/dist*force;}}
      const shimmer=this.reduced?1:.78+Math.sin(t*1.3+this.phases[i])*.22;
      const radius=(.55+this.depths[i]*.8)*perspective;
      ctx.globalAlpha=(.32+this.depths[i]*.54)*shimmer*fading;
      ctx.fillStyle=this.shape==='heart'?(i%3?'#ffc7e0':'#b8c9ff'):(i%3===0?'#f5bad6':i%3===1?'#c9b4f4':'#aed3f2');
      ctx.beginPath();ctx.arc(x,y,Math.max(.3,radius),0,Math.PI*2);ctx.fill();
      if(i%45===0){ctx.globalAlpha*=.18;ctx.beginPath();ctx.arc(x,y,radius*4,0,Math.PI*2);ctx.fill();}
    }
    if(orbit){
      const a=t*.35;for(let i=0;i<2;i++){const angle=a+i*Math.PI,x=cx+Math.cos(angle)*size*.27,y=cy+Math.sin(angle)*size*.10;
        const halo=ctx.createRadialGradient(x,y,0,x,y,24);halo.addColorStop(0,i?'#ffd4ebff':'#d4f4ffff');halo.addColorStop(.12,i?'#ffa3d0bb':'#a9daffbb');halo.addColorStop(1,'#aabbff00');ctx.globalAlpha=1;ctx.fillStyle=halo;ctx.fillRect(x-24,y-24,48,48);
      }
    }
    if(this.shape==='burst'&&!this.reduced){this.sparkClock+=dt;if(this.sparkClock>.38&&this.burstAge<1.4){this.sparkClock=0;this.bloom(w*(.18+this.rng()*.64),h*(.2+this.rng()*.4));}}
    for(const s of this.sparks){s.life-=dt;s.x+=s.vx*dt;s.y+=s.vy*dt;s.vx*=Math.exp(-dt*.65);s.vy+=18*dt;ctx.globalAlpha=Math.max(0,s.life/s.max)*.8;ctx.strokeStyle=['#bde6ff','#ffd0e6','#dec7ff'][s.color];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(s.x-s.vx*.025,s.y-s.vy*.025);ctx.stroke();}
    this.sparks=this.sparks.filter(s=>s.life>0);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
  };
  dispose(){cancelAnimationFrame(this.raf);this.observer.disconnect();this.sparks=[];this.cache.clear();}
}
