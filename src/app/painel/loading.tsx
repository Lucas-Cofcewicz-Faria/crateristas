import { PublicShell } from '@/components/shell/PublicShell';
import styles from '@/features/visits/visits.module.css';

export default function DashboardLoading() {
  return (
    <PublicShell viewer="visitor">
      <div className={styles.routeState} role="status">
        <p className={styles.eyebrow}>Área reservada</p>
        <h1>Preparando seu painel...</h1>
        <p>As visitas e contribuições estão sendo consultadas.</p>
      </div>
    </PublicShell>
  );
}
