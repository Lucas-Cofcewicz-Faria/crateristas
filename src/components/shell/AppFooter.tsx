import Link from 'next/link';
import styles from './shell.module.css';

export function AppFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div>
          <strong className={styles.footerTitle}>Crateristas</strong>
          <p className={styles.footerNote}>Relatos de mesa, preservados à beira da cratera.</p>
        </div>
        <nav className={styles.footerNav} aria-label="Navegação do rodapé">
          <Link href="/registros">Registros</Link>
          <Link href="/membros">Membros</Link>
        </nav>
      </div>
    </footer>
  );
}
