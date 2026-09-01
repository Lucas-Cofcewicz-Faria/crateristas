import { PublicShell } from '@/components/shell/PublicShell';
import styles from '@/features/home/home.module.css';

export default function HomeLoading() {
  return (
    <PublicShell viewer="visitor">
      <div className={styles.routeState} role="status">
        <h1>Preparando a entrada...</h1>
        <p>Os registros e integrantes da Sociedade estão sendo reunidos.</p>
      </div>
    </PublicShell>
  );
}
