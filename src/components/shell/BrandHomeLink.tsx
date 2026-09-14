'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

export function BrandHomeLink({ children, className, label = 'Crateristas — início' }: {
  children: ReactNode;
  className: string;
  label?: string;
}) {
  const pathname = usePathname();
  return (
    <Link aria-label={label} className={className} href="/home" onClick={(event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
      if (!reduced) {
        event.currentTarget.querySelector('svg')?.animate?.([
          { transform: 'rotate(0deg) scale(1)' },
          { transform: 'rotate(-12deg) scale(0.9)', offset: 0.35 },
          { transform: 'rotate(0deg) scale(1)' },
        ], { duration: 360, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
      }
      if (pathname === '/home') {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: reduced ? 'instant' : 'smooth' });
      }
    }}>{children}</Link>
  );
}
