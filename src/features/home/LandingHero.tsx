import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { CraterHeroMedia } from './CraterHeroMedia';
import styles from './home.module.css';

export function LandingHero() {
  return (
    <section aria-labelledby="home-title" className={styles.hero} id="entrada">
      <div className={styles.heroScene}>
        <div className={styles.heroCopy}>
          <h1 id="home-title">Bem-vindo à cratera</h1>
          <div className={styles.heroSummary}>
            <p className={styles.heroLead}>
              Uma sociedade reunida à mesa, diferentes impressões por visita e um buraco que continua sem explicação.
            </p>
            <div>
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
