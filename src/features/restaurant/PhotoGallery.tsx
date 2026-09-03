import Image from 'next/image';
import type { PublicPhoto } from '@/domain/reviews/repository';
import styles from './restaurant.module.css';

export interface PhotoGalleryProps {
  photos: PublicPhoto[];
  restaurantName: string;
}

export function PhotoGallery({ photos, restaurantName }: PhotoGalleryProps) {
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

  return (
    <section aria-label="Fotografias da visita" className={styles.gallery}>
      {orderedPhotos.map((photo, index) => (
        <figure className={styles.photo} key={photo.id}>
          <Image
            alt={`Foto ${index + 1} da visita ao restaurante ${restaurantName}`}
            data-atmosphere-source={index === 0 ? 'true' : undefined}
            height={800}
            sizes="(max-width: 1440px) 50vw, 680px"
            src={photo.url}
            width={1200}
          />
          <figcaption>Registro {String(index + 1).padStart(2, '0')}</figcaption>
        </figure>
      ))}
    </section>
  );
}
