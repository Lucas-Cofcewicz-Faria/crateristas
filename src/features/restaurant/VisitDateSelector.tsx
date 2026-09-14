'use client';

import { useId, useRef, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, ChevronDown } from 'lucide-react';
import type { RestaurantVisitOption } from '@/features/restaurants/catalog-types';
import { formatVisitDate } from './restaurant-formatters';
import styles from './visit-navigation.module.css';

export function VisitDateSelector({ visitedAt, restaurantSlug, visits, selectedVisitId }: {
  visitedAt: string; restaurantSlug: string; visits: RestaurantVisitOption[]; selectedVisitId?: string;
}) {
  const [open, setOpen] = useState(false);
  const navId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  return <div className={styles.dateRow}>
    <p>Visita em <time dateTime={visitedAt}>{formatVisitDate(visitedAt)}</time></p>
    {visits.length > 1 ? <div className={styles.selector}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={(event) => { if (!event.currentTarget.contains(document.activeElement)) setOpen(false); }}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}
      onKeyDown={(event) => { if (event.key === 'Escape') { setOpen(false); trigger.current?.focus(); } }}>
      <button ref={trigger} type="button" aria-expanded={open} aria-controls={navId} onClick={() => setOpen(!open)}>
        <CalendarDays size={17} aria-hidden="true" />Outras visitas<ChevronDown size={16} aria-hidden="true" />
      </button>
      <nav id={navId} hidden={!open} aria-label="Escolher data da visita">
        {visits.map((visit, index) => <Link key={visit.id} aria-current={selectedVisitId === visit.id ? 'page' : undefined}
          href={`/restaurantes/${restaurantSlug}?visita=${visit.id}`}>
          {formatVisitDate(visit.visitedAt)}{index === 0 ? ' · mais recente' : ''}
        </Link>)}
      </nav>
    </div> : null}
  </div>;
}
