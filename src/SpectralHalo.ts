import { spectralPalette } from './DreamPalette';

/** Procedural obsidian / spectral light: no raster asset or remote request. */
export function drawSpectralHalo(ctx:CanvasRenderingContext2D,cx:number,cy:number,r:number,time:number,intensity=1,chrome=true){
  const colors=spectralPalette;
  ctx.save();ctx.translate(cx,cy);ctx.rotate(-.26+Math.sin(time*.22)*.055);ctx.scale(1,.88+Math.sin(time*.28)*.025);
  // An almost black, reflective shell leaves the center empty for the particles.
  if(chrome){
    ctx.globalAlpha=intensity;
    const metal=ctx.createLinearGradient(-r,-r,r,r);
    metal.addColorStop(0,'#030407');metal.addColorStop(.17,'#303943');metal.addColorStop(.23,'#8b9299');metal.addColorStop(.27,'#292e36');metal.addColorStop(.43,'#080b10');metal.addColorStop(.7,'#020305');metal.addColorStop(.83,'#414953');metal.addColorStop(1,'#07090d');
    ctx.strokeStyle=metal;ctx.lineWidth=r*.17;ctx.beginPath();ctx.arc(0,0,r*1.02,.13,Math.PI*1.88);ctx.stroke();
    ctx.lineWidth=.65;ctx.strokeStyle='#d4dde68c';ctx.beginPath();ctx.arc(0,0,r*1.105,Math.PI*1.03,Math.PI*1.66);ctx.stroke();
    ctx.strokeStyle='#707e8d44';ctx.beginPath();ctx.arc(0,0,r*.935,Math.PI*.16,Math.PI*.82);ctx.stroke();
  }
  ctx.globalCompositeOperation='lighter';
  // Cake-colored reflected light blooms softly over the chrome and surrounding void.
  for(let i=0;i<colors.length;i++){
    const a=i/colors.length*Math.PI*2+time*.1,x=Math.cos(a)*r*.86,y=Math.sin(a)*r*.86;
    const glow=ctx.createRadialGradient(x,y,0,x,y,r*.6);
    glow.addColorStop(0,colors[i]+'38');glow.addColorStop(.4,colors[i]+'16');glow.addColorStop(1,colors[i]+'00');
    ctx.globalAlpha=intensity;ctx.fillStyle=glow;ctx.fillRect(x-r*.6,y-r*.6,r*1.2,r*1.2);
  }
  // Layered open arcs form a colored light ribbon, with a restrained glow pass.
  for(let i=0;i<30;i++){
    const radius=r*(.72+i*.0064),offset=Math.sin(i*2.7)*.035;
    const travel=time*(i%2===0?.075:-.055);
    const start=.16+offset+travel,end=Math.PI*1.94+offset+travel;
    ctx.strokeStyle=colors[i%colors.length];ctx.lineCap='round';
    ctx.globalAlpha=intensity*(.38+(i%4)*.13);ctx.lineWidth=i%6===0?1.45:.7;
    ctx.beginPath();ctx.arc(0,0,radius,start,end);ctx.stroke();
    if(i%5===0){ctx.globalAlpha=intensity*.08;ctx.lineWidth=8;ctx.stroke();}
    // Small moving highlights suggest light travelling through the ring.
    if(i%3===0){const a=(time*(.38+i*.006)+i*.69)%(Math.PI*2);ctx.globalAlpha=intensity*.7;ctx.lineWidth=.8;ctx.beginPath();ctx.arc(0,0,radius,a,a+.18);ctx.stroke();}
  }
  // Sparse strands escape the right edge, echoing a spectral long exposure.
  for(let i=0;i<9;i++){
    const y=(-.65+i*.155)*r,x=Math.sqrt(Math.max(0,r*r-y*y))*.92;
    ctx.globalAlpha=intensity*(.1+.07*Math.sin(time*.6+i));ctx.strokeStyle=colors[i%colors.length];ctx.lineWidth=.6;
    ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x+r*.25,y-r*.06,x+r*.3,y-r*.12,x+r*.9,y-r*.12);ctx.stroke();
  }
  ctx.globalCompositeOperation='source-over';
  // Faceted mineral fragments remain outside the lettering / photograph area.
  if(chrome)for(let i=0;i<26;i++){
    const a=i*2.399+time*.035,dist=r*(1.13+(i%7)*.035),x=Math.cos(a)*dist,y=Math.sin(a)*dist,s=1+(i%4)*.65;
    ctx.save();ctx.translate(x,y);ctx.rotate(a+time*.04);ctx.globalAlpha=intensity*(.25+(i%4)*.12);
    ctx.fillStyle=i%3===0?'#d1d9e0':'#485660';ctx.beginPath();ctx.moveTo(-s,-s*.3);ctx.lineTo(s*.2,-s);ctx.lineTo(s,s*.4);ctx.lineTo(-s*.2,s*.75);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#f2f5ff8c';ctx.lineWidth=.4;ctx.beginPath();ctx.moveTo(-s,-s*.3);ctx.lineTo(s*.2,-s);ctx.lineTo(s,s*.4);ctx.stroke();ctx.restore();
  }
  ctx.restore();
}
