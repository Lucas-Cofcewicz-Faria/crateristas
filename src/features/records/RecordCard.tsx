import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { PublicVisitSummary } from '@/domain/reviews/repository';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { CraterLogo } from '@/components/brand/CraterLogo';
import { RecordAtmosphere } from './RecordAtmosphere';
import styles from './records.module.css';

export interface RecordCardProps {
  record: PublicVisitSummary;
  headingLevel?: 2 | 3;
  imageSizes?: string;
}

const visitDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

export function RecordCard({ record, headingLevel = 2, imageSizes = '(max-width: 767px) calc(100vw - 32px), (max-width: 1440px) 45vw, 650px' }: RecordCardProps) {
  const Heading = headingLevel === 3 ? 'h3' : 'h2';
  const detailPath = `/restaurantes/${record.restaurant.slug}`;
  const imageAlt = `Foto de ${record.restaurant.name} no registro dos Crateristas`;

  return (
    <RecordAtmosphere key={record.coverPhotoUrl} label={`Registro de ${record.restaurant.name}`}>
      <Link className={styles.cardDestination} href={detailPath} aria-label={`Abrir registro de ${record.restaurant.name}`}>
      <div className={styles.cardImage}>
        {record.coverPhotoUrl ? (
          <Image
            alt={imageAlt}
            data-record-cover="true"
            fill
            sizes={imageSizes}
            src={record.coverPhotoUrl}
          />
        ) : (
          <div className={styles.imagePlaceholder}>
            <CraterLogo />
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
          <Heading className={styles.cardTitle}>{record.restaurant.name}</Heading>
          <p className={styles.visitDate}>
            Visita em <time dateTime={record.visitedAt}>{visitDateFormatter.format(new Date(record.visitedAt))}</time>
          </p>
          <p className={styles.contribution}>
            {record.participantCount} {record.participantCount === 1 ? 'craterista contribuiu' : 'crateristas contribuíram'}
          </p>
          <span className={styles.cardLink}>
            Explorar restaurante <ArrowUpRight aria-hidden="true" size={20} />
          </span>
        </div>

        <ScoreRing hideLabel label="Avaliação coletiva" size="large" value={record.overall} />
      </div>
      </Link>
    </RecordAtmosphere>
  );
}
