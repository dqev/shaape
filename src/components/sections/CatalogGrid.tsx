import React, { useState, useEffect, useRef } from 'react';
import { SHAAPES_DATA, type ShapeItem } from '../../data/shapes';
import CatalogCard from './CatalogCard';

const CHUNK_SIZE = 48;

export interface CatalogGridProps {
  styleMode: string;
  onOpenModal: (shape: ShapeItem, triggerElement?: HTMLElement) => void;
  isVisible: boolean;
}

export const CatalogGrid: React.FC<CatalogGridProps> = ({
  styleMode,
  onOpenModal,
  isVisible,
}) => {
  const [displayedCount, setDisplayedCount] = useState<number>(CHUNK_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const displayedShapes = SHAAPES_DATA.slice(0, displayedCount);

  useEffect(() => {
    if (!isVisible) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && displayedCount < SHAAPES_DATA.length) {
          setDisplayedCount((prev) => Math.min(prev + CHUNK_SIZE, SHAAPES_DATA.length));
        }
      },
      { rootMargin: '400px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isVisible, displayedCount]);

  if (!isVisible) return null;

  return (
    <>
      <div className="brand-grid" id="brandsGrid">
        {displayedShapes.map((shape) => (
          <CatalogCard
            key={shape.id}
            shape={shape}
            styleMode={styleMode}
            onOpenModal={onOpenModal}
          />
        ))}
      </div>
      {displayedCount < SHAAPES_DATA.length && (
        <div
          ref={sentinelRef}
          id="infiniteScrollSentinel"
          style={{
            height: '40px',
            width: '100%',
            marginTop: '20px',
            pointerEvents: 'none',
          }}
        />
      )}
    </>
  );
};

export default CatalogGrid;
