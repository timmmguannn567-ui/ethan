import { dreamPalette } from './DreamPalette';
import { randomGenerator } from './motion';

/** Seeded stars travel in depth, fading before they wrap back into the distance. */
export class CosmicAtmosphere {
  private stars: { angle:number; radius:number; depth:number; phase:number; color:string }[];
  constructor(count=190){
    const rng=randomGenerator(9461);
    this.stars=Array.from({length:count},()=>({angle:rng()*Math.PI*2,radius:.15+rng()*.85,depth:rng(),phase:rng()*Math.PI*2,color:dreamPalette[Math.floor(rng()*dreamPalette.length)]}));
  }
  draw(ctx:CanvasRenderingContext2D,w:number,h:number,time:number,strength=1,px=0,py=0,reduced=false){
    const t=reduced?0:time;
    if(reduced){px=0;py=0;}
    ctx.save();ctx.globalCompositeOperation='lighter';
    for(const s of this.stars){
      const depth=(s.depth+t*.023)%1,scale=.25+depth*1.15;
      const a=s.angle+t*(.018+s.depth*.012);
      const x=w*.5+Math.cos(a)*s.radius*w*.82*scale+px*depth*12;
      const y=h*.51+Math.sin(a)*s.radius*h*.8*scale+py*depth*12;
      const fade=Math.min(1,depth*8,(1-depth)*7);
      const shine=.66+Math.sin(t*(.7+s.depth)+s.phase)*.25;
      const alpha=fade*(.18+depth*.48)*shine*strength;
      const r=.35+depth*1.05;
      ctx.globalAlpha=alpha;ctx.fillStyle=s.color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
      if(s.depth>.85){
        ctx.globalAlpha=alpha*.09;ctx.beginPath();ctx.arc(x,y,r*6,0,Math.PI*2);ctx.fill();
        ctx.globalAlpha=alpha*.45;ctx.strokeStyle=s.color;ctx.lineWidth=.5;ctx.beginPath();ctx.moveTo(x-r*3,y);ctx.lineTo(x+r*3,y);ctx.moveTo(x,y-r*3);ctx.lineTo(x,y+r*3);ctx.stroke();
      }
    }
    // Rare, slow shooting stars stay outside the central text and cake silhouette.
    if(!reduced)for(let i=0;i<2;i++){
      const p=((t+i*6.7)%14)/2.4;if(p>1)continue;
      const x=w*(i?.95:.07)+(i?-1:1)*p*w*.34,y=h*(.24+i*.22)+p*h*.18;
      const dx=(i?-1:1)*Math.min(w*.13,90),dy=h*.055;
      const trail=ctx.createLinearGradient(x-dx,y-dy,x,y);
      trail.addColorStop(0,'#b481ef00');trail.addColorStop(.8,dreamPalette[i?1:4]+'66');trail.addColorStop(1,'#ffffffcc');
      ctx.globalAlpha=Math.sin(p*Math.PI)*strength*.65;ctx.strokeStyle=trail;ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(x-dx,y-dy);ctx.lineTo(x,y);ctx.stroke();
    }
    ctx.restore();
  }
}
