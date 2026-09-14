'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/** Cada capítulo entra uma vez; texto e fotos permanecem visíveis sem JavaScript. */
export function ChapterMotion({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === 'undefined'
      || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        (entry.target as HTMLElement).dataset.chapterSeen = 'true';
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.15 });

    root.querySelectorAll('[data-history-chapter]').forEach((chapter) => observer.observe(chapter));
    return () => observer.disconnect();
  }, []);

  return <div ref={rootRef}>{children}</div>;
}
