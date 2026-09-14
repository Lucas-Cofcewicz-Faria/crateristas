'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import styles from './shell.module.css';

const PUBLIC_LINKS = [
  { href: '/home', label: 'Início', routes: ['/home', '/'] },
  { href: '/registros', label: 'Registros', routes: ['/registros', '/restaurantes', '/restaurant'] },
  { href: '/historia', label: 'História', routes: ['/historia', '/membros'] },
];
const PANEL_LINK = { href: '/painel', label: 'Painel', routes: ['/painel', '/visitas', '/add-restaurant'] };

export function HeaderLinks({ member }: { member: boolean }) {
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const [target, setTarget] = useState<string | null>(null);
  const links = member ? [...PUBLIC_LINKS, PANEL_LINK] : PUBLIC_LINKS;
  const active = links.find((link) => link.routes.some((route) => pathname === route
    || (route !== '/' && pathname?.startsWith(`${route}/`))));
  const selected = target ?? active?.href;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let disposed = false;
    const measure = () => {
      if (disposed) return;
      const link = [...root.querySelectorAll<HTMLElement>('[data-nav-key]')]
        .find((item) => item.dataset.navKey === selected);
      root.dataset.indicatorReady = 'true';
      root.dataset.indicatorVisible = String(Boolean(link));
      if (!link) return;
      root.style.setProperty('--nav-indicator-x', `${link.offsetLeft}px`);
      root.style.setProperty('--nav-indicator-width', `${link.offsetWidth}px`);
    };
    measure();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    observer?.observe(root);
    document.fonts?.ready.then(measure);
    return () => { disposed = true; observer?.disconnect(); };
  }, [selected]);

  return (
    <div
      className={styles.linkRail}
      ref={rootRef}
      onPointerLeave={() => {
        const focused = rootRef.current?.querySelector<HTMLElement>('[data-nav-key]:focus');
        setTarget(focused?.dataset.navKey ?? null);
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setTarget(null);
      }}
    >
      {links.map((link) => (
        <Link
          aria-current={active?.href === link.href ? 'page' : undefined}
          className={styles.navLink}
          data-nav-key={link.href}
          href={link.href}
          key={link.href}
          onFocus={() => setTarget(link.href)}
          onPointerEnter={() => setTarget(link.href)}
        >{link.label}</Link>
      ))}
      <span aria-hidden="true" className={styles.navIndicator} />
    </div>
  );
}
