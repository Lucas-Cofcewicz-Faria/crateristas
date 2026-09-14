import Image from 'next/image';
import { ImageIcon } from 'lucide-react';
import type { HistoryPhotoSource } from '@/content/history-photos';
import styles from './chapters.module.css';

export function HistoryPhoto({ photo, className = '' }: {
  photo: HistoryPhotoSource;
  className?: string;
}) {
  return (
    <figure className={`${styles.photo} ${className}`}>
      <div className={styles.photoFrame}>
        {photo.src ? (
          <Image
            alt={photo.alt}
            fill
            sizes="(max-width: 1280px) 90vw, 1120px"
            src={photo.src}
            style={{ objectPosition: photo.position ?? 'center' }}
          />
        ) : (
          <div className={styles.photoPlaceholder}>
            <ImageIcon aria-hidden="true" size={28} strokeWidth={1.3} />
            <span>Fotografia a adicionar</span>
            <p>{photo.alt}</p>
          </div>
        )}
      </div>
      <figcaption>{photo.caption}</figcaption>
    </figure>
  );
}
