'use client';

import styles from '@/features/visits/review-workflow.module.css';

interface EvaluateVisitErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function EvaluateVisitError({ reset }: EvaluateVisitErrorProps) {
  return (
    <div className="desktop-frame">
      <main className={styles.routeState}>
        <p className={styles.eyebrow}>Avaliação indisponível</p>
        <h1>Não foi possível abrir esta avaliação.</h1>
        <p>Tente novamente para consultar a ficha reservada da visita.</p>
        <button className={styles.retryButton} onClick={reset} type="button">
          Tentar novamente
        </button>
      </main>
    </div>
  );
}
