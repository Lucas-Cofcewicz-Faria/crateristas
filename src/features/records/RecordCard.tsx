import Image from 'next/image';
import Link from 'next/link';
import type { PublicVisitSummary } from '@/domain/reviews/repository';
import { CRATERISTAS_GROUP_SIZE } from '@/domain/reviews/types';
import { ScoreRing } from '@/components/ui/ScoreRing';
import styles from './records.module.css';

export interface RecordCardProps {
  record: PublicVisitSummary;
}

const visitDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

export function RecordCard({ record }: RecordCardProps) {
  const detailPath = `/restaurantes/${record.slug}`;
  const imageAlt = `Foto de ${record.restaurant.name} no registro dos Crateristas`;

  return (
    <article
      aria-label={`Registro de ${record.restaurant.name}`}
      className={styles.card}
    >
      <div className={styles.cardImage}>
        {record.coverPhotoUrl ? (
          <Image
            alt={imageAlt}
            fill
            sizes="(max-width: 1440px) 45vw, 650px"
            src={record.coverPhotoUrl}
          />
        ) : (
          <div className={styles.imagePlaceholder}>
            <span aria-hidden="true">C</span>
            <p>Registro sem fotografia</p>
          </div>
        )}
      </div>

      <div className={styles.cardBody}>
        <div className={styles.cardCopy}>
          <div className={styles.recordMeta}>
            <span>{record.restaurant.cuisine}</span>
            <span aria-hidden="true">•</span>
            <span>{record.restaurant.neighborhood}</span>
          </div>
          <h2 className={styles.cardTitle}>{record.restaurant.name}</h2>
          <p className={styles.visitDate}>
            Visita em <time dateTime={record.visitedAt}>{visitDateFormatter.format(new Date(record.visitedAt))}</time>
          </p>
          <p className={styles.contribution}>
            {record.participantCount} de {CRATERISTAS_GROUP_SIZE} crateristas contribuíram
          </p>
          <Link
            aria-label={`Abrir registro de ${record.restaurant.name}`}
            className={styles.cardLink}
            href={detailPath}
          >
            Abrir registro
          </Link>
        </div>

        <ScoreRing label="Nota coletiva" value={record.overall} />
      </div>
    </article>
  );
}
