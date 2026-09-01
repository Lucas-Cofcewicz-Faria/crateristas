import Link from 'next/link';
import styles from './home.module.css';

export function LandingHero() {
  return (
    <section aria-labelledby="home-title" className={styles.hero} id="entrada">
      <div className={styles.heroCopy}>
        <h1 id="home-title">Bem-vindo à cratera</h1>
        <p className={styles.heroLead}>
          Uma sociedade reunida à mesa, oito notas por visita e um buraco que continua sem explicação.
        </p>
        <Link className={styles.primaryAction} href="/registros">Explorar restaurantes</Link>
      </div>
      <div aria-hidden="true" className={styles.craterContour}>
        <svg viewBox="0 0 560 560" xmlns="http://www.w3.org/2000/svg">
          <path d="M95 139C145 88 217 68 291 83c62 12 123 56 150 116 32 71 5 155-49 207-51 49-120 82-192 62-68-19-123-79-131-148-7-64 4-119 26-168Z" />
          <path d="M137 167c42-39 104-55 161-43 55 11 108 49 126 102 21 62-8 128-55 165-43 34-101 54-154 35-54-19-94-70-96-127-2-50-3-116 18-165Z" />
          <path d="M184 209c34-31 86-41 128-29 44 12 85 45 93 89 9 49-21 99-61 123-39 23-89 35-127 13-42-24-63-74-52-120 6-30 0-63 19-87Z" />
        </svg>
        <span>C</span>
      </div>
    </section>
  );
}
