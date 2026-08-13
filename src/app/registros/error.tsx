'use client';

import styles from '@/features/records/records.module.css';

interface RecordsErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RecordsError({ reset }: RecordsErrorProps) {
  return (
    <div className="desktop-frame">
      <main className={styles.routeState}>
        <p className={styles.eyebrow}>Arquivo indisponível</p>
        <h1>Não foi possível abrir o livro agora.</h1>
        <p>Tente novamente para consultar os registros públicos da sociedade.</p>
        <button className={styles.retryButton} onClick={reset} type="button">
          Tentar novamente
        </button>
      </main>
    </div>
  );
}
