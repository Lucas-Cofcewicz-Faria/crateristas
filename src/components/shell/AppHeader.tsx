import Link from 'next/link';
import styles from './shell.module.css';

export type HeaderViewer = 'visitor' | 'member';

export interface AppHeaderProps {
  viewer: HeaderViewer;
  signOutPath?: string;
}

export function AppHeader({
  viewer,
  signOutPath = '/api/auth/sign-out',
}: AppHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link className={styles.brand} href="/" aria-label="Crateristas — início">
          <span className={styles.brandMark} aria-hidden="true">C</span>
          <span>
            <strong className={styles.brandName}>Crateristas</strong>
            <span className={styles.brandKicker}>Livro de registros</span>
          </span>
        </Link>

        <nav className={styles.navigation} aria-label="Navegação principal">
          <Link className={styles.navLink} href="/registros">Registros</Link>
          <Link className={styles.navLink} href="/membros">Membros</Link>
          {viewer === 'member' ? (
            <>
              <Link className={styles.navLink} href="/painel">Painel</Link>
              <form action={signOutPath} method="post">
                <button className={styles.signOut} type="submit">Sair</button>
              </form>
            </>
          ) : (
            <Link className={styles.signIn} href="/entrar">Entrar</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
