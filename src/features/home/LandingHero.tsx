import Link from 'next/link';
import { CraterHeroMedia } from './CraterHeroMedia';
import styles from './home.module.css';

export function LandingHero() {
  return (
    <section aria-labelledby="home-title" className={styles.hero} id="entrada">
      <div className={styles.heroCopy}>
        <h1 data-motion="inscription" id="home-title">Bem-vindo à cratera</h1>
        <p className={styles.heroLead} data-motion="inscription" data-motion-index="1">
          Uma sociedade reunida à mesa, oito notas por visita e um buraco que continua sem explicação.
        </p>
        <Link className={styles.primaryAction} data-motion="inscription" data-motion-index="2" href="/registros">
          Explorar restaurantes
        </Link>
      </div>
      <CraterHeroMedia />
    </section>
  );
}
