'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import styles from './motion.module.css';

export interface MotionScopeProps {
  children: ReactNode;
  className?: string;
}

export function MotionScope({ children, className }: MotionScopeProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const targets = [...root.querySelectorAll<HTMLElement>('[data-motion]')];
    const loops = [...root.querySelectorAll<HTMLElement>('[data-motion-loop]')];
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    root.dataset.motionReady = 'true';

    const showAll = () => {
      targets.forEach((target) => { target.dataset.motionState = 'visible'; });
      loops.forEach((loop) => { loop.dataset.motionLoopState = 'paused'; });
    };

    if (reduceMotion || typeof IntersectionObserver === 'undefined') {
      showAll();
      return undefined;
    }

    targets.forEach((target) => {
      target.dataset.motionState = 'pending';
      target.style.setProperty('--motion-index', target.dataset.motionIndex ?? '0');
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const target = entry.target as HTMLElement;
        if (target.hasAttribute('data-motion-loop')) {
          target.dataset.motionLoopState = entry.isIntersecting ? 'running' : 'paused';
        }
        if (entry.isIntersecting && target.hasAttribute('data-motion')) {
          target.dataset.motionState = 'visible';
          if (!target.hasAttribute('data-motion-loop')) observer.unobserve(target);
        }
      });
    }, { rootMargin: '0px 0px -12%', threshold: 0.12 });

    new Set([...targets, ...loops]).forEach((target) => observer.observe(target));

    const syncVisibility = () => {
      root.dataset.motionPaused = document.hidden ? 'true' : 'false';
    };
    syncVisibility();
    document.addEventListener('visibilitychange', syncVisibility);

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', syncVisibility);
    };
  }, []);

  return (
    <div className={[styles.scope, className].filter(Boolean).join(' ')} ref={rootRef}>
      {children}
    </div>
  );
}
