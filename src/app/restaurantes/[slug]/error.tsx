'use client';

import styles from '@/features/restaurant/restaurant.module.css';

interface RestaurantErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RestaurantError({ reset }: RestaurantErrorProps) {
  return (
    <div className="desktop-frame">
      <main className={styles.routeState}>
        <p className={styles.eyebrow}>Registro indisponível</p>
        <h1>Não foi possível abrir esta visita agora.</h1>
        <p>Tente novamente para consultar as evidências públicas desta visita.</p>
        <button className={styles.retryButton} onClick={reset} type="button">
          Tentar novamente
        </button>
      </main>
    </div>
  );
}
