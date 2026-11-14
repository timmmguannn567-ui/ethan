export type Vec3 = [number, number, number];
export interface ElementPose { home: Vec3; scatter: Vec3; radius: number; phase: number; color: number; layer: number }
export function randomGenerator(seed: number) {
  return () => { let t = seed += 0x6D2B79F5; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
/** Exact critically damped solution. Velocity survives a reversal; no per-toggle position reset. */
export function springStep(position: number, velocity: number, target: number, dt: number, duration: number) {
  const omega = 8.5 / Math.max(.3, duration);
  const offset = position - target;
  const aux = velocity + omega * offset;
  const decay = Math.exp(-omega * dt);
  return { position: target + (offset + aux * dt) * decay, velocity: (velocity - omega * aux * dt) * decay };
}
export const smooth = (p: number) => { p = Math.max(0, Math.min(1, p)); return p * p * (3 - 2 * p); };
export const phaseProgress = (p: number, phase: number) => smooth((p - phase * .09) / (1 - phase * .09));
export const tiers = [{ radius: 2.5, base: -1.85, height: 1.12 }, { radius: 1.83, base: -.62, height: 1.02 }, { radius: 1.13, base: .52, height: .98 }];
export function generateMarbles(count: number, seed: number): ElementPose[] {
  const random = randomGenerator(seed); const result: ElementPose[] = [];
  const weights = [.47, .33, .2];
  for (let layer = 0; layer < 3; layer++) {
    const tier = tiers[layer]; const n = layer === 2 ? count - result.length : Math.round(count * weights[layer]);
    const sideCount = Math.round(n * .68); const rowCount = Math.ceil(sideCount / 3);
    for (let i = 0; i < n; i++) {
      const side = i < sideCount;
      const row = Math.floor(i / rowCount);
      const angle = side ? ((i % rowCount) + (row % 2) * .5) / rowCount * Math.PI * 2 : random() * Math.PI * 2;
      // Rings on the side and a sparse annular crown keep three flat, separate tiers readable.
      const innerRadius = layer === 2 ? 0 : tiers[layer + 1].radius + .08;
      const r = side ? tier.radius + (random() - .5) * .09 : Math.sqrt(innerRadius ** 2 + random() * (tier.radius ** 2 - innerRadius ** 2));
      const y = side ? tier.base + .14 + row * (tier.height - .28) / 2 : tier.base + tier.height + (random() - .5) * .055;
      const phi = random() * Math.PI * 2; const scatterR = .6 + Math.sqrt(random()) * 3.1;
      result.push({ home: [Math.cos(angle) * r, y, Math.sin(angle) * r], scatter: [Math.cos(phi) * scatterR, (random() - .5) * 5.9, (random() - .5) * 5], radius: (side ? .125 : .08) + random() ** 2 * (side ? .10 : .095), phase: random(), color: Math.floor(random() * 20) % 8, layer });
    }
  }
  return result;
}
export function photoSlot(index: number, total: number, aspect: number): Vec3 {
  const cols = aspect < .95 ? 4 : 5; const rows = Math.ceil(total / cols);
  const row = Math.floor(index / cols); const col = index % cols;
  const rowTotal = Math.min(cols, total - row * cols);
  return [(col - (rowTotal - 1) / 2) / cols * 1.72, ((rows - 1) / 2 - row) / rows * 1.72, ((index * 7) % 5 - 2) * .32];
}
