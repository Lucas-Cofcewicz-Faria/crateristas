'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { samplePhotoPalette } from '@/features/restaurant/photo-palette';
import type { CatalogRestaurant } from '@/features/restaurants/catalog-types';
import styles from './menu.module.css';

/** The restaurant cover owns this palette, including on individual dish pages. */
export function MenuFrame({ restaurant, coverUrl, children }: {
  restaurant: CatalogRestaurant; coverUrl: string | null; children: ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<HTMLImageElement>(null);
  const applyPalette = useCallback(() => {
    const root = rootRef.current;
    const image = coverRef.current;
    const palette = image?.complete && image.naturalWidth ? samplePhotoPalette(image) : null;
    if (!root) return;
    for (const [key, value] of Object.entries({
      '--review-accent': palette?.accent,
      '--review-accent-bright': palette?.accentBright,
      '--review-surface': palette?.surface,
      '--review-line': palette?.line,
    })) {
      if (value) root.style.setProperty(key, value);
      else root.style.removeProperty(key);
    }
  }, []);
  useEffect(applyPalette, [applyPalette, coverUrl]);

  return <div className={styles.frame} ref={rootRef}>
    <div className={styles.page}>
      <nav className={styles.breadcrumb} aria-label="Navegação do menu">
        <Link href={`/restaurantes/${restaurant.slug}`}><ArrowLeft size={16} aria-hidden="true" />{restaurant.name}</Link>
        <Link href={`/restaurantes/${restaurant.slug}/menu`}>Menu do restaurante</Link>
      </nav>
      {coverUrl && <div className={styles.restaurantIdentity}>
        <Image ref={coverRef} src={coverUrl} alt={`Restaurante ${restaurant.name}`} width={1200} height={280}
          sizes="(max-width: 767px) calc(100vw - 32px), (max-width: 1536px) calc(100vw - 96px), 1440px"
          onLoad={applyPalette} onError={applyPalette} />
      </div>}
      {children}
    </div>
  </div>;
}
