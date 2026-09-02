'use client';

import styles from '@/features/history/history.module.css';

interface HistoryErrorProps {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}

export default function HistoryError({ unstable_retry }: HistoryErrorProps) {
  return (
    <div className="desktop-frame">
      <main className={styles.routeState}>
        <p className={styles.eyebrow}>Memória indisponível</p>
        <h1>Não foi possível abrir a história agora.</h1>
        <p>Tente novamente para consultar a memória pública da Sociedade.</p>
        <button className={styles.retryButton} onClick={unstable_retry} type="button">
          Tentar novamente
        </button>
      </main>
    </div>
  );
}
