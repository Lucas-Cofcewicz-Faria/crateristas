import Link from 'next/link';
import styles from '@/features/restaurant/restaurant.module.css';

export default async function RestaurantNotFound() {
  return (
    <>
      <div className={styles.routeState}>
        <h1>Registro não encontrado</h1>
        <p>Esta página não faz parte do livro público de visitas.</p>
        <Link href="/registros">Voltar ao livro de registros</Link>
      </div>
    </>
  );
}
