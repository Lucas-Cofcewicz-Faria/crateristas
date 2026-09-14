'use client';

import { useCallback, useEffect, useRef, type ReactNode, type SyntheticEvent } from 'react';
import { samplePhotoPalette, type PhotoPalette } from '@/features/restaurant/photo-palette';
import styles from './profile.module.css';

/** Local tokens only: neither the navbar nor another member inherits this photo's colors. */
export function ProfileAtmosphere({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const apply = useCallback((palette: PhotoPalette | null) => {
    if (!root.current) return;
    for (const [property, value] of Object.entries({
      '--ember': palette?.accent, '--ember-bright': palette?.accentBright,
      '--surface': palette?.surface, '--line': palette?.line,
    })) {
      if (value) root.current.style.setProperty(property, value);
      else root.current.style.removeProperty(property);
    }
    root.current.dataset.profileThemed = String(Boolean(palette));
  }, []);
  useEffect(() => {
    const image = root.current?.querySelector<HTMLImageElement>('[data-profile-portrait="true"]');
    if (image?.complete && image.naturalWidth > 0) apply(samplePhotoPalette(image));
  }, [apply]);
  function handleImage(event: SyntheticEvent<HTMLDivElement>, failed = false) {
    if (!(event.target instanceof HTMLImageElement) || event.target.dataset.profilePortrait !== 'true') return;
    apply(failed ? null : samplePhotoPalette(event.target));
  }
  return <div className={styles.atmosphere} ref={root} onLoadCapture={handleImage} onErrorCapture={(event) => handleImage(event, true)}>{children}</div>;
}
