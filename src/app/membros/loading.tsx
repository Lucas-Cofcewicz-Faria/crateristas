import { PublicShell } from '@/components/shell/PublicShell';
import styles from '@/features/members/members.module.css';

export default function MembersLoading() {
  return (
    <PublicShell viewer="visitor">
      <div className={styles.routeState} role="status">
        <p className={styles.eyebrow}>Diretório público</p>
        <h1>Consultando o diretório...</h1>
        <p>As entradas da sociedade estão sendo preparadas.</p>
      </div>
    </PublicShell>
  );
}
