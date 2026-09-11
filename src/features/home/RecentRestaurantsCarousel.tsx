'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import type { PublicVisitSummary } from '@/domain/reviews/repository';
import { RecordCard } from '@/features/records/RecordCard';
import { CraterLogo } from '@/components/brand/CraterLogo';
import styles from './home.module.css';

export interface RecentRestaurantsCarouselProps {
  records: readonly PublicVisitSummary[];
}

export function RecentRestaurantsCarousel({ records }: RecentRestaurantsCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  if (records.length === 0) {
    return (
      <div className={styles.carouselEmpty} role="status">
        <span aria-hidden="true"><CraterLogo /></span>
        <h3>Os registros ainda estão em silêncio</h3>
        <p>Quando uma mesa for publicada, ela aparecerá primeiro nesta página.</p>
        <Link href="/registros">Consultar o livro de registros</Link>
      </div>
    );
  }

  const currentIndex = Math.min(activeIndex, records.length - 1);
  const record = records[currentIndex];

  function moveTo(index: number) {
    // Keep keyboard focus out of a card that is about to become inert.
    const currentSlide = rootRef.current?.querySelector('[data-carousel-state="active"]');
    if (currentSlide?.contains(document.activeElement)) rootRef.current?.focus({ preventScroll: true });
    setActiveIndex(Math.max(0, Math.min(records.length - 1, index)));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    moveTo(currentIndex + (event.key === 'ArrowRight' ? 1 : -1));
  }

  return (
    <div
      aria-label="Restaurantes publicados recentemente"
      aria-roledescription="carrossel"
      className={styles.carousel}
      onKeyDown={handleKeyDown}
      role="region"
      ref={rootRef}
      tabIndex={0}
    >
      <div className={styles.carouselStage}>
        {records.map((candidate, index) => {
          const offset = index - currentIndex;
          const active = offset === 0;
          const adjacent = Math.abs(offset) === 1;
          const state = active ? 'active' : offset === -1 ? 'previous' : offset === 1 ? 'next' : 'offscreen';
          return <div key={candidate.id} className={styles.carouselSlide}
            aria-hidden={!active} data-carousel-state={state}
            style={{ '--slide-offset': offset } as CSSProperties}>
            <div inert={!active}>
              <RecordCard record={candidate} headingLevel={3} imageSizes="(max-width: 1023px) 82vw, (max-width: 1440px) 68vw, 980px" />
            </div>
            {adjacent && <button className={styles.previewTarget} type="button" tabIndex={-1}
              aria-label={`Colocar ${candidate.restaurant.name} em foco`} onClick={() => moveTo(index)} />}
          </div>;
        })}
      </div>

      <div className={styles.carouselControls}>
        <button
          aria-label="Restaurante anterior"
          disabled={currentIndex === 0}
          onClick={() => moveTo(currentIndex - 1)}
          type="button"
        >
          <ChevronLeft aria-hidden="true" />
        </button>
        <p aria-live="polite">Registro {currentIndex + 1} de {records.length} — {record.restaurant.name}</p>
        <button
          aria-label="Próximo restaurante"
          disabled={currentIndex === records.length - 1}
          onClick={() => moveTo(currentIndex + 1)}
          type="button"
        >
          <ChevronRight aria-hidden="true" />
        </button>
      </div>

      <div className={styles.carouselDots} aria-label="Escolher restaurante">
        {records.map((candidate, index) => (
          <button
            aria-current={index === currentIndex ? 'true' : undefined}
            aria-label={`Mostrar restaurante ${index + 1}: ${candidate.restaurant.name}`}
            key={candidate.id}
            onClick={() => moveTo(index)}
            type="button"
          />
        ))}
      </div>
    </div>
  );
}
