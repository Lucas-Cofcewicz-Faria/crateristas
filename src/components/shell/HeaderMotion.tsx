'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import styles from './shell.module.css';

export function HeaderMotion({ children }: { children: ReactNode }) {
  const headerRef = useRef<HTMLElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    let anchor = Math.max(0, window.scrollY);
    let frame = 0;
    header.dataset.hidden = 'false';
    const update = () => {
      frame = 0;
      const current = Math.max(0, window.scrollY);
      header.dataset.scrolled = String(current > 16);
      if (current < 140 || header.contains(document.activeElement)
        || header.querySelector('[data-mobile-open="true"]')) {
        header.dataset.hidden = 'false';
        anchor = current;
      } else if (current > anchor + 14) {
        header.dataset.hidden = 'true';
        anchor = current;
      } else if (current < anchor - 10) {
        header.dataset.hidden = 'false';
        anchor = current;
      }
    };
    const schedule = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    const reveal = () => { header.dataset.hidden = 'false'; anchor = Math.max(0, window.scrollY); };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    header.addEventListener('focusin', reveal);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      header.removeEventListener('focusin', reveal);
    };
  }, [pathname]);

  return <header className={styles.header} ref={headerRef}>{children}</header>;
}
