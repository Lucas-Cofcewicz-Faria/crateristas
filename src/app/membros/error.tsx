'use client';

import styles from '@/features/members/members.module.css';

interface MembersErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function MembersError({ reset }: MembersErrorProps) {
  return (
    <div className="desktop-frame">
      <main className={styles.routeState}>
        <p className={styles.eyebrow}>Diretório indisponível</p>
        <h1>Não foi possível abrir o diretório agora.</h1>
        <p>Tente novamente para consultar os integrantes públicos da sociedade.</p>
        <button className={styles.retryButton} onClick={reset} type="button">
          Tentar novamente
        </button>
      </main>
    </div>
  );
}
