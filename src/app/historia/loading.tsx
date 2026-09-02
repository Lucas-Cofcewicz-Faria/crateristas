import { PublicShell } from '@/components/shell/PublicShell';
import styles from '@/features/history/history.module.css';

export default function HistoryLoading() {
  return (
    <PublicShell viewer="visitor">
      <div className={styles.routeState} role="status">
        <p className={styles.eyebrow}>Memória oficial</p>
        <h1>Consultando a história...</h1>
        <p>Os capítulos e integrantes da Sociedade estão sendo reunidos.</p>
      </div>
    </PublicShell>
  );
}
