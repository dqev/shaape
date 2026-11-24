import { SWATCH_CONFIGS, SHAPES_TOOLS_PRESETS } from '../data/generator-presets';
import { SHAAPES_DATA, type ShapeItem } from '../data/shapes';

const TAU = Math.PI * 2;

const rnd = (min: number, max: number) => min + Math.random() * (max - min);
const rndInt = (min: number, max: number) => Math.floor(rnd(min, max + 1));
const rndItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const n = (v: number) => String(Math.round(v * 100) / 100);
const P = (x: number, y: number) => `${n(x)} ${n(y)}`;

export interface LightingInfo {
  id: string;
  color: string;
  grad: [string, string];
  blobs: string;
  angle: { x1: number; y1: number; x2: number; y2: number };
  noiseSeed: number;
}

export interface GeneratedShape {
  name: string;
  category: string;
  path: string;
  svg: string;
  color: string;
  styleMode: string;
  lighting: LightingInfo;
}

  function genTeardrop() {
    const r = rnd(52, 66);
    const cy = rnd(114, 126);
    const apexY = rnd(22, 34);
    const dy = cy - apexY;
    const sinA = Math.min(0.96, r / dy);
    const cosA = Math.sqrt(Math.max(0.01, 1 - sinA * sinA));
    const x1 = 100 - r * cosA;
    const y1 = cy - r * sinA;
    const x2 = 100 + r * cosA;
    const y2 = cy - r * sinA;
    const cpApexX = rnd(14, 26);
    const cpApexY = rnd(22, 36);
    return {
      name: 'Teardrop',
      path: `M100 ${n(apexY)} C${P(100 + cpApexX, apexY + cpApexY)} ${P(x2 + 6, y2 - 10)} ${P(x2, y2)} A${n(r)} ${n(r)} 0 1 1 ${P(x1, y1)} C${P(x1 - 6, y1 - 10)} ${P(100 - cpApexX, apexY + cpApexY)} 100 ${n(apexY)}Z`
    };
  }

  function genSquircle() {
    const p = rnd(2.6, 4.2);
    const a = rnd(74, 88);
    const b = rnd(74, 88);
    const pts = [];
    const steps = 72;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * TAU;
      const ct = Math.cos(t);
      const st = Math.sin(t);
      const x = 100 + a * Math.sign(ct) * Math.pow(Math.abs(ct), 2 / p);
      const y = 100 + b * Math.sign(st) * Math.pow(Math.abs(st), 2 / p);
      pts.push(P(x, y));
    }
    return {
      name: 'Squircle',
      path: `M${pts.join('L')}Z`
    };
  }

  function genRoundedPolygon() {
    const sides = rndItem([3, 5, 6, 8]);
    const r = rnd(74, 88);
    const filletRatio = rnd(0.18, 0.28);
    const rot = -Math.PI / 2;
    const vertices = [];
    for (let i = 0; i < sides; i++) {
      const a = rot + (i * TAU) / sides;
      vertices.push([100 + r * Math.cos(a), 100 + r * Math.sin(a)]);
    }
    let d = '';
    for (let i = 0; i < sides; i++) {
      const prev = vertices[(i - 1 + sides) % sides];
      const curr = vertices[i];
      const next = vertices[(i + 1) % sides];
      const p1: [number, number] = [curr[0] + (prev[0] - curr[0]) * filletRatio, curr[1] + (prev[1] - curr[1]) * filletRatio];
      const p2: [number, number] = [curr[0] + (next[0] - curr[0]) * filletRatio, curr[1] + (next[1] - curr[1]) * filletRatio];
      if (i === 0) {
        d += `M${P(p1[0], p1[1])}`;
      } else {
        d += `L${P(p1[0], p1[1])}`;
      }
      d += `Q${P(curr[0], curr[1])} ${P(p2[0], p2[1])}`;
    }
    const names: Record<number, string> = { 3: 'Triangle', 5: 'Pentagon', 6: 'Hexagon', 8: 'Octagon' };
    return {
      name: names[sides] || 'Polygon',
      path: d + 'Z'
    };
  }

  function genAnalyticCrescent() {
    const r1 = rnd(76, 86);
    const r2 = rnd(68, 78);
    const dist = rnd(30, 44);
    const d = dist;
    const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
    const h = Math.sqrt(Math.max(1, r1 * r1 - a * a));
    const x0 = 100 + a;
    const y0 = 100;
    const p1x = x0;
    const p1y = 100 + h;
    const p2x = x0;
    const p2y = 100 - h;
    return {
      name: 'Crescent',
      path: `M${n(p1x)} ${n(p1y)} A${n(r1)} ${n(r1)} 0 0 1 ${n(p2x)} ${n(p2y)} A${n(r2)} ${n(r2)} 0 0 0 ${n(p1x)} ${n(p1y)}Z`
    };
  }

  function genCapsule() {
    const w = rnd(140, 168);
    const h = rnd(58, 76);
    const r = h / 2;
    const x = 100 - w / 2;
    const y = 100 - h / 2;
    return {
      name: 'Capsule',
      path: `M${P(x + r, y)}H${n(x + w - r)}A${n(r)} ${n(r)} 0 0 1 ${P(x + w, y + r)}V${n(y + h - r)}A${n(r)} ${n(r)} 0 0 1 ${P(x + w - r, y + h)}H${n(x + r)}A${n(r)} ${n(r)} 0 0 1 ${P(x, y + h - r)}V${n(y + r)}A${n(r)} ${n(r)} 0 0 1 ${P(x + r, y)}Z`
    };
  }

  function genAstroid() {
    const p = rnd(2.4, 3.8);
    const r = rnd(76, 92);
    const rot = rndItem([0, Math.PI / 4]);
    const pts = [];
    const steps = 80;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * TAU;
      const ct = Math.cos(t);
      const st = Math.sin(t);
      const rx = r * Math.sign(ct) * Math.pow(Math.abs(ct), p);
      const ry = r * Math.sign(st) * Math.pow(Math.abs(st), p);
      const x = 100 + rx * Math.cos(rot) - ry * Math.sin(rot);
      const y = 100 + rx * Math.sin(rot) + ry * Math.cos(rot);
      pts.push(P(x, y));
    }
    return {
      name: 'Astroid Sparkle',
      path: `M${pts.join('L')}Z`
    };
  }

  function genConcaveStar() {
    const points = rndItem([4, 5, 6, 8]);
    const R = rnd(82, 94);
    const r = rnd(22, 42);
    const scoop = rnd(0.45, 0.75);
    const pts = [];
    const rot = -Math.PI / 2;
    for (let i = 0; i < points; i++) {
      const aTip = rot + (i * TAU) / points;
      const aNextTip = rot + ((i + 1) * TAU) / points;
      const aValley = rot + ((i + 0.5) * TAU) / points;
      const tipX = 100 + R * Math.cos(aTip);
      const tipY = 100 + R * Math.sin(aTip);
      const valX = 100 + r * Math.cos(aValley);
      const valY = 100 + r * Math.sin(aValley);
      const nextTipX = 100 + R * Math.cos(aNextTip);
      const nextTipY = 100 + R * Math.sin(aNextTip);

      const cp1x = tipX + (valX - tipX) * 0.5 + (100 - tipX) * scoop * 0.4;
      const cp1y = tipY + (valY - tipY) * 0.5 + (100 - tipY) * scoop * 0.4;
      const cp2x = valX + (nextTipX - valX) * 0.5 + (100 - nextTipX) * scoop * 0.4;
      const cp2y = valY + (nextTipY - valY) * 0.5 + (100 - nextTipY) * scoop * 0.4;

      if (i === 0) pts.push(`M${P(tipX, tipY)}`);
      pts.push(`Q${P(cp1x, cp1y)} ${P(valX, valY)}`);
      pts.push(`Q${P(cp2x, cp2y)} ${P(nextTipX, nextTipY)}`);
    }
    return {
      name: `${points}-Point Star`,
      path: pts.join(' ') + 'Z'
    };
  }

  function genRegularStar() {
    const points = rndItem([5, 6, 8, 12]);
    const R = rnd(80, 92);
    const r = rnd(34, 52);
    const rot = -Math.PI / 2;
    const pts = [];
    for (let i = 0; i < points * 2; i++) {
      const rad = i % 2 === 0 ? R : r;
      const a = rot + (i * Math.PI) / points;
      pts.push(`${i ? 'L' : 'M'}${P(100 + rad * Math.cos(a), 100 + rad * Math.sin(a))}`);
    }
    return {
      name: `${points}-Ray Star`,
      path: pts.join('') + 'Z'
    };
  }

  function genCompassStar() {
    const majorR = rnd(88, 96);
    const minorR = rnd(50, 64);
    const innerR = rnd(20, 30);
    const rot = -Math.PI / 2;
    const pts = [];
    for (let i = 0; i < 16; i++) {
      let rad = innerR;
      if (i % 4 === 0) rad = majorR;
      else if (i % 2 === 0) rad = minorR;
      const a = rot + (i * TAU) / 16;
      pts.push(`${i ? 'L' : 'M'}${P(100 + rad * Math.cos(a), 100 + rad * Math.sin(a))}`);
    }
    return {
      name: 'Compass Star',
      path: pts.join('') + 'Z'
    };
  }

  function genSunburst() {
    const rays = rndItem([12, 16, 20]);
    const R = rnd(82, 92);
    const r = rnd(62, 74);
    const rot = -Math.PI / 2;
    const pts = [];
    for (let i = 0; i < rays * 2; i++) {
      const rad = i % 2 === 0 ? R : r;
      const a = rot + (i * Math.PI) / rays;
      pts.push(`${i ? 'L' : 'M'}${P(100 + rad * Math.cos(a), 100 + rad * Math.sin(a))}`);
    }
    return {
      name: 'Sunburst',
      path: pts.join('') + 'Z'
    };
  }

  function genRosette() {
    const petals = rndItem([3, 4, 5, 6, 8, 10]);
    const outerR = rnd(78, 90);
    const innerR = rnd(20, 34);
    const flare = rnd(0.4, 0.7);
    const rot = -Math.PI / 2;
    const pts = [];
    for (let i = 0; i < petals; i++) {
      const a0 = rot + (i * TAU) / petals;
      const a1 = rot + ((i + 1) * TAU) / petals;
      const aMid = (a0 + a1) / 2;
      const startX = 100 + innerR * Math.cos(a0);
      const startY = 100 + innerR * Math.sin(a0);
      const tipX = 100 + outerR * Math.cos(aMid);
      const tipY = 100 + outerR * Math.sin(aMid);
      const endX = 100 + innerR * Math.cos(a1);
      const endY = 100 + innerR * Math.sin(a1);

      const cp1x = 100 + outerR * (0.5 + flare * 0.4) * Math.cos(a0 + (aMid - a0) * 0.4);
      const cp1y = 100 + outerR * (0.5 + flare * 0.4) * Math.sin(a0 + (aMid - a0) * 0.4);
      const cp2x = 100 + outerR * (0.5 + flare * 0.4) * Math.cos(a1 - (a1 - aMid) * 0.4);
      const cp2y = 100 + outerR * (0.5 + flare * 0.4) * Math.sin(a1 - (a1 - aMid) * 0.4);

      if (i === 0) pts.push(`M${P(startX, startY)}`);
      pts.push(`C${P(cp1x, cp1y)} ${P(tipX, tipY)} ${P(tipX, tipY)}`);
      pts.push(`C${P(tipX, tipY)} ${P(cp2x, cp2y)} ${P(endX, endY)}`);
    }
    return {
      name: `${petals}-Petal Rosette`,
      path: pts.join(' ') + 'Z'
    };
  }

  function genClover() {
    const lobes = rndItem([3, 4]);
    const r = rnd(38, 46);
    const dist = rnd(40, 48);
    const rot = -Math.PI / 2;
    const pts = [];
    for (let i = 0; i < lobes; i++) {
      const a = rot + (i * TAU) / lobes;
      const cx = 100 + dist * Math.cos(a);
      const cy = 100 + dist * Math.sin(a);
      pts.push(`M${P(100, 100)} C${P(cx - r * Math.sin(a), cy + r * Math.cos(a))} ${P(cx + r * Math.cos(a), cy + r * Math.sin(a))} ${P(cx + r * Math.cos(a), cy + r * Math.sin(a))} C${P(cx + r * Math.cos(a), cy + r * Math.sin(a))} ${P(cx + r * Math.sin(a), cy - r * Math.cos(a))} ${P(100, 100)}`);
    }
    return {
      name: `${lobes}-Leaf Clover`,
      path: pts.join(' ') + 'Z'
    };
  }

  function genScallop() {
    const lobes = rndItem([6, 8, 10, 12]);
    const baseR = rnd(74, 84);
    const amp = rnd(9, 15);
    const steps = lobes * 16;
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * TAU;
      const r = baseR + amp * Math.cos(lobes * t);
      const x = 100 + r * Math.cos(t);
      const y = 100 + r * Math.sin(t);
      pts.push(P(x, y));
    }
    return {
      name: 'Scallop Badge',
      path: `M${pts.join('L')}Z`
    };
  }

  function genShield() {
    const topW = rnd(66, 76);
    const topY = rnd(24, 30);
    const midY = rnd(88, 102);
    const botY = rnd(172, 182);
    const p1 = P(100 - topW, topY);
    const p2 = P(100 + topW, topY);
    const c1 = P(100 + topW, midY);
    const c2 = P(100 + topW * 0.4, botY - 14);
    const bot = P(100, botY);
    const c3 = P(100 - topW * 0.4, botY - 14);
    const c4 = P(100 - topW, midY);
    return {
      name: 'Shield Crest',
      path: `M${p1} L${p2} C${c1} ${c2} ${bot} C${c3} ${c4} ${p1} Z`
    };
  }

  function genHourglass() {
    const w = rnd(68, 78);
    const waist = rnd(16, 26);
    const top = rnd(22, 28);
    const bot = rnd(172, 178);
    const p1 = P(100 - w, top);
    const p2 = P(100 + w, top);
    const c1 = P(100 + waist, 100);
    const p3 = P(100 + w, bot);
    const p4 = P(100 - w, bot);
    const c2 = P(100 - waist, 100);
    return {
      name: 'Hourglass Waist',
      path: `M${p1} L${p2} Q${c1} ${p3} L${p4} Q${c2} ${p1} Z`
    };
  }

  function genSparkle() {
    const tipR = rnd(86, 95);
    const waistR = rnd(10, 18);
    const pts = [];
    for (let i = 0; i < 4; i++) {
      const a0 = -Math.PI / 2 + (i * TAU) / 4;
      const aMid = a0 + Math.PI / 4;
      const a1 = a0 + TAU / 4;
      const tipX = 100 + tipR * Math.cos(a0);
      const tipY = 100 + tipR * Math.sin(a0);
      const waistX = 100 + waistR * Math.cos(aMid);
      const waistY = 100 + waistR * Math.sin(aMid);
      const nextTipX = 100 + tipR * Math.cos(a1);
      const nextTipY = 100 + tipR * Math.sin(a1);
      if (i === 0) pts.push(`M${P(tipX, tipY)}`);
      pts.push(`Q${P(waistX, waistY)} ${P(nextTipX, nextTipY)}`);
    }
    return {
      name: 'Sparkle Flare',
      path: pts.join(' ') + 'Z'
    };
  }

  function genDaisy() {
    const petals = rndItem([12, 14, 16]);
    const R = rnd(82, 92);
    const r = rnd(28, 36);
    const pts = [];
    for (let i = 0; i < petals; i++) {
      const a0 = (i * TAU) / petals;
      const a1 = ((i + 1) * TAU) / petals;
      const aMid = (a0 + a1) / 2;
      const x0 = 100 + r * Math.cos(a0);
      const y0 = 100 + r * Math.sin(a0);
      const xt = 100 + R * Math.cos(aMid);
      const yt = 100 + R * Math.sin(aMid);
      const x1 = 100 + r * Math.cos(a1);
      const y1 = 100 + r * Math.sin(a1);
      if (i === 0) pts.push(`M${P(x0, y0)}`);
      pts.push(`Q${P(xt, yt)} ${P(x1, y1)}`);
    }
    return {
      name: `${petals}-Petal Daisy`,
      path: pts.join(' ') + 'Z'
    };
  }

  function genLotus() {
    const petals = rndItem([6, 8]);
    const outerR = rnd(82, 92);
    const innerR = rnd(30, 42);
    const pts = [];
    for (let i = 0; i < petals; i++) {
      const a0 = -Math.PI / 2 + (i * TAU) / petals;
      const a1 = a0 + TAU / petals;
      const aMid = (a0 + a1) / 2;
      const x0 = 100 + innerR * Math.cos(a0);
      const y0 = 100 + innerR * Math.sin(a0);
      const xt = 100 + outerR * Math.cos(aMid);
      const yt = 100 + outerR * Math.sin(aMid);
      const x1 = 100 + innerR * Math.cos(a1);
      const y1 = 100 + innerR * Math.sin(a1);
      const cp1x = 100 + (outerR * 0.7) * Math.cos(a0 + (aMid - a0) * 0.3);
      const cp1y = 100 + (outerR * 0.7) * Math.sin(a0 + (aMid - a0) * 0.3);
      const cp2x = 100 + (outerR * 0.7) * Math.cos(a1 - (a1 - aMid) * 0.3);
      const cp2y = 100 + (outerR * 0.7) * Math.sin(a1 - (a1 - aMid) * 0.3);
      if (i === 0) pts.push(`M${P(x0, y0)}`);
      pts.push(`C${P(cp1x, cp1y)} ${P(xt, yt)} ${P(xt, yt)}`);
      pts.push(`C${P(xt, yt)} ${P(cp2x, cp2y)} ${P(x1, y1)}`);
    }
    return {
      name: 'Lotus Blossom',
      path: pts.join(' ') + 'Z'
    };
  }

  const PROCEDURAL_FNS = {
    geometry: [genTeardrop, genSquircle, genRoundedPolygon, genAnalyticCrescent, genCapsule, genShield, genHourglass],
    stars: [genAstroid, genConcaveStar, genRegularStar, genCompassStar, genSunburst, genSparkle],
    flowers: [genRosette, genClover, genScallop, genDaisy, genLotus]
  };

  function generateFluidBlobs(swatchColor: string) {
    const cfg = SWATCH_CONFIGS[swatchColor] || SWATCH_CONFIGS['#ffb800'];
    const count = 3 + Math.floor(Math.random() * 2);
    const cols = [...cfg.blobsColors];
    const blobs = [];
    for (let i = 0; i < count; i++) {
      const c = cols[Math.floor(Math.random() * cols.length)];
      const op = [0.45, 0.65, 0.78, 0.88][Math.floor(Math.random() * 4)];
      if (Math.random() > 0.35) {
        const cx = 10 + Math.random() * 180;
        const cy = 10 + Math.random() * 180;
        const rx = 45 + Math.random() * 55;
        const ry = 35 + Math.random() * 50;
        const rot = Math.floor(Math.random() * 180);
        blobs.push(`<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" fill="${c}" fill-opacity="${op}" transform="rotate(${rot} ${n(cx)} ${n(cy)})"/>`);
      } else {
        const w = 65 + Math.random() * 85;
        const h = 65 + Math.random() * 95;
        const x = -15 + Math.random() * (190 - w);
        const y = -15 + Math.random() * (190 - h);
        blobs.push(`<path fill="${c}" fill-opacity="${op}" d="M${P(x + w, y)}H${n(x)}v${n(h)}h${n(w)}z"/>`);
      }
    }
    return blobs.join('');
  }




function getShaapesPool(cat: string): { name: string; path: string }[] {
  const all = SHAAPES_DATA || [];
  if (!all.length) return [];
  const pool: { name: string; path: string }[] = [];
  for (let i = 0; i < all.length; i++) {
    const s = all[i];
    let match = false;
    if (cat === 'random') match = true;
    else if (cat === 'flowers' && s.cat === 'Flower') match = true;
    else if (cat === 'stars' && s.cat === 'Star') match = true;
    else if (cat === 'cyber' && s.cat === 'Cyber') match = true;
    else if (cat === 'geometry' && s.cat !== 'Flower' && s.cat !== 'Star' && s.cat !== 'Cyber') match = true;

    if (match) {
      const m = s.svg.match(/<mask[^>]*>[\s\S]*?<path[^>]*d="([^"]+)"/);
      if (m && m[1]) {
        pool.push({ name: s.name, path: m[1] });
      }
    }
  }
  return pool;
}

export function createLighting(color: string): LightingInfo {
  const id = 'cs_' + Math.random().toString(36).slice(2, 9);
  const cfg = SWATCH_CONFIGS[color] || SWATCH_CONFIGS['#ffb800'];
  const blobs = generateFluidBlobs(color);
  const angle = rndItem([
    { x1: 186.5, y1: 37, x2: 37, y2: 186.5 },
    { x1: 37, y1: 37, x2: 186.5, y2: 186.5 },
    { x1: 100, y1: 0, x2: 100, y2: 200 },
    { x1: 0, y1: 100, x2: 200, y2: 100 }
  ]);
  const noiseSeed = rndInt(1, 99);
  return {
    id: id,
    color: color,
    grad: cfg.grad,
    blobs: blobs,
    angle: angle,
    noiseSeed: noiseSeed
  };
}

export function assembleSvg(
  pathD: string,
  color: string,
  styleMode: string,
  lighting?: LightingInfo
): string {
  const light = (lighting && lighting.color === color) ? lighting : createLighting(color);
  const id = light.id || ('cs_' + Math.random().toString(36).slice(2, 9));
  const safePath = (pathD && pathD.length > 5) ? pathD : 'M100 24 C120 50 160 85 160 125 A60 60 0 1 1 40 125 C40 85 80 50 100 24Z';

  if (styleMode === 'solid' || styleMode === 'normal') {
    return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="-3.093 -3.093 206.186 206.186"><path fill="${color}" fill-rule="evenodd" clip-rule="evenodd" d="${safePath}"/></svg>`;
  }

  const grad = light.grad;
  const blobs = light.blobs;
  const angle = light.angle;
  const noiseSeed = light.noiseSeed || rndInt(1, 99);

  return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="-3.093 -3.093 206.186 206.186"><g clip-path="url(#cs_clip_${id})"><mask id="cs_mask_${id}" width="240" height="240" x="-20" y="-20" maskUnits="userSpaceOnUse" style="mask-type:alpha"><path fill="#fff" fill-rule="evenodd" clip-rule="evenodd" d="${safePath}"/></mask><g mask="url(#cs_mask_${id})"><path fill="#fff" d="M200 0H0v200h200z"/><path fill="url(#paint0_linear_${id})" fill-opacity=".55" d="M200 0H0v200h200z"/><g filter="url(#filter0_f_${id})">${blobs}</g></g></g><defs><linearGradient id="paint0_linear_${id}" x1="${angle.x1}" y1="${angle.y1}" x2="${angle.x2}" y2="${angle.y2}" gradientUnits="userSpaceOnUse"><stop stop-color="${grad[0]}" stop-opacity=".55"/><stop offset="1" stop-color="${grad[1]}" stop-opacity=".65"/></linearGradient><clipPath id="cs_clip_${id}"><rect x="0" y="0" width="200" height="200" fill="#fff"/></clipPath><filter id="filter0_f_${id}" width="340" height="340" x="-70" y="-70" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_${id}" stdDeviation="28"/></filter></defs>${styleMode === 'grainy' ? `<g mask="url(#cs_mask_${id})" style="mix-blend-mode:overlay"><path fill="gray" stroke="transparent" d="M200 0H0v200h200z" filter="url(#cs_noise_${id})"/></g><defs><filter id="cs_noise_${id}" width="100%" height="100%" x="0%" y="0%" filterUnits="objectBoundingBox"><feTurbulence baseFrequency=".6" numOctaves="5" result="out1" seed="${noiseSeed}"/><feComposite in="out1" in2="SourceGraphic" operator="in" result="out2"/><feBlend in="SourceGraphic" in2="out2" mode="overlay" result="out3"/></filter></defs>` : ''}</svg>`;
}

export function generate(
  category: string = 'random',
  color: string = '#ffb800',
  styleMode: string = 'normal'
): GeneratedShape {
  const validCats = ['geometry', 'stars', 'flowers'];
  const activeCat = validCats.includes(category)
    ? category
    : rndItem(validCats);

  const sourceRoll = Math.random();
  let picked: { name: string; path: string } | null = null;

  if (activeCat === 'cyber') {
    const cyberPool = getShaapesPool('cyber');
    if (cyberPool.length) {
      picked = rndItem(cyberPool);
    }
  } else {
    if (sourceRoll < 0.35) {
      const fns = ((PROCEDURAL_FNS as any)[activeCat] || PROCEDURAL_FNS.geometry) as (() => { name: string; path: string })[];
      picked = rndItem(fns)();
    } else if (sourceRoll < 0.70) {
      const subPresets = SHAPES_TOOLS_PRESETS.filter(p => p.c === activeCat);
      if (subPresets.length) {
        const p = rndItem(subPresets);
        picked = { name: p.n, path: p.d };
      }
    } else {
      const coolPool = getShaapesPool(activeCat);
      if (coolPool.length) {
        picked = rndItem(coolPool);
      }
    }
  }

  if (!picked || !picked.path) {
    const fns = ((PROCEDURAL_FNS as any)[activeCat] || PROCEDURAL_FNS.geometry) as (() => { name: string; path: string })[];
    picked = rndItem(fns)();
  }

  const validPicked = picked as { name: string; path: string };
  const lighting = createLighting(color);
  const svg = assembleSvg(validPicked.path, color, styleMode, lighting);

  return {
    name: validPicked.name,
    category: activeCat,
    path: validPicked.path,
    svg: svg,
    color: color,
    styleMode: styleMode,
    lighting: lighting
  };
}
