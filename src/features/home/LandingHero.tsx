import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { CraterHeroMedia } from './CraterHeroMedia';
import styles from './home.module.css';

export function LandingHero() {
  return (
    <section aria-labelledby="home-title" className={styles.hero} data-hero-stage id="entrada">
      <div className={styles.heroPinned}>
        <div className={styles.heroCopy}>
          <h1 data-motion="inscription" id="home-title">Bem-vindo à cratera</h1>
          <div className={styles.heroSummary}>
            <p className={styles.heroLead} data-motion="inscription" data-motion-index="1">
              Uma sociedade reunida à mesa, oito notas por visita e um buraco que continua sem explicação.
            </p>
            <div data-motion="inscription" data-motion-index="2">
              <Link className={`${styles.primaryAction} ${styles.exploreAction}`} href="/registros">
                <span>Explorar restaurantes</span>
                <span aria-hidden="true" className={styles.exploreArrow}><ArrowRight size={20} /></span>
              </Link>
            </div>
          </div>
        </div>
        <CraterHeroMedia />
      </div>
    </section>
  );
}
