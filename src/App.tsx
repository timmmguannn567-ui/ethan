import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { CakeScene } from './CakeScene';
import { CosmicBackdrop } from './CosmicBackdrop';
import { birthdayAudio } from './audio';
import { birthdayConfig as config, caption19, type Photo } from './config';

declare global { interface Window { __birthday?: { snapshot: () => ReturnType<CakeScene['diagnostics']> } } }
const fallback: Photo = { id: 'memory', src: config.placeholder, label: '留给我们的回忆', caption: config.wish, aspect: 400 / 520 };
const photos = config.photos.length ? config.photos : [fallback];
function Arrow({ direction = 'right' }: { direction?: 'left' | 'right' }) { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ transform: direction === 'left' ? 'rotate(180deg)' : undefined }}><path d="m9 5 7 7-7 7M4 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>; }

// Match the 3:4 paper and caption proportions of the original Polaroids.
function usePhotoImage(photo: Photo) {
  const [src,setSrc]=useState(photo.thumbnail || photo.src);
  useEffect(()=>{let active=true;setSrc(photo.thumbnail || photo.src);const full=new Image();full.onload=()=>{if(active)setSrc(photo.src);};full.src=photo.src;return()=>{active=false;full.onload=null;};},[photo]);
  return {src, fallback:()=>setSrc(photo.thumbnail || config.placeholder)};
}
function OriginalCaption({photo}:{photo:Photo}) {
  const reference=config.photos.find(p=>p.id==='19')!;
  const {src,fallback}=usePhotoImage(reference);
  return <figcaption aria-label={photo.caption}><svg viewBox="0 1166 1086 282" aria-hidden="true"><image href={src} width="1086" height="1448" onError={fallback}/></svg><span className="visually-hidden">{photo.caption}</span></figcaption>;
}
function MemoryPhoto({ photo }: { photo: Photo }) {
  const {src,fallback}=usePhotoImage(photo);
  const image = <img className="large-photo" src={src} alt={`${photo.label}：${photo.caption}`} onError={fallback}/>;
  if (photo.captionOverlay) return <figure className="caption-replacement">{image}<figcaption aria-label={photo.caption}><img className="caption-art" src={caption19} alt="" aria-hidden="true"/><span className="visually-hidden">{photo.caption}</span></figcaption></figure>;
  return photo.frame ? <figure className="framed-photo">{image}<OriginalCaption photo={photo}/></figure> : image;
}


export default function App() {
  const host = useRef<HTMLDivElement>(null); const engine = useRef<CakeScene | null>(null);
  const [sound, setSound] = useState(false);
  const musicMuted = useRef(!config.music.enabled);
  useEffect(() => { const visibility=()=>birthdayAudio.visibility(); document.addEventListener('visibilitychange',visibility); return ()=>{document.removeEventListener('visibilitychange',visibility);birthdayAudio.dispose();}; }, []);
  const startMusic = () => { if(!musicMuted.current)void birthdayAudio.start().then(setSound); };
  const toggleMusic = () => { const enabled = !sound; musicMuted.current=!enabled; void birthdayAudio.setEnabled(enabled).then(setSound); };
  const lastFocus = useRef<HTMLElement | null>(null);
  const [expanded, setExpanded] = useState(false); const [loaded, setLoaded] = useState(0); const [failed, setFailed] = useState(false); const [message, setMessage] = useState('');
  const [selected, setSelected] = useState<number | null>(null); const [closing, setClosing] = useState(false);
  const [ready, setReady] = useState(false); const closeButton = useRef<HTMLButtonElement>(null); const dialog = useRef<HTMLDivElement>(null);
  const drag = useRef({ down: false, x: 0, y: 0, travel: 0, id: -1 });
  useEffect(() => {
    if (!host.current) return;
    let scene: CakeScene | undefined; let cancelled=false;
    const initialize=()=>{if(cancelled||!host.current)return;
    try { scene = new CakeScene(host.current, photos, setLoaded, setMessage); engine.current = scene; setReady(true); if (import.meta.env.DEV) window.__birthday = { snapshot: () => scene!.diagnostics() }; }
    catch (error) { console.error('3D scene initialization:', error); setFailed(true); setReady(true); }
    };
    initialize();
    return () => { cancelled=true; scene?.dispose(); engine.current = null; delete window.__birthday; };
  }, []);
  useEffect(() => { engine.current?.setExpanded(expanded); }, [expanded]);
  const openPhoto = (index: number) => { lastFocus.current=document.activeElement as HTMLElement; setSelected(index); };
  const toggle = () => setExpanded(value => !value);
  const close = () => { if (closing) return; setClosing(true); };
  useEffect(() => { if (!closing) return; const timeout = setTimeout(() => { setSelected(null); setClosing(false); lastFocus.current?.focus({preventScroll:true}); }, 300); return () => clearTimeout(timeout); }, [closing]);
  useEffect(() => {
    if (selected === null) return;
    closeButton.current?.focus();
    const keyboard = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setClosing(true);
      if (e.key === 'ArrowRight') setSelected(n => n === null ? null : (n + 1) % photos.length);
      if (e.key === 'ArrowLeft') setSelected(n => n === null ? null : (n - 1 + photos.length) % photos.length);
      if (e.key === 'Tab') { const buttons = dialog.current?.querySelectorAll<HTMLButtonElement>('button'); if (!buttons?.length) return; const first = buttons[0], last = buttons[buttons.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } }
    };
    document.addEventListener('keydown', keyboard); return () => document.removeEventListener('keydown', keyboard);
  }, [selected]);
  const pointerDown = (e: PointerEvent<HTMLDivElement>) => { if (e.button !== 0 || selected !== null) return; drag.current = { down: true, x: e.clientX, y: e.clientY, travel: 0, id: e.pointerId }; e.currentTarget.setPointerCapture(e.pointerId); };
  const pointerMove = (e: PointerEvent<HTMLDivElement>) => { const d = drag.current; if (!d.down) { if(e.pointerType==='mouse'){const r=e.currentTarget.getBoundingClientRect();engine.current?.setParallax((e.clientX-r.left)/r.width-.5,(e.clientY-r.top)/r.height-.5);} return; } if(d.id !== e.pointerId) return; const dx = e.clientX - d.x, dy = e.clientY - d.y; d.travel += Math.hypot(dx, dy); if (d.travel > 6) engine.current?.drag(dx, dy); d.x = e.clientX; d.y = e.clientY; };
  const pointerUp = (e: PointerEvent<HTMLDivElement>) => { if (drag.current.id === e.pointerId) drag.current.down = false; };
  const sceneClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (drag.current.travel >= 7) return;
    const index = engine.current?.pick(e.clientX, e.clientY);
    if (index !== null && index !== undefined) openPhoto(index);
    else toggle();
  };
  const photo = selected !== null ? photos[selected] : null;
  return <main className="birthday" onClickCapture={e=>{if(!(e.target as HTMLElement).closest('.music-toggle'))startMusic();}}>
    <div className="experience" aria-hidden={selected !== null ? true : undefined} inert={selected !== null ? true : undefined}>
      <section className={`hero ${expanded ? 'is-open' : ''}`} onClick={toggle} aria-label="生日弹珠蛋糕">
        <CosmicBackdrop/>
        <button className={`music-toggle ${sound ? 'playing' : ''}`} data-testid="music" aria-label={sound ? '关闭背景音乐' : '播放背景音乐'} aria-pressed={sound} onClick={e=>{e.stopPropagation();toggleMusic();}}><span aria-hidden="true">{[0,1,2,3].map(i=><i key={i}/>)}</span></button>
        <div className="cosmic-coordinate" aria-hidden="true"><span>CC · BIRTHDAY UNIVERSE</span><span>∞ / ONLY YOU</span></div>
        <header className="heading">
          <p className="eyebrow">A UNIVERSE OF WISHES, JUST FOR YOU</p>
          <h1><span>{config.title[0]}</span><em>{config.title[1]}</em></h1>
          {config.age !== null && <span className="age">{config.age} 岁 · 生日快乐</span>}
          <p className="dedication">{config.dedication}</p>
        </header>
        <div className="scene" data-loaded={loaded} ref={host} onClick={sceneClick} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerLeave={()=>engine.current?.setParallax(0,0)} onPointerCancel={() => { drag.current.down = false; }} onLostPointerCapture={() => { drag.current.down = false; }} />
        {!ready && <div className="loading">正在点亮你的生日…</div>}
        {message && <div className="scene-message" role="status">{message}<button onClick={() => location.reload()}>重新加载</button></div>}
        {failed && <div className="fallback"><p>此设备暂时无法显示 3D，仍可轻触照片查看祝福。</p>{photos.map((p,i)=><button key={p.id} onClick={e=>{e.stopPropagation();openPhoto(i);}}><img src={p.thumbnail||p.src} alt={p.label}/></button>)}</div>}
        <footer className="controls" onClick={e=>e.stopPropagation()}>
          <p className="moment-label">{expanded ? `${photos.length} 个瞬间，每一个都关于你` : '把漫天星光，聚成你的生日'}</p>
          <button className="reveal-button" onClick={toggle} aria-expanded={expanded} data-testid="toggle"><span aria-hidden="true">{expanded ? '✧' : '✦'}</span>{expanded ? '重新聚成蛋糕' : '轻触，打开生日惊喜'}</button>
          <p className="gesture-hints">轻触展开 / 收拢 · 滑动旋转 · 点击照片放大</p>
          {ready && !failed && loaded < photos.length && <span className="asset-progress" role="status">回忆载入中 {loaded}/{photos.length}</span>}
        </footer>
      </section>
    </div>
    {photo && <div className={`memory-dialog ${closing ? 'closing' : ''}`} ref={dialog} role="dialog" aria-modal="true" aria-label={`${photo.label}的生日回忆`} onClick={e => { e.stopPropagation(); if (e.target === e.currentTarget) close(); }}>
      <button ref={closeButton} className="close-button" onClick={close} aria-label="关闭照片"><svg viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="1.4"/></svg></button>
      <span className="viewer-kicker">A MOMENT TO KEEP</span>
      <div className="photo-arrival" key={photo.id}><div className="photo-sway"><MemoryPhoto key={photo.id} photo={photo}/></div></div>
      <div className="viewer-footer"><span className="memory-date">{String(selected! + 1).padStart(2, '0')}</span><p>{photo.caption}</p><div className="viewer-navigation"><button onClick={() => setSelected((selected! - 1 + photos.length) % photos.length)} aria-label="上一张照片"><Arrow direction="left"/></button><span>{String(selected! + 1).padStart(2, '0')} <i>/</i> {String(photos.length).padStart(2, '0')}</span><button onClick={() => setSelected((selected! + 1) % photos.length)} aria-label="下一张照片"><Arrow/></button></div></div>
    </div>}
  </main>;
}
