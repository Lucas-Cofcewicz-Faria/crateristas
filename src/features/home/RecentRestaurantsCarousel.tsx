'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, type KeyboardEvent } from 'react';
import type { PublicVisitSummary } from '@/domain/reviews/repository';
import {
  formatParticipation,
  formatScore,
  formatVisitDate,
} from '@/features/restaurant/restaurant-formatters';
import styles from './home.module.css';

export interface RecentRestaurantsCarouselProps {
  records: readonly PublicVisitSummary[];
}

export function RecentRestaurantsCarousel({ records }: RecentRestaurantsCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (records.length === 0) {
    return (
      <div className={styles.carouselEmpty} role="status">
        <span aria-hidden="true">C</span>
        <h3>Os registros ainda estão em silêncio</h3>
        <p>Quando uma mesa for publicada, ela aparecerá primeiro nesta página.</p>
        <Link href="/registros">Consultar o livro de registros</Link>
      </div>
    );
  }

  const record = records[activeIndex];
  const previous = records[activeIndex - 1] ?? null;
  const next = records[activeIndex + 1] ?? null;

  function moveTo(index: number) {
    setActiveIndex(Math.max(0, Math.min(records.length - 1, index)));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    moveTo(activeIndex + (event.key === 'ArrowRight' ? 1 : -1));
  }

  return (
    <div
      aria-label="Restaurantes publicados recentemente"
      aria-roledescription="carrossel"
      className={styles.carousel}
      onKeyDown={handleKeyDown}
      role="region"
      tabIndex={0}
    >
      <div className={styles.carouselStage}>
        <div aria-hidden="true" className={styles.adjacentSlide}>
          {previous ? <span>{previous.restaurant.name}</span> : null}
        </div>

        <article
          aria-label={`Registro de ${record.restaurant.name}`}
          className={styles.activeSlide}
          data-carousel-state="active"
          key={record.id}
        >
          <div className={styles.activeImage}>
            {record.coverPhotoUrl ? (
              <Image
                alt={`Foto de ${record.restaurant.name} no registro dos Crateristas`}
                fill
                sizes="(max-width: 1440px) 68vw, 980px"
                src={record.coverPhotoUrl}
              />
            ) : (
              <div className={styles.archiveFallback}>
                <span aria-hidden="true">C</span>
                <p>Registro sem fotografia</p>
              </div>
            )}
          </div>
          <div className={styles.activeCopy}>
            <p className={styles.restaurantMeta}>
              {record.restaurant.cuisine} · {record.restaurant.neighborhood}, {record.restaurant.city}
            </p>
            <h3>
              <Link
                className={styles.restaurantLink}
                href={`/restaurantes/${record.slug}`}
              >
                {record.restaurant.name}
              </Link>
            </h3>
            <p>Visita em <time dateTime={record.visitedAt}>{formatVisitDate(record.visitedAt)}</time></p>
            <p>{formatParticipation(record.participantCount)}</p>
            <p className={styles.collectiveScore}>Nota coletiva <strong>{formatScore(record.overall)}</strong></p>
          </div>
        </article>

        <div aria-hidden="true" className={styles.adjacentSlide}>
          {next ? <span>{next.restaurant.name}</span> : null}
        </div>
      </div>

      <div className={styles.carouselControls}>
        <button
          aria-label="Restaurante anterior"
          disabled={activeIndex === 0}
          onClick={() => moveTo(activeIndex - 1)}
          type="button"
        >
          <ChevronLeft aria-hidden="true" />
        </button>
        <p aria-live="polite">Registro {activeIndex + 1} de {records.length} — {record.restaurant.name}</p>
        <button
          aria-label="Próximo restaurante"
          disabled={activeIndex === records.length - 1}
          onClick={() => moveTo(activeIndex + 1)}
          type="button"
        >
          <ChevronRight aria-hidden="true" />
        </button>
      </div>

      <div className={styles.carouselDots} aria-label="Escolher restaurante">
        {records.map((candidate, index) => (
          <button
            aria-current={index === activeIndex ? 'true' : undefined}
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
