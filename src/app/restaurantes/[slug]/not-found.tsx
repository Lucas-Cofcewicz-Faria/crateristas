import Link from 'next/link';
import { PublicShell } from '@/components/shell/PublicShell';
import styles from '@/features/restaurant/restaurant.module.css';

export default function RestaurantNotFound() {
  return (
    <PublicShell viewer="visitor">
      <div className={styles.routeState}>
        <h1>Registro não encontrado</h1>
        <p>Esta página não faz parte do livro público de visitas.</p>
        <Link href="/registros">Voltar ao livro de registros</Link>
      </div>
    </PublicShell>
  );
}
