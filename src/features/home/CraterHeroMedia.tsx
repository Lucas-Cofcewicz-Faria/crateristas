'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import styles from './home.module.css';

export function getHeroProgress(rectTop: number, rectHeight: number, viewportHeight: number) {
  const travel = Math.max(rectHeight, viewportHeight, 1);
  return Math.min(1, Math.max(0, -rectTop / travel));
}

export function CraterHeroMedia() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (reduced) {
      root.style.setProperty('--hero-mask-size', '140%');
      root.style.setProperty('--hero-scale', '1');
      return undefined;
    }

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = root.getBoundingClientRect();
      const progress = getHeroProgress(rect.top, rect.height, window.innerHeight);
      root.style.setProperty('--hero-mask-size', `${48 + progress * 92}%`);
      root.style.setProperty('--hero-scale', String(1.055 - progress * 0.055));
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
    <figure className={styles.craterHeroMedia} data-motion="excavation" ref={rootRef}>
      <div className={styles.craterHeroAperture}>
        <Image
          alt="Registro do local da Cratera"
          fill
          preload
          sizes="(max-width: 1440px) 62vw, 1120px"
          src="/images/cratera.png"
        />
        <span aria-hidden="true" className={styles.craterHeroContours} data-motion-loop />
      </div>
      <figcaption>Registro do local da Cratera</figcaption>
    </figure>
  );
}
