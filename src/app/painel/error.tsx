'use client';

import styles from '@/features/visits/visits.module.css';

interface DashboardErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ reset }: DashboardErrorProps) {
  return (
    <div className="desktop-frame">
      <main className={styles.routeState}>
        <p className={styles.eyebrow}>Painel indisponível</p>
        <h1>Não foi possível abrir seu painel agora.</h1>
        <p>Tente novamente para consultar as visitas e contribuições da sociedade.</p>
        <button className={styles.retryButton} onClick={reset} type="button">
          Tentar novamente
        </button>
      </main>
    </div>
  );
}
