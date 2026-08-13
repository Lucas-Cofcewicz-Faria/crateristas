import { PublicShell } from '@/components/shell/PublicShell';
import styles from '@/features/visits/review-workflow.module.css';

export default function NewVisitLoading() {
  return (
    <PublicShell viewer="member">
      <div className={styles.routeState} role="status">
        <p className={styles.eyebrow}>Nova contribuição</p>
        <h1>Preparando o formulário...</h1>
        <p>Os campos da nova visita estão sendo preparados.</p>
      </div>
    </PublicShell>
  );
}
