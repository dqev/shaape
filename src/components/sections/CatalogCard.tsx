import React from 'react';
import type { ShapeItem } from '../../data/shapes';
import SquircleCard from '../ui/SquircleCard';

export interface CatalogCardProps {
  shape: ShapeItem;
  styleMode: string;
  onOpenModal: (shape: ShapeItem) => void;
}

export const CatalogCard: React.FC<CatalogCardProps> = ({
  shape,
  styleMode,
  onOpenModal,
}) => {
  const getShapeSvg = (s: ShapeItem, mode: string): string => {
    if (!s) return '';
    if (mode === 'grainy' && s.svgGrainy) return s.svgGrainy;
    if (mode === 'gradient' && s.svgGradient) return s.svgGradient;
    return s.svg;
  };

  const activeSvg = getShapeSvg(shape, styleMode);

  return (
    <SquircleCard
      radius={28}
      smoothing={60}
      className="brand-card"
      data-shape-id={shape.id}
      title="Customize shape"
      onClick={() => onOpenModal(shape)}
    >
      <div className="brand-preview">
        <div
          className="icon-box"
          dangerouslySetInnerHTML={{ __html: activeSvg }}
        />
      </div>
    </SquircleCard>
  );
};

export default CatalogCard;
