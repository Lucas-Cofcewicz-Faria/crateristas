import { PublicShell } from '@/components/shell/PublicShell';
import styles from '@/features/visits/review-workflow.module.css';

export default function EvaluateVisitLoading() {
  return (
    <PublicShell viewer="member">
      <div className={styles.routeState} role="status">
        <p className={styles.eyebrow}>Contribuição reservada</p>
        <h1>Preparando a avaliação...</h1>
        <p>A ficha e as fotos da visita estão sendo consultadas.</p>
      </div>
    </PublicShell>
  );
}
