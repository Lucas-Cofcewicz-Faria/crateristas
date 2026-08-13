import { PublicShell } from '@/components/shell/PublicShell';
import styles from '@/features/records/records.module.css';

export default function RecordsLoading() {
  return (
    <PublicShell viewer="visitor">
      <div className={styles.routeState} role="status">
        <p className={styles.eyebrow}>Arquivo público</p>
        <h1>Consultando o livro de registros...</h1>
        <p>As páginas da sociedade estão sendo preparadas.</p>
      </div>
    </PublicShell>
  );
}
