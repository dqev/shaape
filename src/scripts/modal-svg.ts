import type { ShapeItem } from '../data/shapes';
import type { GradientTheme } from '../data/generator-presets';

export function extractMaskD(svgString: string): string {
  if (!svgString) return '';
  const match = svgString.match(/<mask[^>]*>[\s\S]*?<path[^>]*\bd="([^"]+)"[\s\S]*?<\/mask>/i);
  if (match && match[1]) return match[1];
  const pathMatch = svgString.match(/<path[^>]*\bd="([^"]+)"/i);
  return pathMatch ? pathMatch[1] : '';
}

export function getBaseD(shape: ShapeItem): string {
  if (!shape) return '';
  if (shape.svg) {
    const match = shape.svg.match(/<path[^>]*\bd="([^"]+)"/i);
    if (match && match[1]) return match[1];
  }
  if (shape.svgGradient) {
    const d = extractMaskD(shape.svgGradient);
    if (d) return d;
  }
  if (shape.svgGrainy) {
    const d = extractMaskD(shape.svgGrainy);
    if (d) return d;
  }
  return '';
}

export function buildLiveSvg(
  shape: ShapeItem,
  mode: string,
  color: string,
  gradTheme?: GradientTheme | null,
  customGrad?: [string, string],
  noise: number = 50,
  scale: number = 100,
  rotate: number = 0
): string {
  if (!shape) return '';
  const d = getBaseD(shape);

  let rawSvg = '';
  if (mode === 'grainy' && shape.svgGrainy) {
    rawSvg = shape.svgGrainy;
    const op = (noise / 100).toFixed(2);
    const freq = (0.2 + (noise / 100) * 0.7).toFixed(2);
    rawSvg = rawSvg.replace(/style="mix-blend-mode:overlay[^"]*"/, `style="mix-blend-mode:overlay; opacity: ${op};"`);
    rawSvg = rawSvg.replace(/baseFrequency="[^"]+"/, `baseFrequency="${freq}"`);
    if (gradTheme && gradTheme.stops) {
      let stopIdx = 0;
      rawSvg = rawSvg.replace(/stop-color="[^"]+"/g, () => {
        const col = gradTheme.stops[stopIdx % gradTheme.stops.length];
        stopIdx++;
        return `stop-color="${col}"`;
      });
      if (gradTheme.blobs) {
        let blobIdx = 0;
        rawSvg = rawSvg.replace(/<g filter="url\(#filter0_f[^"]*\)">[\s\S]*?<\/g>/, (match) => {
          return match.replace(/fill="[^"]+"/g, () => {
            const bCol = gradTheme.blobs[blobIdx % gradTheme.blobs.length];
            blobIdx++;
            return `fill="${bCol}"`;
          });
        });
      }
    } else if (customGrad && customGrad[0] && customGrad[1]) {
      let stopIdx = 0;
      rawSvg = rawSvg.replace(/stop-color="[^"]+"/g, () => {
        const col = customGrad[stopIdx % 2];
        stopIdx++;
        return `stop-color="${col}"`;
      });
    }
  } else if (mode === 'gradient' && shape.svgGradient) {
    rawSvg = shape.svgGradient;
    if (gradTheme && gradTheme.stops) {
      let stopIdx = 0;
      rawSvg = rawSvg.replace(/stop-color="[^"]+"/g, () => {
        const col = gradTheme.stops[stopIdx % gradTheme.stops.length];
        stopIdx++;
        return `stop-color="${col}"`;
      });
      if (gradTheme.blobs) {
        let blobIdx = 0;
        rawSvg = rawSvg.replace(/<g filter="url\(#filter0_f[^"]*\)">[\s\S]*?<\/g>/, (match) => {
          return match.replace(/fill="[^"]+"/g, () => {
            const bCol = gradTheme.blobs[blobIdx % gradTheme.blobs.length];
            blobIdx++;
            return `fill="${bCol}"`;
          });
        });
      }
    } else if (customGrad && customGrad[0] && customGrad[1]) {
      let stopIdx = 0;
      rawSvg = rawSvg.replace(/stop-color="[^"]+"/g, () => {
        const col = customGrad[stopIdx % 2];
        stopIdx++;
        return `stop-color="${col}"`;
      });
    }
  } else {
    if (shape.svg) {
      rawSvg = shape.svg.replace(/\bfill="[^"]+"/gi, (match) => {
        if (match.toLowerCase() === 'fill="none"') return match;
        return `fill="${color}"`;
      });
    } else {
      rawSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="-3.093 -3.093 206.186 206.186"><path fill="${color}" fill-rule="evenodd" clip-rule="evenodd" d="${d}"/></svg>`;
    }
  }

  rawSvg = rawSvg.trim();

  if (scale === 100 && rotate === 0) {
    return rawSvg;
  }

  const s = scale / 100;
  const transformAttr = `transform="translate(100 100) scale(${s}) rotate(${rotate}) translate(-100 -100)"`;
  return rawSvg.replace(/<svg([^>]*)>/, `<svg$1><g ${transformAttr}>`).replace(/<\/svg>$/, `</g></svg>`).trim();
}
