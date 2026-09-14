import type { PublicVisitSummary } from '@/domain/reviews/repository';
import { RecordCard } from './RecordCard';
import styles from './records.module.css';

export interface RecordGridProps {
  records: PublicVisitSummary[];
  showPublicationState?: boolean;
}

export function RecordGrid({ records, showPublicationState = false }: RecordGridProps) {
  if (records.length === 0) {
    return (
      <div className={styles.emptyState} role="status">
        <span aria-hidden="true">C</span>
        <h2>Nenhum registro encontrado</h2>
        <p>Ajuste os filtros ou limpe a busca para consultar todo o livro.</p>
      </div>
    );
  }

  return (
    <div aria-label={showPublicationState ? 'Registros da sociedade' : 'Registros publicados'} className={styles.grid} role="list">
      {records.map((record, index) => (
        <div
          data-motion="excavation"
          data-motion-index={Math.min(index, 5)}
          key={record.id}
          role="listitem"
        >
          <RecordCard record={record} showPublicationState={showPublicationState} />
        </div>
      ))}
    </div>
  );
}
