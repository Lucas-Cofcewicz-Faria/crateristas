'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import styles from './home.module.css';

export function getHeroProgress(rectTop: number, rectHeight: number, viewportHeight: number) {
  const travel = Math.max(rectHeight - viewportHeight, 1);
  return Math.min(1, Math.max(0, -rectTop / travel));
}

export function CraterHeroMedia() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (reduced) {
      root.style.setProperty('--hero-scale', '1');
      root.style.setProperty('--hero-pan', '0%');
      return undefined;
    }

    let frame = 0;
    const update = () => {
      frame = 0;
      const stage = root.closest<HTMLElement>('[data-hero-stage]') ?? root;
      const rect = stage.getBoundingClientRect();
      const progress = getHeroProgress(rect.top, rect.height, window.innerHeight);
      root.style.setProperty('--hero-scale', String(1.12 - progress * 0.04));
      root.style.setProperty('--hero-pan', `${-3 + progress * 6}%`);
    };
    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);

  return (
    <figure className={styles.craterHeroMedia} ref={rootRef}>
      <div className={styles.craterHeroFrame}>
        <Image
          alt="Registro do local da Cratera"
          fill
          preload
          sizes="100vw"
          src="/images/cratera.png"
        />
      </div>
      <figcaption>Registro do local da Cratera</figcaption>
    </figure>
  );
}
