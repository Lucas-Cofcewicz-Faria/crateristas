'use client';

import { useEffect, useRef } from 'react';

/** Keep decorative loops local to visible scores, without a React render per frame. */
export function useScoreMotion<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;
    let inView = false;
    const sync = () => {
      element.dataset.scoreMotion = inView && document.visibilityState === 'visible' ? 'running' : 'paused';
    };
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      sync();
    });
    observer.observe(element);
    document.addEventListener('visibilitychange', sync);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', sync);
    };
  }, []);

  return ref;
}
