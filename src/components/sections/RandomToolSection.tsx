import React, { useState, useEffect, useRef } from 'react';
import SquircleCard from '../ui/SquircleCard';
import FluidTabs, { type TabItem } from '../ui/FluidTabs';
import { generate, assembleSvg, createLighting, type GeneratedShape } from '../../scripts/generator';
import { downloadSvg, downloadPng } from '../../scripts/download';
import { copySvgToClipboard } from '../../scripts/clipboard';

const SWATCHES = [
  { color: '#ff7a00', label: 'Amber Orange' },
  { color: '#ff2a6d', label: 'Coral Red' },
  { color: '#ff58e4', label: 'Magenta Pink' },
  { color: '#ffb800', label: 'Warm Yellow' },
  { color: '#8b5cf6', label: 'Electric Purple' },
  { color: '#3b82f6', label: 'Vibrant Blue' },
  { color: '#10b981', label: 'Emerald' },
  { color: '#18181b', label: 'Dark Mono' },
];

const CATEGORIES: TabItem[] = [
  { id: 'random', label: 'All' },
  { id: 'geometry', label: 'Geometry' },
  { id: 'stars', label: 'Stars' },
  { id: 'flowers', label: 'Flowers' },
];

const STYLES: TabItem[] = [
  { id: 'normal', label: 'Normal' },
  { id: 'gradient', label: 'Gradient' },
  { id: 'grainy', label: 'Grainy' },
];

export interface RandomToolSectionProps {
  isVisible: boolean;
}

export const RandomToolSection: React.FC<RandomToolSectionProps> = ({ isVisible }) => {
  const [currentCategory, setCurrentCategory] = useState<string>('random');
  const [currentColor, setCurrentColor] = useState<string>('#ff7a00');
  const [currentStyle, setCurrentStyle] = useState<string>('gradient');
  const [currentShape, setCurrentShape] = useState<GeneratedShape | null>(null);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const svgBoxRef = useRef<HTMLDivElement | null>(null);
  const copyBtnRef = useRef<HTMLButtonElement | null>(null);

  const shakeShape = (animate: boolean = true) => {
    const shape = generate(currentCategory, currentColor, currentStyle);
    setCurrentShape(shape);

    if (animate) {
      setIsShaking(false);
      requestAnimationFrame(() => {
        setIsShaking(true);
      });
    }
  };

  useEffect(() => {
    if (isVisible && !currentShape) {
      shakeShape(false);
    }
  }, [isVisible]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible) return;
      if (e.code === 'Space') {
        const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
        if (activeTag !== 'input' && activeTag !== 'textarea') {
          e.preventDefault();
          shakeShape(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, currentCategory, currentColor, currentStyle]);

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!svgBoxRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    svgBoxRef.current.style.transform = `translate(${nx * 8}px, ${ny * 8}px) scale(${
      1 + 0.03 * Math.abs(nx * ny)
    }) rotate(${nx * 2}deg)`;
    svgBoxRef.current.style.transition = 'transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1)';
  };

  const handleCardMouseLeave = () => {
    if (!svgBoxRef.current) return;
    svgBoxRef.current.style.transform = 'translate(0px, 0px) scale(1) rotate(0deg)';
    svgBoxRef.current.style.transition = 'transform 600ms cubic-bezier(0.34, 1.56, 0.64, 1)';
  };

  const handleCategoryChange = (cat: string) => {
    setCurrentCategory(cat);
    const shape = generate(cat, currentColor, currentStyle);
    setCurrentShape(shape);
    setIsShaking(false);
    requestAnimationFrame(() => setIsShaking(true));
  };

  const handleStyleChange = (style: string) => {
    setCurrentStyle(style);
    if (currentShape) {
      const newLighting =
        !currentShape.lighting || currentShape.lighting.color !== currentColor
          ? createLighting(currentColor)
          : currentShape.lighting;
      const newSvg = assembleSvg(currentShape.path, currentColor, style, newLighting);
      setCurrentShape({
        ...currentShape,
        styleMode: style,
        lighting: newLighting,
        svg: newSvg,
      });
      setIsShaking(false);
      requestAnimationFrame(() => setIsShaking(true));
    } else {
      shakeShape(true);
    }
  };

  const handleColorChange = (color: string) => {
    setCurrentColor(color);
    if (currentShape) {
      const newLighting = createLighting(color);
      const newSvg = assembleSvg(currentShape.path, color, currentStyle, newLighting);
      setCurrentShape({
        ...currentShape,
        color: color,
        lighting: newLighting,
        svg: newSvg,
      });
      setIsShaking(false);
      requestAnimationFrame(() => setIsShaking(true));
    } else {
      shakeShape(true);
    }
  };

  const handleCopySvg = () => {
    if (!currentShape) return;
    copySvgToClipboard(currentShape.svg, 'Copied SVG!', copyBtnRef.current);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1800);
  };

  const handleDownloadSvg = () => {
    if (!currentShape) return;
    const cleanName = (currentShape.name || 'shape')
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '_');
    downloadSvg(currentShape.svg, `${cleanName}_${currentStyle}`);
  };

  const handleDownloadPng = () => {
    if (!currentShape) return;
    const cleanName = (currentShape.name || 'shape')
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '_');
    downloadPng(currentShape.svg, `${cleanName}_${currentStyle}`, 1000);
  };

  if (!isVisible) return null;

  return (
    <section className="random-tool-section" id="randomToolSection">
      {/* Category Filter using FluidTabs */}
      <div className="random-category-tabs-wrapper">
        <FluidTabs
          tabs={CATEGORIES}
          activeId={currentCategory}
          onChange={handleCategoryChange}
          className="random-cat-fluid-pill"
          sliderClassName="view-slider"
          btnClassName="view-btn"
          ariaLabel="Category filter"
        />
      </div>

      {/* Main Interactive Stage */}
      <div className="random-stage-card-wrapper">
        <SquircleCard
          radius={32}
          smoothing={60}
          className="random-preview-card"
          id="randomCard"
          onMouseMove={handleCardMouseMove}
          onMouseLeave={handleCardMouseLeave}
          onClick={(e) => {
            if (!(e.target as HTMLElement).closest('button')) {
              shakeShape(true);
            }
          }}
          title="Click anywhere to shake & generate a new shape"
        >
          <div className="random-shape-wrapper" id="randomShapeWrapper">
            <div
              ref={svgBoxRef}
              className={`random-svg-box ${isShaking ? 'is-shaking' : ''}`.trim()}
              id="randomSvgBox"
              dangerouslySetInnerHTML={{ __html: currentShape?.svg || '' }}
            />
          </div>

          <div className="random-card-hint-badge" aria-hidden="true">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            <span>Click or <kbd>Space</kbd> to shake</span>
          </div>
        </SquircleCard>
      </div>

      {/* Controls: Style Switcher & Swatches */}
      <div className="random-controls-panel">
        <div className="random-controls-row">
          <FluidTabs
            tabs={STYLES}
            activeId={currentStyle}
            onChange={handleStyleChange}
            className="style-toggle-pill"
            sliderClassName="style-slider"
            btnClassName="style-btn"
            ariaLabel="Shape style switcher"
          />

          <div className="random-palette-row" id="randomPalette" role="radiogroup" aria-label="Color palette selector">
            {SWATCHES.map((sw) => {
              const isActive = sw.color === currentColor;
              return (
                <button
                  key={sw.color}
                  type="button"
                  className={`random-swatch ${isActive ? 'active' : ''}`.trim()}
                  style={{ backgroundColor: sw.color, color: sw.color }}
                  title={sw.label}
                  aria-label={sw.label}
                  onClick={() => handleColorChange(sw.color)}
                />
              );
            })}
          </div>
        </div>

        {/* Primary Shake Action Button */}
        <div className="random-primary-action-wrap">
          <button
            type="button"
            className="random-shake-btn"
            id="btnShake"
            aria-label="Generate new random shape"
            onClick={() => shakeShape(true)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <path d="M16 8h.01" />
              <path d="M8 8h.01" />
              <path d="M8 16h.01" />
              <path d="M16 16h.01" />
              <path d="M12 12h.01" />
            </svg>
            <span>Shake Shape</span>
          </button>
        </div>

        {/* Clean Export Actions Group */}
        <div className="random-export-actions">
          <button
            ref={copyBtnRef}
            type="button"
            className="random-export-pill random-export-pill-primary"
            id="btnRandomCopySvg"
            onClick={handleCopySvg}
            title="Copy SVG code to clipboard"
          >
            {isCopied ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
            <span>{isCopied ? 'Copied!' : 'SVG'}</span>
          </button>

          <button
            type="button"
            className="random-export-pill random-export-pill-secondary"
            id="btnRandomDownloadSvg"
            onClick={handleDownloadSvg}
            title="Download SVG vector file"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>SVG</span>
          </button>

          <button
            type="button"
            className="random-export-pill random-export-pill-secondary"
            id="btnRandomDownloadPng"
            onClick={handleDownloadPng}
            title="Download High-Resolution PNG (4x)"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span>PNG</span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default RandomToolSection;
