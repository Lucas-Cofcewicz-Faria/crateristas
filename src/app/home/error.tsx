'use client';

import styles from '@/features/home/home.module.css';

interface HomeErrorProps {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}

export default function HomeError({ unstable_retry }: HomeErrorProps) {
  return (
    <div className="desktop-frame">
      <main className={styles.routeState}>
        <h1>Não foi possível abrir a cratera agora.</h1>
        <p>Tente novamente para consultar a página pública da Sociedade.</p>
        <button onClick={unstable_retry} type="button">Tentar novamente</button>
      </main>
    </div>
  );
}
