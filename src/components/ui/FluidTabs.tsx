import React, { useRef, useEffect, useState } from 'react';

export interface TabItem {
  id: string;
  label: React.ReactNode;
  title?: string;
  ariaLabel?: string;
}

export interface FluidTabsProps {
  tabs: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  id?: string;
  className?: string;
  sliderClassName?: string;
  btnClassName?: string;
  ariaLabel?: string;
}

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect;

const getInitialSliderStyle = () => {
  return { width: 0, transform: 'translateX(3px)', hasTransition: false };
};

export const FluidTabs: React.FC<FluidTabsProps> = ({
  tabs,
  activeId,
  onChange,
  id,
  className = '',
  sliderClassName = '',
  btnClassName = '',
  ariaLabel = 'Tab switcher',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const btnRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [sliderStyle, setSliderStyle] = useState<{ width: number; transform: string; hasTransition: boolean }>(() =>
    getInitialSliderStyle()
  );

  const updateSlider = (animate: boolean = true) => {
    const activeBtn = btnRefs.current.get(activeId);
    if (!activeBtn || !containerRef.current) return;

    const x = Math.round(activeBtn.offsetLeft);
    const w = Math.round(activeBtn.offsetWidth);

    if (w === 0) {
      requestAnimationFrame(() => updateSlider(animate));
      return;
    }

    setSliderStyle({
      width: w,
      transform: `translateX(${x}px)`,
      hasTransition: animate,
    });
  };

  useIsomorphicLayoutEffect(() => {
    updateSlider(false);

    const handleResize = () => {
      updateSlider(false);
    };

    window.addEventListener('resize', handleResize);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => updateSlider(false));
    }

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useIsomorphicLayoutEffect(() => {
    updateSlider(true);
  }, [activeId]);

  return (
    <div
      ref={containerRef}
      id={id}
      className={className}
      role="tablist"
      aria-label={ariaLabel}
      style={{ position: 'relative' }}
    >
      <div
        className={sliderClassName}
        style={{
          width: `${sliderStyle.width}px`,
          transform: sliderStyle.transform,
          opacity: sliderStyle.width === 0 ? 0 : 1,
          transition: sliderStyle.hasTransition
            ? 'transform 0.42s var(--ease-liquid), width 0.42s var(--ease-liquid), opacity 0.15s ease'
            : 'opacity 0.15s ease',
        }}
        aria-hidden="true"
      />
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              if (el) btnRefs.current.set(tab.id, el);
              else btnRefs.current.delete(tab.id);
            }}
            type="button"
            className={`${btnClassName} ${isActive ? 'active' : ''}`.trim()}
            role="tab"
            aria-selected={isActive}
            title={tab.title}
            aria-label={tab.ariaLabel}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default FluidTabs;
