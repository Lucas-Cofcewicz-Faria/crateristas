import { PublicShell } from '@/components/shell/PublicShell';
import { LandingHero } from '@/features/home/LandingHero';
import styles from '@/features/home/home.module.css';

/** The real opening is available while the server resolves records and membership. */
export default function HomeLoading() {
  return <PublicShell viewer="visitor">
    <LandingHero />
    <p className={styles.loadingRecords} role="status">Carregando os registros da mesa…</p>
  </PublicShell>;
}
