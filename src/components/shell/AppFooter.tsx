import Link from 'next/link';
import { SocietyFragment } from '@/components/society/SocietyFragment';
import { SOCIETY_FRAGMENTS } from '@/content/society';
import styles from './shell.module.css';

export function AppFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div>
          <strong className={styles.footerTitle}>Crateristas</strong>
          <p className={styles.footerNote}>Relatos de mesa, preservados à beira da cratera.</p>
          <SocietyFragment
            fragment={SOCIETY_FRAGMENTS[1]}
            label="Revelar fragmento da sociedade"
          />
        </div>
        <nav className={styles.footerNav} aria-label="Navegação do rodapé">
          <Link href="/registros">Registros</Link>
          <Link href="/historia">História</Link>
        </nav>
      </div>
    </footer>
  );
}
