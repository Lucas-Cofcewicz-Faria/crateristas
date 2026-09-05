'use client';

import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useId, useState, type KeyboardEvent } from 'react';
import type { PublicPhoto } from '@/domain/reviews/repository';
import styles from './restaurant.module.css';

export interface PhotoGalleryProps {
  photos: PublicPhoto[];
  restaurantName: string;
}

export function PhotoGallery({ photos, restaurantName }: PhotoGalleryProps) {
  const [activePhotoId, setActivePhotoId] = useState<string | null>(null);
  const photoId = useId();
  if (photos.length === 0) {
    return (
      <section aria-label="Fotografias da visita" className={styles.photoPlaceholder}>
        <span aria-hidden="true">C</span>
        <p>Esta visita não possui fotografias publicadas.</p>
      </section>
    );
  }

  const orderedPhotos = [...photos].sort((left, right) => (
    left.position - right.position || left.id.localeCompare(right.id)
  ));
  const activeIndex = Math.max(0, orderedPhotos.findIndex((photo) => photo.id === activePhotoId));
  const activePhoto = orderedPhotos[activeIndex];
  const hasNavigation = orderedPhotos.length > 1;

  const showPhoto = (index: number) => {
    const nextPhoto = orderedPhotos[Math.max(0, Math.min(index, orderedPhotos.length - 1))];
    setActivePhotoId(nextPhoto.id);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!hasNavigation || event.altKey || event.ctrlKey || event.metaKey) return;
    const destinations: Record<string, number> = {
      ArrowLeft: activeIndex - 1,
      ArrowRight: activeIndex + 1,
      Home: 0,
      End: orderedPhotos.length - 1,
    };
    const destination = destinations[event.key];
    if (destination === undefined) return;
    event.preventDefault();
    showPhoto(destination);
  };

  return (
    <section
      aria-label="Fotografias da visita"
      aria-roledescription={hasNavigation ? 'carrossel' : undefined}
      className={styles.gallery}
      data-motion="excavation"
      onKeyDown={handleKeyDown}
      tabIndex={hasNavigation ? 0 : undefined}
    >
      <figure className={styles.photo} id={photoId}>
        <Image
          alt={`Foto ${activeIndex + 1} da visita ao restaurante ${restaurantName}`}
          data-atmosphere-source={activeIndex === 0 ? 'true' : undefined}
          height={800}
          key={activePhoto.id}
          sizes="(max-width: 1536px) calc(100vw - 96px), 1440px"
          src={activePhoto.url}
          width={1200}
        />
        <figcaption>Registro {String(activeIndex + 1).padStart(2, '0')}</figcaption>
      </figure>
      {hasNavigation && (
        <div className={styles.galleryControls}>
          <p aria-atomic="true" className={styles.galleryStatus} role="status">
            Fotografia {activeIndex + 1} de {orderedPhotos.length}
          </p>
          <div aria-label="Escolher fotografia" className={styles.galleryIndicators} role="group">
            {orderedPhotos.map((photo, index) => (
              <button
                aria-controls={photoId}
                aria-current={index === activeIndex ? 'true' : undefined}
                aria-label={`Mostrar fotografia ${index + 1}`}
                className={styles.galleryIndicator}
                key={photo.id}
                onClick={() => showPhoto(index)}
                type="button"
              ><span aria-hidden="true" /></button>
            ))}
          </div>
          <div className={styles.galleryArrows}>
            <button
              aria-controls={photoId}
              aria-label="Fotografia anterior"
              className={styles.galleryArrow}
              disabled={activeIndex === 0}
              onClick={() => showPhoto(activeIndex - 1)}
              type="button"
            ><ChevronLeft aria-hidden="true" size={20} /></button>
            <button
              aria-controls={photoId}
              aria-label="Próxima fotografia"
              className={styles.galleryArrow}
              disabled={activeIndex === orderedPhotos.length - 1}
              onClick={() => showPhoto(activeIndex + 1)}
              type="button"
            ><ChevronRight aria-hidden="true" size={20} /></button>
          </div>
        </div>
      )}
    </section>
  );
}
