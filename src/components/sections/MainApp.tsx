import React, { useState, useEffect } from 'react';
import FluidTabs from '../ui/FluidTabs';
import CatalogGrid from './CatalogGrid';
import RandomToolSection from './RandomToolSection';
import ShapeModal from './ShapeModal';
import { SHAAPES_DATA, type ShapeItem } from '../../data/shapes';

const VIEW_TABS = [
  { id: 'catalog', label: 'Catalog' },
  { id: 'random', label: 'Random Tool' },
];

const STYLE_TABS = [
  { id: 'normal', label: 'Normal', title: 'Normal solid shapes' },
  { id: 'gradient', label: 'Gradient', title: 'Gradient smooth shapes' },
  { id: 'grainy', label: 'Grainy', title: 'Grainy textured shapes' },
];

const STYLE_STORAGE_KEY = 'shapes_style_mode';

export interface MainAppProps {
  initialView?: 'catalog' | 'random';
}

export const MainApp: React.FC<MainAppProps> = ({ initialView = 'catalog' }) => {
  const [view, setView] = useState<'catalog' | 'random'>(initialView);
  const [styleMode, setStyleMode] = useState<string>('gradient');
  const [modalShape, setModalShape] = useState<ShapeItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname.replace(/\/$/, '');
      const isRandomPath = currentPath === '/random';
      const isRandomHash = window.location.hash === '#random' || window.location.hash === '#shake';

      if (isRandomPath || isRandomHash) {
        setView('random');
        if (isRandomHash) {
          try {
            history.replaceState(null, '', '/random');
          } catch (e) {}
        }
      } else if (initialView === 'catalog' && (currentPath === '' || currentPath === '/' || currentPath === '/shapes')) {
        setView('catalog');
      }

      const handlePopState = () => {
        const path = window.location.pathname.replace(/\/$/, '');
        if (path === '' || path === '/') {
          window.location.href = '/';
          return;
        }
        if (path === '/random') {
          setView('random');
        } else if (path === '/shapes') {
          setView('catalog');
        }
      };

      window.addEventListener('popstate', handlePopState);

      try {
        const saved = localStorage.getItem(STYLE_STORAGE_KEY);
        if (saved === 'grainy' || saved === 'gradient') {
          setStyleMode(saved);
        }
      } catch (e) {}

      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [initialView]);

  const handleViewChange = (newView: string) => {
    const v = newView as 'catalog' | 'random';
    setView(v);
    try {
      const targetPath = v === 'random' ? '/random' : '/shapes';
      if (window.location.pathname.replace(/\/$/, '') !== targetPath) {
        history.replaceState(null, '', targetPath);
      }
    } catch (e) {}
  };

  const handleStyleChange = (newStyle: string) => {
    setStyleMode(newStyle);
    try {
      localStorage.setItem(STYLE_STORAGE_KEY, newStyle);
    } catch (e) {}
  };

  const handleOpenModal = (shape: ShapeItem) => {
    setModalShape(shape);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handlePrevShape = () => {
    if (!modalShape) return;
    const currentIndex = SHAAPES_DATA.findIndex((s) => s.id === modalShape.id);
    if (currentIndex === -1) return;
    const prevIndex = (currentIndex - 1 + SHAAPES_DATA.length) % SHAAPES_DATA.length;
    setModalShape(SHAAPES_DATA[prevIndex]);
  };

  const handleNextShape = () => {
    if (!modalShape) return;
    const currentIndex = SHAAPES_DATA.findIndex((s) => s.id === modalShape.id);
    if (currentIndex === -1) return;
    const nextIndex = (currentIndex + 1) % SHAAPES_DATA.length;
    setModalShape(SHAAPES_DATA[nextIndex]);
  };

  return (
    <>
      <section className="header-hero">
        <div className="hero-controls-row">
          <FluidTabs
            tabs={VIEW_TABS}
            activeId={view}
            onChange={handleViewChange}
            className="view-toggle-pill"
            sliderClassName="view-slider"
            btnClassName="view-btn"
            ariaLabel="Section view switcher"
          />

          <FluidTabs
            tabs={STYLE_TABS}
            activeId={styleMode}
            onChange={handleStyleChange}
            className="style-toggle-pill"
            sliderClassName="style-slider"
            btnClassName="style-btn"
            ariaLabel="Shape style mode switcher"
          />
        </div>
      </section>

      <CatalogGrid
        styleMode={styleMode}
        onOpenModal={handleOpenModal}
        isVisible={view === 'catalog'}
      />

      <RandomToolSection
        isVisible={view === 'random'}
        styleMode={styleMode}
        onStyleChange={handleStyleChange}
      />

      <ShapeModal
        isOpen={isModalOpen}
        shape={modalShape}
        initialMode={styleMode}
        onClose={handleCloseModal}
        onPrev={handlePrevShape}
        onNext={handleNextShape}
      />
    </>
  );
};

export default MainApp;
