export function prettifySvg(svgString: string): string {
  if (!svgString) return '';
  let formatted = '';
  let indent = 0;
  const tokens = svgString
    .replace(/>\s*</g, '>\n<')
    .replace(/\r\n/g, '\n')
    .split('\n');

  for (let token of tokens) {
    token = token.trim();
    if (!token) continue;
    if (token.startsWith('</')) {
      indent = Math.max(0, indent - 1);
    }
    formatted += '  '.repeat(indent) + token + '\n';
    if (!token.startsWith('</') && !token.endsWith('/>') && !token.includes('</')) {
      indent++;
    }
  }
  return formatted.trim();
}

export function toPascalCase(str: string): string {
  return (
    str
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
      .replace(/^[a-z]/, (c) => c.toUpperCase())
      .replace(/[^a-zA-Z0-9]/g, '') || 'Shaape'
  );
}

export function svgToJsx(rawSvg: string, shapeName: string = 'Shape'): string {
  if (!rawSvg) return '';
  const componentName = toPascalCase(shapeName);

  let jsx = rawSvg
    .replace(/\bclass=/g, 'className=')
    .replace(/\bfill-rule=/gi, 'fillRule=')
    .replace(/\bclip-rule=/gi, 'clipRule=')
    .replace(/\bclip-path=/gi, 'clipPath=')
    .replace(/\bfill-opacity=/gi, 'fillOpacity=')
    .replace(/\bstop-color=/gi, 'stopColor=')
    .replace(/\bstop-opacity=/gi, 'stopOpacity=')
    .replace(/\bstroke-width=/gi, 'strokeWidth=')
    .replace(/\bstroke-linecap=/gi, 'strokeLinecap=')
    .replace(/\bstroke-linejoin=/gi, 'strokeLinejoin=')
    .replace(/\bstroke-miterlimit=/gi, 'strokeMiterlimit=')
    .replace(/\bstroke-dasharray=/gi, 'strokeDasharray=')
    .replace(/\bstroke-dashoffset=/gi, 'strokeDashoffset=')
    .replace(/\bstroke-opacity=/gi, 'strokeOpacity=')
    .replace(/\bcolor-interpolation-filters=/gi, 'colorInterpolationFilters=')
    .replace(/\bstyle="([^"]*)"/gi, (_, styleStr: string) => {
      const styles: Record<string, string> = {};
      styleStr.split(';').forEach((pair: string) => {
        const [k, v] = pair.split(':').map((s: string) => s.trim());
        if (!k || !v) return;
        const camelK = k.replace(/-([a-z])/g, (_: string, letter: string) => letter.toUpperCase());
        styles[camelK] = v;
      });
      return `style={${JSON.stringify(styles)}}`;
    });

  // Inject {...props} into root <svg>
  jsx = jsx.replace(/<svg\b([^>]*)>/i, '<svg$1 {...props}>');

  const prettyJsx = prettifySvg(jsx)
    .split('\n')
    .map((line) => '    ' + line)
    .join('\n');

  return `import React from 'react';

export function ${componentName}(props: React.SVGProps<SVGSVGElement>) {
  return (
${prettyJsx}
  );
}

export default ${componentName};`;
}

export function svgToCss(rawSvg: string, selector: string = '.shape'): string {
  if (!rawSvg) return '';
  const minified = rawSvg.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim();
  const dataUri = `data:image/svg+xml,${encodeURIComponent(minified)}`;

  return `/* CSS Background */
${selector} {
  background-image: url("${dataUri}");
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

/* Tailwind CSS Arbitrary Value */
/* className="bg-[url('${dataUri}')] bg-contain bg-no-repeat bg-center" */`;
}

export function svgToDataUri(rawSvg: string): string {
  if (!rawSvg) return '';
  const minified = rawSvg.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim();
  return `data:image/svg+xml,${encodeURIComponent(minified)}`;
}
