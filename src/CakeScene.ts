import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { birthdayConfig as config, caption19, type Photo } from './config';
import { generateMarbles, randomGenerator, springStep, phaseProgress, photoSlot, type ElementPose } from './motion';

interface Card { mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>; home: THREE.Vector3; scatter: THREE.Vector3; rotation: THREE.Quaternion; targetRotation: THREE.Quaternion; phase: number; homeScale: number; scatterScale: number; photo: Photo }
export class CakeScene {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.OrthographicCamera(-4, 4, 4, -4, .1, 100);
  readonly marbles: ElementPose[];
  readonly cards: Card[] = [];
  private balls: THREE.InstancedMesh[] = [];
  private ballSlots: {group: number; index: number}[] = [];
  private parallax = new THREE.Vector2();
  private parallaxTarget = new THREE.Vector2();
  private orbit = new THREE.Group();
  private particles: THREE.Points;
  private particleHome: THREE.Vector3[] = [];
  private particleScatter: THREE.Vector3[] = [];
  private particlePositions: Float32Array;
  private candle = new THREE.Group();
  private flame = new THREE.Group();
  private pmrem: THREE.PMREMGenerator;
  private environment: THREE.WebGLRenderTarget;
  private observer: ResizeObserver;
  private raf = 0;
  private disposed = false;
  private suspended = false;
  private contextLost = false;
  private progress = 0;
  private velocity = 0;
  private target = 0;
  private time = 0;
  private lastTime = 0;
  private yaw = -.3;
  private userYaw = 0;
  private pitch = 0;
  private width = 1;
  private height = 1;
  private viewWidth = 8;
  private viewHeight = 8;
  private loaded = 0;
  private frameSamples = 0;
  private slowFrames = 0;
  private readonly reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  private readonly temp = new THREE.Object3D();
  private readonly v = new THREE.Vector3();
  private readonly q = new THREE.Quaternion();
  private readonly euler = new THREE.Euler();
  private readonly raycaster = new THREE.Raycaster();
  private readonly center = new THREE.Vector3(0, .22, 0);
  private readonly right = new THREE.Vector3(1, 0, 0);
  private readonly up = new THREE.Vector3();
  private readonly front = new THREE.Vector3();
  constructor(private host: HTMLDivElement, private photos: Photo[], private onReady: (count: number) => void, private onError: (message: string) => void) {
    const mobile = host.clientWidth < 650;
    const low = navigator.hardwareConcurrency <= 4;
    this.renderer = new THREE.WebGLRenderer({ antialias: !low, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, low ? 1.25 : mobile ? 1.6 : 1.8));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = .92;
    this.renderer.domElement.setAttribute('aria-label', '彩色玻璃弹珠与照片组成的三层生日蛋糕');
    this.renderer.domElement.setAttribute('role', 'img');
    host.appendChild(this.renderer.domElement);
    this.camera.position.set(0, 5.2, 14);
    this.camera.lookAt(this.center);
    this.up.set(0, 1, 0).applyQuaternion(this.camera.quaternion);
    this.front.set(0, 0, 1).applyQuaternion(this.camera.quaternion);
    this.pmrem = new THREE.PMREMGenerator(this.renderer);
    const room = new RoomEnvironment();
    // Local procedural softboxes: no HDR/CDN request; reflections remain visible against pure black.
    this.environment = this.pmrem.fromScene(room, .035);
    room.dispose();
    this.scene.environment = this.environment.texture;
    this.scene.environmentIntensity = .85;
    this.scene.add(new THREE.HemisphereLight(0xc8e1ff, 0x1c1046, .8));
    const key = new THREE.DirectionalLight(0xe3edff, 2.5); key.position.set(-4, 7, 5); this.scene.add(key);
    const rim = new THREE.DirectionalLight(0x63caff, 3); rim.position.set(4, 3, -5); this.scene.add(rim);
    const pink = new THREE.PointLight(0xaa66ff, 9, 12, 2); pink.position.set(-4, 1, 2); this.scene.add(pink);
    const count = low ? config.marbleCount.low : mobile ? config.marbleCount.mobile : config.marbleCount.desktop;
    this.marbles = generateMarbles(count, config.seed);
    const materials = [
      new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: .065, transmission: low ? .55 : .72, thickness: .48, ior: 1.48, clearcoat: 1, envMapIntensity: 1.7, metalness: .05, iridescence: .22, iridescenceIOR: 1.3, iridescenceThicknessRange: [100, 400] }),
      new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: .13, transmission: .38, thickness: .65, ior: 1.5, clearcoat: 1, envMapIntensity: 1.5 }),
    ];
    materials.push(new THREE.MeshPhysicalMaterial({color:'#d6dde5',metalness:.96,roughness:.16,clearcoat:1,envMapIntensity:2.1}));
    const counts=[0,0,0];
    this.marbles.forEach((_,i)=>{const group=i%13===0?2:i%5===0?1:0;this.ballSlots.push({group,index:counts[group]++});});
    this.balls=materials.map((material,g)=>{
      const mesh=new THREE.InstancedMesh(new THREE.SphereGeometry(1,low?16:28,low?12:20),material,counts[g]);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.frustumCulled=false;this.scene.add(mesh);return mesh;
    });
    this.marbles.forEach((m,i)=> { const slot=this.ballSlots[i]; this.balls[slot.group].setColorAt(slot.index,new THREE.Color(slot.group===2?'#bec8d5':config.colors[m.color])); });
    const random = randomGenerator(config.seed + 99);
    const particleCount = mobile ? config.particleCount.mobile : config.particleCount.desktop;
    this.particlePositions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount); const phases = new Float32Array(particleCount); const colors = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const a = random() * Math.PI * 2; const r = .8 + random() * 2.2; const y = -2.2 + random() * 4.1;
      this.particleHome.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r));
      this.particleScatter.push(new THREE.Vector3((random() - .5) * 7, (random() - .5) * 6, (random() - .5) * 6));
      sizes[i] = i % 9 === 0 ? .095 : .025 + random() * .04; phases[i] = random() * 6.28;
      new THREE.Color(i % 3 === 0 ? '#ffcf70' : '#fff4db').toArray(colors, i * 3);
    }
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3).setUsage(THREE.DynamicDrawUsage)); geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1)); geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1)); geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.particles = new THREE.Points(geometry, new THREE.ShaderMaterial({ uniforms: { uTime: { value: 0 }, uScale: { value: 80 } }, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: 'attribute float aSize; attribute float aPhase; uniform float uTime; uniform float uScale; varying vec3 vColor; varying float vPulse; void main(){ vColor=color; vPulse=.5+.5*sin(uTime*1.7+aPhase); vec4 mv=modelViewMatrix*vec4(position,1.); gl_Position=projectionMatrix*mv; gl_PointSize=max(1.5,aSize*uScale*(.7+vPulse*.7)); }',
      fragmentShader: 'varying vec3 vColor; varying float vPulse; void main(){ vec2 p=gl_PointCoord-.5; float r=length(p); float core=exp(-r*r*40.); float rays=pow(max(0.,1.-abs(p.x)*18.),5.)*max(0.,1.-abs(p.y)*2.)+pow(max(0.,1.-abs(p.y)*18.),5.)*max(0.,1.-abs(p.x)*2.); float a=(core+rays*.3)*(.4+vPulse*.6); if(a<.015)discard; gl_FragColor=vec4(vColor,a); }' }));
    this.particles.frustumCulled = false; this.scene.add(this.particles);
    this.makeCandle(); this.makePhotos(); this.makeOrbit();
    this.observer = new ResizeObserver(() => this.resize()); this.observer.observe(host); this.resize();
    document.addEventListener('visibilitychange', this.visibility);
    this.renderer.domElement.addEventListener('webglcontextlost', this.lost);
    this.renderer.domElement.addEventListener('webglcontextrestored', this.restored);
    this.raf = requestAnimationFrame(this.frame);
  }
  private makeOrbit() {
    for(let band=0;band<8;band++) {
      const points:THREE.Vector3[]=[],colors:number[]=[];
      for(let j=0;j<=180;j++) {
        const a=j/180*Math.PI*2,r=3.04+band*.055;
        points.push(new THREE.Vector3(Math.cos(a)*r,-2.14+Math.sin(a)*.12,Math.sin(a)*r));
        const color=new THREE.Color().setHSL((j/180+band*.09)%1,.82,.56);colors.push(color.r,color.g,color.b);
      }
      const geometry=new THREE.BufferGeometry().setFromPoints(points);geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
      const opacity=.12+(band%3)*.04;
      const ring=new THREE.Line(geometry,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity,depthWrite:false,blending:THREE.AdditiveBlending}));
      ring.userData.opacity=opacity;this.orbit.add(ring);
    }
    this.scene.add(this.orbit);
  }
  private makeCandle() {
    const wax = new THREE.Mesh(new THREE.CylinderGeometry(.105, .115, .64, 24), new THREE.MeshPhysicalMaterial({ color: '#ffd148', roughness: .3, clearcoat: .6 }));
    wax.position.y = 2.05; this.candle.add(wax);
    const wick = new THREE.Mesh(new THREE.CylinderGeometry(.014, .014, .10, 8), new THREE.MeshBasicMaterial({ color: '#5d381a' })); wick.position.y = 2.42; this.candle.add(wick);
    const outer = new THREE.Mesh(new THREE.SphereGeometry(.11, 20, 16), new THREE.MeshBasicMaterial({ color: '#ffb72f', toneMapped: false })); outer.scale.set(.72, 1.65, .72); this.flame.add(outer);
    const inner = new THREE.Mesh(new THREE.SphereGeometry(.065, 16, 12), new THREE.MeshBasicMaterial({ color: '#fff3b0', toneMapped: false })); inner.scale.set(.65, 1.5, .65); inner.position.set(0, -.04, .06); this.flame.add(inner);
    this.flame.position.y = 2.59; this.candle.add(this.flame);
    const light = new THREE.PointLight(0xffc159, 2.5, 5, 2); light.position.y = 2.6; this.candle.add(light); this.scene.add(this.candle);
  }
  private makePhotos() {
    const loader = new THREE.TextureLoader();
    // The exact closing inscription is already present on the original card 19.
    // Read its embedded preview, so WeChat needs no extra network request.
    const reference = this.photos.find(photo => photo.id === '19');
    const closingInscription = new Promise<HTMLImageElement | null>(resolve => {
      if (!reference) return resolve(null);
      const image = new Image(); image.onload=()=>resolve(image); image.onerror=()=>resolve(null);
      image.src=reference.thumbnail || reference.src;
    });
    const newInscription = new Promise<HTMLImageElement | null>(resolve => {
      const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>resolve(null);image.src=caption19;
    });
    this.photos.forEach((photo, i) => {
      const layer = i < 7 ? 0 : i < 13 ? 1 : 2;
      const k = i - [0, 7, 13][layer]; const n = [7, 6, Math.max(1, this.photos.length - 13)][layer];
      const a = k / n * Math.PI * 2 + [0, .45, -.35][layer];
      const r = [2.83, 2.17, 1.47][layer]; const y = [-1.32, -.04, 1.02][layer];
      const geometry = new THREE.PlaneGeometry(photo.aspect, 1);
      const material = new THREE.MeshBasicMaterial({ color: '#ffffff', side: THREE.DoubleSide, toneMapped: false });
      const mesh = new THREE.Mesh(geometry, material); mesh.userData.photoIndex = i;
      const height = layer === 2 ? .70 : .80;
      const rotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(-.07, Math.PI / 2 - a, (i % 3 - 1) * .12));
      const card: Card = { mesh, home: new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r), scatter: new THREE.Vector3(), rotation, targetRotation: this.camera.quaternion.clone(), phase: (i % 5) / 5, homeScale: height, scatterScale: 1, photo };
      this.cards.push(card); this.scene.add(mesh);
      const finish = async (texture: THREE.Texture) => {
      const inscription = photo.frame ? await closingInscription : photo.captionOverlay ? await newInscription : null;
      if (this.disposed) { texture.dispose(); return; }
      if (photo.captionOverlay || photo.frame) {
        const canvas = document.createElement('canvas'); canvas.width=800; canvas.height=1067;
        const context=canvas.getContext('2d')!;
        context.fillStyle='#fffdf9'; context.fillRect(0,0,800,1067);
        if (photo.captionOverlay) {
          context.drawImage(texture.image,0,0,800,1067);
        } else {
          const img=texture.image as HTMLImageElement;
          const w=800*.9116, h=1067*.7721;
          const scale=Math.max(w/img.width,h/img.height);
          const sw=w/scale, sh=h/scale;
          context.drawImage(img,(img.width-sw)/2,(img.height-sh)/2,sw,sh,800*.0442,1067*.0332,w,h);
        }
        const top=1067*.80525;
        context.fillStyle='#fffdf9'; context.fillRect(0,top,800,1067-top);
        if (photo.frame && inscription) {
          context.drawImage(inscription,0,inscription.height*(1166/1448),inscription.width,inscription.height*(282/1448),0,top,800,1067-top);
        } else if (inscription) {
          context.drawImage(inscription,0,top,800,1067-top);
        }

        texture.dispose(); texture=new THREE.CanvasTexture(canvas);
      }
      texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = Math.min(4, this.renderer.capabilities.getMaxAnisotropy()); material.map = texture; material.needsUpdate = true; this.loaded++; this.onReady(this.loaded); };
      // A brief network failure must not permanently replace a real photo with a placeholder.
      const candidates = [photo.thumbnail || photo.src, photo.thumbnail || photo.src, photo.src];
      const attempt = (index: number) => {
        if (this.disposed) return;
        const url = new URL(candidates[index], document.baseURI);
        if (index > 0 && url.protocol !== 'data:') url.searchParams.set('retry', String(index));
        loader.load(url.href, finish, undefined, () => {
          if (this.disposed) return;
          if (index + 1 < candidates.length) {
            window.setTimeout(() => attempt(index + 1), 600 * (index + 1));
          } else {
            this.onError('部分照片暂时未能加载，请轻点重新加载。');
            loader.load(config.placeholder, finish, undefined, () => {
              if (!this.disposed) { this.loaded++; this.onReady(this.loaded); }
            });
          }
        });
      };
      attempt(0);
    });
  }
  private resize() {
    this.width = Math.max(this.host.clientWidth, 1); this.height = Math.max(this.host.clientHeight, 1);
    const aspect = this.width / this.height;
    this.viewHeight = Math.max(6.25, 7.35 / aspect); this.viewWidth = this.viewHeight * aspect;
    this.camera.left = -this.viewWidth / 2; this.camera.right = this.viewWidth / 2; this.camera.top = this.viewHeight / 2; this.camera.bottom = -this.viewHeight / 2; this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
    (this.particles.material as THREE.ShaderMaterial).uniforms.uScale.value = this.height / this.viewHeight * this.renderer.getPixelRatio();
    const cols = aspect < .95 ? 4 : 5; const rows = Math.ceil(this.photos.length / cols);
    this.cards.forEach((card, i) => {
      const slot = photoSlot(i, this.photos.length, aspect);
      card.scatter.copy(this.center).addScaledVector(this.right, slot[0] * this.viewWidth * .5).addScaledVector(this.up, slot[1] * this.viewHeight * .5).addScaledVector(this.front, slot[2] + 1.3);
      card.scatterScale = Math.min(this.viewWidth * .72 / cols / card.photo.aspect, this.viewHeight * .74 / rows);
      card.targetRotation.copy(this.camera.quaternion).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), (i % 3 - 1) * .065));
    });
  }
  setExpanded(expanded: boolean) { this.target = expanded ? 1 : 0; }
  setParallax(x: number,y: number) { this.parallaxTarget.set(x*.06,y*.04); }
  setPaused(paused: boolean) { this.suspended = paused; }
  drag(dx: number, dy: number) { this.userYaw += dx * .008; this.pitch = THREE.MathUtils.clamp(this.pitch + dy * .003, -.2, .2); }
  pick(clientX: number, clientY: number): number | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.scene.updateMatrixWorld(true);
    this.raycaster.setFromCamera(new THREE.Vector2((clientX - rect.left) / rect.width * 2 - 1, -(clientY - rect.top) / rect.height * 2 + 1), this.camera);
    const hit = this.raycaster.intersectObjects(this.cards.map(c => c.mesh), false)[0];
    return hit ? Number(hit.object.userData.photoIndex) : null;
  }
  private frame = (now: number) => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.frame);
    const dt = this.lastTime ? Math.min((now - this.lastTime) / 1000, .05) : .016; this.lastTime = now;
    if (document.hidden || this.contextLost || this.suspended) return;
    this.time += dt;
    const state = springStep(this.progress, this.velocity, this.target, dt, this.reduced ? .65 : config.animationDuration);
    this.progress = state.position; this.velocity = state.velocity;
    const p = this.progress;
    if (!this.reduced) this.yaw += dt * config.autoRotationSpeed * (1 - p);
    this.parallax.lerp(this.parallaxTarget, 1-Math.exp(-dt*3));
    this.q.setFromEuler(this.euler.set(this.pitch+this.parallax.y, this.yaw + this.userYaw+this.parallax.x, 0));
    this.marbles.forEach((m, i) => {
      const t = phaseProgress(p, m.phase);
      this.v.fromArray(m.home).applyQuaternion(this.q);
      // Deterministic 3D endpoints, mapped to viewport only for responsive framing.
      const sx = m.scatter[0] * Math.min(1.65, this.viewWidth / 8.6);
      const sy = m.scatter[1] * this.viewHeight / 7.5;
      this.temp.position.copy(this.v).lerp(new THREE.Vector3(sx, sy, m.scatter[2] - 1.6), t);
      if (!this.reduced) {
        this.temp.position.x += t * .14 * Math.sin(this.time * .43 + m.phase * 27);
        this.temp.position.y += Math.sin(this.time * .63 + m.phase * 20) * (.025 + t * .14);
        this.temp.position.z += t * .16 * Math.sin(this.time * .39 + m.phase * 13);
      }
      this.temp.scale.setScalar(m.radius * (1 - t * .2)); this.temp.updateMatrix(); this.balls[this.ballSlots[i].group].setMatrixAt(this.ballSlots[i].index, this.temp.matrix);
    });
    this.balls.forEach(mesh=>mesh.instanceMatrix.needsUpdate=true);
    this.cards.forEach((card, i) => {
      const t = phaseProgress(p, card.phase);
      this.v.copy(card.home).applyQuaternion(this.q); card.mesh.position.copy(this.v).lerp(card.scatter, t);
      card.mesh.position.x += Math.sin(this.userYaw) * .10 * t * (i % 3 - 1);
      if (!this.reduced) {
        // Bounded, incommensurate waves look organic while retaining each photo's own slot.
        card.mesh.position.x += t * (.055 * Math.sin(this.time * .47 + i * 2.4) + .025 * Math.sin(this.time * .81 + i));
        card.mesh.position.y += Math.sin(this.time * .59 + i * 1.7) * (.018 + t * .065);
        card.mesh.position.z += t * .12 * Math.sin(this.time * .37 + i * 2.1);
      }
      card.mesh.quaternion.copy(this.q).multiply(card.rotation).slerp(card.targetRotation, t);
      if (!this.reduced) card.mesh.quaternion.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(t * .035 * Math.sin(this.time * .5 + i), t * .045 * Math.sin(this.time * .41 + i), t * .028 * Math.sin(this.time * .61 + i))));
      card.mesh.scale.setScalar(THREE.MathUtils.lerp(card.homeScale, card.scatterScale, t));
    });
    for (let i = 0; i < this.particleHome.length; i++) {
      const t = phaseProgress(p, i % 7 / 7); this.v.copy(this.particleHome[i]).applyQuaternion(this.q);
      this.v.lerp(this.particleScatter[i], t); if (!this.reduced) { this.v.y += Math.sin(this.time * .6 + i) * (.06 + t * .19); this.v.x += t * .2 * Math.sin(this.time * .34 + i); this.v.z += t * .22 * Math.cos(this.time * .41 + i); } this.v.toArray(this.particlePositions, i * 3);
    }
    this.particles.geometry.attributes.position.needsUpdate = true;
    (this.particles.material as THREE.ShaderMaterial).uniforms.uTime.value = this.reduced ? 0 : this.time;
    this.candle.scale.setScalar(1 - phaseProgress(p, 0)*.6);
    this.orbit.rotation.y = this.time * .035;
    this.orbit.children.forEach(child => { ( (child as THREE.Line).material as THREE.LineBasicMaterial).opacity = (child.userData.opacity ?? .24) * (1-phaseProgress(p,0)*.9); });
    this.flame.rotation.z = this.reduced ? 0 : Math.sin(this.time * 3) * .10 + Math.sin(this.time * 5.1) * .03;
    this.flame.scale.y = 1 + Math.sin(this.time * 4) * .05;
    this.renderer.render(this.scene, this.camera);
    // Adapt raster cost without changing identities, counts or destinations mid-animation.
    if (this.frameSamples < 180) { this.frameSamples++; if (dt > .038) this.slowFrames++; if (this.frameSamples === 180 && this.slowFrames > 80) { this.renderer.setPixelRatio(1); this.resize(); } }
  };
  private visibility = () => { this.lastTime = 0; };
  private lost = (e: Event) => { e.preventDefault(); this.contextLost = true; this.onError('画面暂时休息了，正在恢复…'); };
  private restored = () => { this.contextLost = false; this.onError(''); };
  diagnostics() {
    const project = (v: THREE.Vector3) => v.clone().project(this.camera).toArray();
    return { progress: this.progress, velocity: this.velocity, target: this.target, marbleCount: this.marbles.length, photoCount: this.cards.length, loadedPhotos: this.loaded, drawCalls: this.renderer.info.render.calls, pixelRatio: this.renderer.getPixelRatio(), yaw: this.userYaw, photoPositions: this.cards.map(c => ({ id: c.photo.id, position: c.mesh.position.toArray(), ndc: project(c.mesh.position) })), marblePositions: this.marbles.slice(0, 10).map((_, i) => { this.balls[this.ballSlots[i].group].getMatrixAt(this.ballSlots[i].index, this.temp.matrix); return new THREE.Vector3().setFromMatrixPosition(this.temp.matrix).toArray(); }), candleNdc: project(new THREE.Vector3(0, 2.8, 0)) };
  }
  dispose() {
    this.disposed = true; cancelAnimationFrame(this.raf); this.observer.disconnect(); document.removeEventListener('visibilitychange', this.visibility);
    this.renderer.domElement.removeEventListener('webglcontextlost', this.lost); this.renderer.domElement.removeEventListener('webglcontextrestored', this.restored);
    this.scene.traverse(object => { const mesh = object as THREE.Mesh; mesh.geometry?.dispose(); if (mesh.material) { const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]; materials.forEach(m => { (m as THREE.MeshBasicMaterial).map?.dispose(); m.dispose(); }); } });
    this.environment.dispose(); this.pmrem.dispose(); this.renderer.dispose(); this.renderer.domElement.remove();
  }
}
