'use client';

import styles from '@/features/visits/review-workflow.module.css';

interface NewVisitErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function NewVisitError({ reset }: NewVisitErrorProps) {
  return (
    <div className="desktop-frame">
      <main className={styles.routeState}>
        <p className={styles.eyebrow}>Formulário indisponível</p>
        <h1>Não foi possível abrir o formulário.</h1>
        <p>Tente novamente para registrar uma nova visita.</p>
        <button className={styles.retryButton} onClick={reset} type="button">
          Tentar novamente
        </button>
      </main>
    </div>
  );
}
