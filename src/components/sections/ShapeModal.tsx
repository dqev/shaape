import React, { useState, useEffect, useRef } from 'react';
import type { ShapeItem } from '../../data/shapes';
import { SOLID_PALETTE, GRADIENT_THEMES, type GradientTheme } from '../../data/generator-presets';
import { buildLiveSvg } from '../../scripts/modal-svg';
import { downloadSvg, downloadPng } from '../../scripts/download';
import { copyTextToClipboard, copySvgToClipboard } from '../../scripts/clipboard';
import { prettifySvg, svgToJsx, svgToCss } from '../../scripts/export-formats';
import SquircleCard from '../ui/SquircleCard';
import FluidTabs from '../ui/FluidTabs';

export interface ShapeModalProps {
  isOpen: boolean;
  shape: ShapeItem | null;
  triggerElement?: HTMLElement | null;
  initialMode?: string;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

export const ShapeModal: React.FC<ShapeModalProps> = ({
  isOpen,
  shape,
  triggerElement = null,
  initialMode = 'gradient',
  onClose,
  onPrev,
  onNext,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [mode, setMode] = useState<string>(initialMode);
  const [color, setColor] = useState<string>('#ffb800');
  const [gradTheme, setGradTheme] = useState<GradientTheme>(GRADIENT_THEMES[0]);
  const [customGrad, setCustomGrad] = useState<[string, string]>(['#FF58E4', '#FF7A00']);
  const [noise, setNoise] = useState<number>(50);
  const [scale, setScale] = useState<number>(100);
  const [rotate, setRotate] = useState<number>(0);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [codeFormat, setCodeFormat] = useState<'svg' | 'jsx' | 'css'>('svg');
  const [copiedFormat, setCopiedFormat] = useState<'svg' | 'jsx' | 'css' | null>(null);

  const nativeColorInputRef = useRef<HTMLInputElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const modalCardRef = useRef<HTMLDivElement | null>(null);
  const currentTriggerRef = useRef<HTMLElement | null>(null);
  const isClosingRef = useRef<boolean>(false);
  const hasAnimatedOpenRef = useRef<boolean>(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isRendered, setIsRendered] = useState<boolean>(isOpen);
  const [currentShapeId, setCurrentShapeId] = useState<string | undefined>(shape?.id);
  const [isShapeChanging, setIsShapeChanging] = useState<boolean>(false);
  const isFirstOpenRef = useRef<boolean>(true);

  if (isOpen && !isFirstOpenRef.current && shape?.id && shape.id !== currentShapeId) {
    setCurrentShapeId(shape.id);
    setIsShapeChanging(true);
  }

  const currentSvg = shape
    ? buildLiveSvg(
        shape,
        mode,
        color,
        gradTheme,
        customGrad,
        noise,
        scale,
        rotate
      )
    : '';

  const cleanName = shape
    ? (shape.name || shape.id || 'shape')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
    : 'shape';

  const handleCopyFormat = async (format: 'svg' | 'jsx' | 'css') => {
    if (!currentSvg || !shape) return;
    if (format === 'svg') {
      await copySvgToClipboard(currentSvg, 'Copied SVG (Vector paste into Figma supported)!');
    } else if (format === 'jsx') {
      const jsxCode = svgToJsx(currentSvg, shape.name || shape.id);
      copyTextToClipboard(jsxCode, 'Copied React JSX Component!');
    } else if (format === 'css') {
      const cssCode = svgToCss(currentSvg, `.${cleanName}`);
      copyTextToClipboard(cssCode, 'Copied CSS Data URI!');
    }
    setCopiedFormat(format);
    setIsCopied(true);
    setTimeout(() => {
      setCopiedFormat(null);
      setIsCopied(false);
    }, 1500);
  };

  const handleDownloadSvg = () => {
    if (!currentSvg) return;
    downloadSvg(currentSvg, `${cleanName}-${mode}`);
  };

  const handleDownloadPng = () => {
    if (!currentSvg) return;
    downloadPng(currentSvg, `${cleanName}-${mode}`, 1200);
  };

  useEffect(() => {
    if (triggerElement) {
      currentTriggerRef.current = triggerElement;
    }
  }, [triggerElement]);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setMode(initialMode || 'gradient');
      setActiveTab('preview');
      setCurrentShapeId(shape?.id);
      setIsShapeChanging(false);
      isFirstOpenRef.current = true;
      const t = setTimeout(() => {
        isFirstOpenRef.current = false;
      }, 450);
      return () => clearTimeout(t);
    } else {
      isFirstOpenRef.current = true;
      setIsShapeChanging(false);
    }
  }, [isOpen, initialMode]);

  useEffect(() => {
    if (isShapeChanging) {
      let r1 = 0;
      let r2 = 0;
      r1 = requestAnimationFrame(() => {
        r2 = requestAnimationFrame(() => {
          setIsShapeChanging(false);
        });
      });
      return () => {
        if (r1) cancelAnimationFrame(r1);
        if (r2) cancelAnimationFrame(r2);
      };
    }
  }, [isShapeChanging]);

  useEffect(() => {
    if (shape) {
      setColor(shape.color || '#ffb800');
      setScale(100);
      setRotate(0);
      setNoise(50);
    }
  }, [shape?.id]);

  useEffect(() => {
    if (!isRendered || !isOpen || hasAnimatedOpenRef.current) return;

    hasAnimatedOpenRef.current = true;
    isClosingRef.current = false;
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    const overlay = overlayRef.current;
    const modalCard = modalCardRef.current;
    if (!overlay || !modalCard) return;

    const trigger =
      triggerElement ||
      currentTriggerRef.current ||
      (shape ? document.querySelector<HTMLElement>(`[data-shape-id="${shape.id}"]`) : null);

    if (trigger) {
      currentTriggerRef.current = trigger;
      const originRect = trigger.getBoundingClientRect();

      if (originRect.width > 0 && originRect.height > 0) {
        // Lock scroll without layout shift
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        if (scrollbarWidth > 0) {
          document.body.style.paddingRight = `${scrollbarWidth}px`;
        }
        document.body.style.overflow = 'hidden';

        overlay.style.display = 'flex';
        overlay.classList.add('is-open');

        // Measure natural rest position of modal card
        modalCard.style.transition = 'none';
        modalCard.style.transform = 'translate(0, 0) scale(1)';
        modalCard.style.opacity = '0';

        const modalRect = modalCard.getBoundingClientRect();
        const cardCenterX = originRect.left + originRect.width / 2;
        const cardCenterY = originRect.top + originRect.height / 2;
        const modalCenterX = modalRect.left + modalRect.width / 2;
        const modalCenterY = modalRect.top + modalRect.height / 2;
        const deltaX = Math.round(cardCenterX - modalCenterX);
        const deltaY = Math.round(cardCenterY - modalCenterY);
        const modalWidth = modalCard.offsetWidth || modalRect.width || 960;
        const scaleFactor = Math.min(0.36, Math.max(0.18, originRect.width / modalWidth));

        modalCard.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(${scaleFactor})`;
        overlay.style.transition = 'none';
        overlay.style.opacity = '0';

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            overlay.style.transition = 'opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
            overlay.style.opacity = '1';
            modalCard.style.transition =
              'transform 0.44s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.32s cubic-bezier(0.16, 1, 0.3, 1)';
            modalCard.style.transform = 'translate(0, 0) scale(1)';
            modalCard.style.opacity = '1';
          });
        });
        return;
      }
    }

    // Graceful Fallback
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    document.body.style.overflow = 'hidden';
    overlay.style.display = 'flex';
    overlay.classList.add('is-open');

    modalCard.style.transition = 'none';
    modalCard.style.transform = 'translate(0, 24px) scale(0.96)';
    modalCard.style.opacity = '0';
    overlay.style.transition = 'none';
    overlay.style.opacity = '0';

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.style.transition = 'opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
        overlay.style.opacity = '1';
        modalCard.style.transition =
          'transform 0.38s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
        modalCard.style.transform = 'translate(0, 0) scale(1)';
        modalCard.style.opacity = '1';
      });
    });
  }, [isRendered, isOpen, shape?.id]);

  const handleRequestClose = () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    const overlay = overlayRef.current;
    const modalCard = modalCardRef.current;

    if (!overlay || !modalCard) {
      hasAnimatedOpenRef.current = false;
      isClosingRef.current = false;
      currentTriggerRef.current = null;
      setIsRendered(false);
      if (typeof document !== 'undefined') {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      }
      onClose();
      return;
    }

    overlay.classList.add('is-closing');

    const trigger =
      (shape ? document.getElementById(`shape-card-${shape.id}`) : null) ||
      (shape ? document.querySelector<HTMLElement>(`[data-shape-id="${shape.id}"]`) : null) ||
      currentTriggerRef.current ||
      triggerElement;

    let targetTransform = 'translate(0, 20px) scale(0.96)';
    if (trigger) {
      const originRect = trigger.getBoundingClientRect();
      const isVisibleInViewport =
        originRect.width > 0 &&
        originRect.height > 0 &&
        originRect.bottom >= 0 &&
        originRect.top <= window.innerHeight;

      if (isVisibleInViewport) {
        const cardCenterX = originRect.left + originRect.width / 2;
        const cardCenterY = originRect.top + originRect.height / 2;
        const vpCenterX = window.innerWidth / 2;
        const vpCenterY = window.innerHeight / 2;
        const deltaX = Math.round(cardCenterX - vpCenterX);
        const deltaY = Math.round(cardCenterY - vpCenterY);
        const modalWidth = modalCard.offsetWidth || 960;
        const scaleFactor = Math.min(0.36, Math.max(0.18, originRect.width / modalWidth));
        targetTransform = `translate(${deltaX}px, ${deltaY}px) scale(${scaleFactor})`;
      }
    }

    requestAnimationFrame(() => {
      overlay.style.transition = 'opacity 0.32s cubic-bezier(0.16, 1, 0.3, 1)';
      overlay.style.opacity = '0';
      modalCard.style.transition =
        'transform 0.38s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.30s cubic-bezier(0.16, 1, 0.3, 1)';
      modalCard.style.transform = targetTransform;
      modalCard.style.opacity = '0';
    });

    closeTimeoutRef.current = setTimeout(() => {
      if (overlay) {
        overlay.style.display = 'none';
        overlay.classList.remove('is-open');
        overlay.classList.remove('is-closing');
      }
      if (typeof document !== 'undefined') {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      }
      hasAnimatedOpenRef.current = false;
      currentTriggerRef.current = null;
      setIsRendered(false);
      onClose();
    }, 380);
  };

  useEffect(() => {
    if (!isOpen && isRendered && !isClosingRef.current) {
      handleRequestClose();
    }
    if (isOpen) {
      isClosingRef.current = false;
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
      if (typeof document !== 'undefined') {
        document.body.style.overflow = '';
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || isClosingRef.current) return;

      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      if (e.key === 'Escape') {
        e.preventDefault();
        handleRequestClose();
      } else if (!isInput) {
        if (e.key === 'ArrowLeft' && onPrev) {
          e.preventDefault();
          onPrev();
        } else if (e.key === 'ArrowRight' && onNext) {
          e.preventDefault();
          onNext();
        } else if ((e.key === 'c' || e.key === 'C') && !e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          handleCopyFormat(codeFormat);
        } else if ((e.key === 'd' || e.key === 'D') && !e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          handleDownloadSvg();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onPrev, onNext, codeFormat, currentSvg]);

  if (!shape) return null;
  if (!isOpen && !isRendered) return null;

  const stageTabs = [
    { id: 'preview', label: 'Preview' },
    { id: 'code', label: 'Code' },
  ];

  const styleTabs = [
    { id: 'normal', label: 'Normal' },
    { id: 'gradient', label: 'Gradient' },
    { id: 'grainy', label: 'Grainy' },
  ];

  const codeFormatTabs = [
    { id: 'svg', label: 'SVG' },
    { id: 'jsx', label: 'React JSX' },
    { id: 'css', label: 'CSS / Data URI' },
  ];

  return (
    <div
      ref={overlayRef}
      className={`shape-modal-overlay ${isOpen ? 'is-open' : ''}`.trim()}
      aria-hidden={!isOpen}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleRequestClose();
      }}
    >
      <div className="shape-modal-outer-wrapper">
        {onPrev && (
          <button
            type="button"
            className="modal-outer-nav prev"
            title="Previous shape (←)"
            aria-label="Previous shape"
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}

        <SquircleCard
          ref={modalCardRef}
          radius={32}
          smoothing={60}
          className={`shape-modal-card ${mode === 'grainy' ? 'is-grainy' : ''}`.trim()}
          id="shapeModalCard"
          data-mode={mode}
        >
        <div className="shape-modal-stage">
          <div className="modal-stage-header">
            <div className="modal-stage-header-left">
              <button
                type="button"
                className="modal-icon-btn modal-back-btn"
                title="Back"
                aria-label="Close modal"
                onClick={handleRequestClose}
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
                >
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
              </button>

              <FluidTabs
                tabs={stageTabs}
                activeId={activeTab}
                onChange={(id) => setActiveTab(id as 'preview' | 'code')}
                id="stageTabNav"
                className="modal-segmented"
                sliderClassName="stage-slider"
                btnClassName="modal-seg-btn"
                ariaLabel="Stage preview switcher"
              />
            </div>

            <button
              type="button"
              className={`modal-copy-code-btn ${
                activeTab === 'code' ? 'is-visible' : ''
              } ${isCopied ? 'is-copied' : ''}`.trim()}
              title={`Copy ${codeFormat.toUpperCase()}`}
              aria-label={`Copy ${codeFormat.toUpperCase()}`}
              onClick={() => handleCopyFormat(codeFormat)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {isCopied ? (
                  <polyline points="20 6 9 17 4 12"></polyline>
                ) : (
                  <>
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </>
                )}
              </svg>
              <span>
                {isCopied
                  ? 'Copied!'
                  : codeFormat === 'svg'
                  ? 'Copy SVG'
                  : codeFormat === 'jsx'
                  ? 'Copy JSX'
                  : 'Copy CSS'}
              </span>
            </button>
          </div>

          <div className="modal-stage-body">
            <div className="modal-preview-area" id="modalPreviewArea">
              {activeTab === 'preview' && onPrev && (
                <button
                  type="button"
                  className="modal-stage-nav prev"
                  title="Previous shape (←)"
                  aria-label="Previous shape"
                  onClick={onPrev}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
              )}

              <div
                className={`modal-svg-wrap ${mode === 'grainy' ? 'is-grainy' : ''} ${isShapeChanging ? 'is-shape-changing' : ''}`.trim()}
                style={{ display: activeTab === 'preview' ? 'flex' : 'none' }}
                dangerouslySetInnerHTML={{ __html: currentSvg }}
              />

              {activeTab === 'preview' && onNext && (
                <button
                  type="button"
                  className="modal-stage-nav next"
                  title="Next shape (→)"
                  aria-label="Next shape"
                  onClick={onNext}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              )}

              {activeTab === 'preview' && (
                <div className="modal-shortcut-hint">
                  <kbd>←</kbd> <kbd>→</kbd> browse &middot; <kbd>C</kbd> copy &middot; <kbd>D</kbd> download
                </div>
              )}
              <div
                className="modal-code-wrap"
                style={{ display: activeTab === 'code' ? 'flex' : 'none' }}
              >
                <div className="modal-code-header">
                  <FluidTabs
                    key={activeTab}
                    tabs={codeFormatTabs}
                    activeId={codeFormat}
                    onChange={(id) => setCodeFormat(id as 'svg' | 'jsx' | 'css')}
                    id="modalCodeFormatTabs"
                    className="modal-code-format-pills"
                    sliderClassName="code-format-slider"
                    btnClassName="code-format-tab-btn"
                    ariaLabel="Code format selector"
                  />
                </div>
                <div className="modal-code-scroller">
                  <pre className="modal-code-pre">
                    <code>
                      {codeFormat === 'svg'
                        ? prettifySvg(currentSvg)
                        : codeFormat === 'jsx'
                        ? svgToJsx(currentSvg, shape.name || shape.id)
                        : svgToCss(currentSvg, `.${cleanName}`)}
                    </code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="shape-modal-sidebar">
          <div className="modal-sidebar-header">
            <h2 className="modal-shape-title">{shape.name}</h2>
            <button
              type="button"
              className="sidebar-icon-btn"
              title="Close"
              aria-label="Close modal"
              onClick={handleRequestClose}
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
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div className="modal-sidebar-body">
            <FluidTabs
              tabs={styleTabs}
              activeId={mode}
              onChange={(id) => setMode(id)}
              className="sidebar-style-pill"
              sliderClassName="sidebar-style-slider"
              btnClassName="sidebar-style-btn"
              ariaLabel="Modal style mode"
            />

            <div className="sidebar-swatches-wrap">
              <div className="sidebar-swatches-header">
                <span className="capsule-label">
                  {mode === 'normal' ? 'Color' : 'Gradient'}
                </span>
              </div>
              <div className="sidebar-color-swatches">
                {mode === 'normal' ? (
                  <>
                    {SOLID_PALETTE.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={`sidebar-swatch ${c === '#18181b' ? '' : 'is-light'} ${
                          color === c ? 'active' : ''
                        }`.trim()}
                        style={{ backgroundColor: c }}
                        title={c}
                        aria-label={c}
                        onClick={() => setColor(c)}
                      />
                    ))}
                    <button
                      type="button"
                      className={`sidebar-picker-toggle ${
                        !SOLID_PALETTE.includes(color) ? 'active' : ''
                      }`.trim()}
                      title="Custom color"
                      aria-label="Custom color picker"
                      onClick={() => nativeColorInputRef.current?.click()}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                    </button>
                    <input
                      ref={nativeColorInputRef}
                      type="color"
                      value={color}
                      style={{ display: 'none' }}
                      aria-label="Custom color input"
                      onChange={(e) => setColor(e.target.value)}
                    />
                  </>
                ) : (
                  GRADIENT_THEMES.map((theme) => {
                    const isSelected = gradTheme.name === theme.name;
                    return (
                      <button
                        key={theme.name}
                        type="button"
                        className={`sidebar-swatch ${isSelected ? 'active' : ''}`.trim()}
                        style={{
                          background: `linear-gradient(135deg, ${theme.stops[0]}, ${theme.stops[1]})`,
                        }}
                        title={theme.name}
                        aria-label={theme.name}
                        onClick={() => {
                          setGradTheme(theme);
                          setCustomGrad(theme.stops);
                        }}
                      />
                    );
                  })
                )}
              </div>
            </div>

            {mode === 'grainy' && (
              <div className="sidebar-capsule-row" id="modalNoiseRow">
                <span className="capsule-label">Noise</span>
                <div className="slider-track-wrap">
                  <input
                    type="range"
                    className="sidebar-slider-input"
                    min="0"
                    max="100"
                    value={noise}
                    aria-label="Noise intensity"
                    onChange={(e) => setNoise(parseInt(e.target.value, 10))}
                  />
                </div>
                <span className="capsule-value">{noise}%</span>
              </div>
            )}

            <div className="sidebar-capsule-row">
              <span className="capsule-label">Reach</span>
              <div className="slider-track-wrap">
                <input
                  type="range"
                  className="sidebar-slider-input"
                  min="50"
                  max="150"
                  value={scale}
                  aria-label="Reach scale"
                  onChange={(e) => setScale(parseInt(e.target.value, 10))}
                />
              </div>
              <span className="capsule-value">{scale}%</span>
            </div>

            <div className="sidebar-capsule-row">
              <span className="capsule-label">Bounce</span>
              <div className="slider-track-wrap">
                <input
                  type="range"
                  className="sidebar-slider-input"
                  min="0"
                  max="360"
                  value={rotate}
                  aria-label="Bounce rotation"
                  onChange={(e) => setRotate(parseInt(e.target.value, 10))}
                />
              </div>
              <span className="capsule-value">{rotate}°</span>
            </div>
          </div>

          <div className="modal-sidebar-footer">
            <div className="sidebar-copy-row">
              <button
                type="button"
                className={`sidebar-copy-btn primary ${copiedFormat === 'svg' ? 'is-copied' : ''}`}
                onClick={() => handleCopyFormat('svg')}
                title="Copy SVG code (Figma vector paste supported)"
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
                >
                  {copiedFormat === 'svg' ? (
                    <polyline points="20 6 9 17 4 12" />
                  ) : (
                    <>
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </>
                  )}
                </svg>
                <span>{copiedFormat === 'svg' ? 'Copied SVG!' : 'Copy SVG'}</span>
              </button>
              <button
                type="button"
                className={`sidebar-chip-btn ${copiedFormat === 'jsx' ? 'is-copied' : ''}`}
                onClick={() => handleCopyFormat('jsx')}
                title="Copy React JSX component"
                aria-label="Copy React JSX component"
              >
                {copiedFormat === 'jsx' ? (
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
                    className="sidebar-chip-tick"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  'JSX'
                )}
              </button>
              <button
                type="button"
                className={`sidebar-chip-btn ${copiedFormat === 'css' ? 'is-copied' : ''}`}
                onClick={() => handleCopyFormat('css')}
                title="Copy CSS background Data URI"
                aria-label="Copy CSS background Data URI"
              >
                {copiedFormat === 'css' ? (
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
                    className="sidebar-chip-tick"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  'CSS'
                )}
              </button>
            </div>

            <div className="sidebar-dl-row">
              <button
                type="button"
                className="sidebar-dl-btn secondary flex-1"
                onClick={handleDownloadSvg}
              >
                Download SVG
              </button>
              <button
                type="button"
                className="sidebar-dl-btn secondary btn-png"
                onClick={handleDownloadPng}
              >
                PNG
              </button>
            </div>
          </div>
        </div>
      </SquircleCard>

      {onNext && (
        <button
          type="button"
          className="modal-outer-nav next"
          title="Next shape (→)"
          aria-label="Next shape"
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}
    </div>
  </div>
);
};

export default ShapeModal;
