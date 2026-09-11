'use client';

import { useCallback, useEffect, useRef, type ReactNode, type SyntheticEvent } from 'react';
import { samplePhotoPalette } from '@/features/restaurant/photo-palette';
import styles from './records.module.css';

/** Samples only the loaded cover; the server-rendered record remains the content. */
export function RecordAtmosphere({ children, label }: { children: ReactNode; label: string }) {
  const rootRef = useRef<HTMLElement>(null);
  const sampledRef = useRef<{ image: HTMLImageElement; source: string } | null>(null);
  const applyCover = useCallback((image: HTMLImageElement) => {
    if (image.dataset.recordCover !== 'true') return;
    const source = image.currentSrc || image.src;
    if (sampledRef.current?.image === image && sampledRef.current.source === source) return;
    sampledRef.current = { image, source };
    const root = rootRef.current;
    if (!root) return;
    const palette = samplePhotoPalette(image);
    for (const [property, value] of Object.entries({
      '--record-accent': palette?.accentBright,
      '--record-surface': palette?.surface,
      '--record-line': palette?.line,
    })) {
      if (value) root.style.setProperty(property, value);
      else root.style.removeProperty(property);
    }
  }, []);

  useEffect(() => {
    const image = rootRef.current?.querySelector<HTMLImageElement>('[data-record-cover="true"]');
    if (image?.complete && image.naturalWidth > 0) applyCover(image);
  }, [applyCover]);

  function handleLoad(event: SyntheticEvent<HTMLElement>) {
    if (event.target instanceof HTMLImageElement) applyCover(event.target);
  }

  return <article aria-label={label} className={styles.card} onLoadCapture={handleLoad} ref={rootRef}>{children}</article>;
}
