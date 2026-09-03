'use client';

import { useCallback, useEffect, useRef, type ReactNode, type SyntheticEvent } from 'react';
import { samplePhotoPalette } from './photo-palette';
import styles from './restaurant.module.css';

export function RestaurantAtmosphere({ children, enabled }: { children: ReactNode; enabled: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const applyFromImage = useCallback((image: HTMLImageElement) => {
    if (!enabled || image.dataset.atmosphereSource !== 'true') return;
    const palette = samplePhotoPalette(image);
    const root = rootRef.current;
    if (!palette || !root) return;
    root.style.setProperty('--atmosphere-accent', palette.accent);
    root.style.setProperty('--atmosphere-accent-bright', palette.accentBright);
    root.style.setProperty('--atmosphere-surface', palette.surface);
    root.style.setProperty('--atmosphere-glow', palette.glow);
    root.style.setProperty('--atmosphere-line', palette.line);
    root.dataset.atmosphereReady = 'true';
  }, [enabled]);

  useEffect(() => {
    const image = rootRef.current?.querySelector<HTMLImageElement>('[data-atmosphere-source="true"]');
    if (image?.complete && image.naturalWidth > 0) applyFromImage(image);
  }, [applyFromImage]);

  const handleLoadCapture = (event: SyntheticEvent<HTMLDivElement>) => {
    if (event.target instanceof HTMLImageElement) applyFromImage(event.target);
  };

  return <div className={styles.atmosphere} onLoadCapture={handleLoadCapture} ref={rootRef}>{children}</div>;
}
