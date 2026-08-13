import Link from 'next/link';
import type { PublicationState } from '@/domain/reviews/types';
import { PublicationStatus } from './PublicationStatus';
import { formatDashboardVisitDate } from './visit-formatters';
import styles from './visits.module.css';

export interface DashboardVisitItem {
  id: string;
  restaurantName: string;
  visitedAt: string;
  participantCount: number;
  quorum: number;
  hasSubmitted: boolean;
  publicationState: PublicationState;
}

export interface PendingVisitListProps {
  visits: DashboardVisitItem[];
  emptyMessage: string;
}

export function PendingVisitList({ visits, emptyMessage }: PendingVisitListProps) {
  if (visits.length === 0) {
    return <p className={styles.emptyList} role="status">{emptyMessage}</p>;
  }

  return (
    <div className={styles.pendingList} role="list">
      {visits.map((visit) => (
        <article
          aria-label={`Visita à ${visit.restaurantName}`}
          className={styles.pendingCard}
          key={visit.id}
          role="listitem"
        >
          <div className={styles.cardHeader}>
            <PublicationStatus state={visit.publicationState} />
            <span className={styles.quorum}>
              {visit.participantCount} de {visit.quorum} avaliações
            </span>
          </div>
          <h3>{visit.restaurantName}</h3>
          <p className={styles.visitDate}>
            Visita em{' '}
            <time dateTime={visit.visitedAt}>
              {formatDashboardVisitDate(visit.visitedAt)}
            </time>
          </p>
          <Link
            aria-label={`Avaliar ${visit.restaurantName}`}
            className={styles.cardAction}
            href={`/visitas/${visit.id}/avaliar`}
          >
            {visit.hasSubmitted ? 'Revisar avaliação' : 'Avaliar visita'}
          </Link>
        </article>
      ))}
    </div>
  );
}
