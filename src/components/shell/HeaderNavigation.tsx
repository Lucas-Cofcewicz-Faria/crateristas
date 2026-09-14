'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import styles from './shell.module.css';

export function HeaderNavigation({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath !== null && openPath === pathname;
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpenPath(null);
      toggle.current?.focus();
    };
    const onOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpenPath(null);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onOutside);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onOutside);
    };
  }, [open]);

  return (
    <div className={styles.navigationRoot} data-mobile-open={open} ref={root}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpenPath(null);
      }}>
      <button className={styles.menuToggle} type="button" ref={toggle}
        aria-label={open ? 'Fechar menu' : 'Abrir menu'} aria-expanded={open} aria-controls={id}
        onClick={() => setOpenPath(open ? null : pathname)}>
        <span>Menu</span>
        {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
      </button>
      <nav id={id} className={styles.navigation} aria-label="Navegação principal"
        onClick={(event) => {
          if (event.target instanceof Element && event.target.closest('a')) setOpenPath(null);
        }}>
        {children}
      </nav>
    </div>
  );
}
