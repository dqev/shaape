import fs from 'node:fs';
import path from 'node:path';

export interface ShapeItem {
  id: string;
  name: string;
  cat: string;
  num: string;
  file: string;
  svg: string;
  svgGrainy?: string;
  svgGradient?: string;
  color: string;
  d?: string;
}

const PALETTE = [
  '#FF6B00', '#10B981', '#3B82F6', '#EC4899', '#D97706',
  '#8B5CF6', '#0284C7', '#EF4444', '#65A30D', '#6366F1',
  '#C026D3', '#0D9488', '#F59E0B', '#06B6D4', '#84CC16',
];

function sanitizeSvg(content: string): string {
  return content
    .replace(/\r\n/g, '\n')
    .replace(/\n+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/>\s+</g, '><')
    .trim();
}

function extractPathD(svgContent: string): string | undefined {
  const match = svgContent.match(/<path[^>]*\bd="([^"]+)"/i);
  return match ? match[1] : undefined;
}

function extractColor(svgContent: string, defaultColor: string): string {
  const fillMatches = svgContent.matchAll(/\bfill="([^"]+)"/gi);
  for (const m of fillMatches) {
    const val = m[1].trim();
    if (val && val !== 'none' && val !== '#fff' && val !== '#ffffff' && val !== 'white' && !val.startsWith('url(')) {
      return val;
    }
  }
  return defaultColor;
}

function formatName(raw: string): string {
  return raw
    .replace(/[-_]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export async function syncShapes(): Promise<void> {
  const rootDir = process.cwd();
  const shapesDir = path.join(rootDir, 'shapes');
  const normalDir = path.join(shapesDir, 'normal');
  const gradientDir = path.join(shapesDir, 'gradient');
  const grainyDir = path.join(shapesDir, 'grainy');
  const targetFile = path.join(rootDir, 'src', 'data', 'shapes.ts');

  if (!fs.existsSync(normalDir)) {
    console.log(`[sync-shapes] Note: ${normalDir} does not exist. Skipping sync.`);
    return;
  }

  let existingShapes: ShapeItem[] = [];
  if (fs.existsSync(targetFile)) {
    try {
      const module = await import(targetFile);
      existingShapes = (module.RAW_SHAAPES || module.SHAAPES_DATA || module.COOLSHAPES_DATA || []) as ShapeItem[];
    } catch {
      existingShapes = [];
    }
  }

  const existingMap = new Map<string, ShapeItem>();
  for (const item of existingShapes) {
    existingMap.set(item.file, item);
  }

  const normalFiles = fs
    .readdirSync(normalDir)
    .filter((f) => f.toLowerCase().endsWith('.svg'))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  let addedCount = 0;
  let updatedCount = 0;
  const resultShapes: ShapeItem[] = [];

  for (let i = 0; i < normalFiles.length; i++) {
    const file = normalFiles[i];
    const normalPath = path.join(normalDir, file);
    const gradientPath = path.join(gradientDir, file);
    const grainyPath = path.join(grainyDir, file);

    const rawSvg = fs.readFileSync(normalPath, 'utf8');
    const svg = sanitizeSvg(rawSvg);

    let svgGradient: string | undefined;
    if (fs.existsSync(gradientPath)) {
      svgGradient = sanitizeSvg(fs.readFileSync(gradientPath, 'utf8'));
    }

    let svgGrainy: string | undefined;
    if (fs.existsSync(grainyPath)) {
      svgGrainy = sanitizeSvg(fs.readFileSync(grainyPath, 'utf8'));
    }

    const existing = existingMap.get(file);

    if (existing) {
      let isModified = false;
      if (existing.svg !== svg) {
        existing.svg = svg;
        existing.d = extractPathD(svg);
        isModified = true;
      }
      if (svgGradient && existing.svgGradient !== svgGradient) {
        existing.svgGradient = svgGradient;
        isModified = true;
      }
      if (svgGrainy && existing.svgGrainy !== svgGrainy) {
        existing.svgGrainy = svgGrainy;
        isModified = true;
      }

      if (isModified) {
        updatedCount++;
      }
      resultShapes.push(existing);
    } else {
      const baseName = path.basename(file, path.extname(file));
      const parts = baseName.split('_');

      let cat = 'Custom';
      let num = String(i + 1);
      let name = formatName(baseName);

      if (parts.length >= 2) {
        cat = parts[0];
        num = parts[1];
        name = `${cat} ${num}`;
      }

      const defaultColor = PALETTE[i % PALETTE.length];
      const color = extractColor(svg, defaultColor);
      const d = extractPathD(svg);

      const newItem: ShapeItem = {
        id: baseName,
        name,
        cat,
        num,
        file,
        svg,
        ...(svgGrainy ? { svgGrainy } : {}),
        ...(svgGradient ? { svgGradient } : {}),
        color,
        ...(d ? { d } : {}),
      };

      resultShapes.push(newItem);
      addedCount++;
    }
  }

  if (addedCount === 0 && updatedCount === 0 && resultShapes.length === existingShapes.length) {
    console.log(`[sync-shapes] Shapes up to date (${resultShapes.length} shapes).`);
    return;
  }

  const outputCode = `export interface ShapeItem {
  id: string;
  name: string;
  cat: string;
  num: string;
  file: string;
  svg: string;
  svgGrainy?: string;
  svgGradient?: string;
  color: string;
  d?: string;
}

function shuffleShapes(arr: ShapeItem[], seed = 777): ShapeItem[] {
  const result = [...arr];
  let s = seed;
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) % 4294967296;
    const rnd = (s >>> 0) / 4294967296;
    const j = Math.floor(rnd * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const RAW_SHAAPES: ShapeItem[] = ${JSON.stringify(resultShapes, null, 2)};

export const SHAAPES_DATA: ShapeItem[] = shuffleShapes(RAW_SHAAPES);
`;

  fs.writeFileSync(targetFile, outputCode, 'utf8');
  console.log(
    `[sync-shapes] Completed: ${addedCount} new shape(s) added, ${updatedCount} updated. Total: ${resultShapes.length} shapes.`
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  syncShapes().catch((err) => {
    console.error('[sync-shapes] Error synchronizing shapes:', err);
    process.exit(1);
  });
}
