import Link from 'next/link';
import { logoutAction } from '@/features/auth/actions';
import styles from './shell.module.css';

export type HeaderViewer = 'visitor' | 'member';

export interface AppHeaderProps {
  viewer: HeaderViewer;
  signOutAction?: () => Promise<void>;
}

export function AppHeader({
  viewer,
  signOutAction = logoutAction,
}: AppHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link className={styles.brand} href="/home" aria-label="Crateristas — início">
          <span className={styles.brandMark} aria-hidden="true">C</span>
          <span>
            <strong className={styles.brandName}>Crateristas</strong>
            <span className={styles.brandKicker}>Livro de registros</span>
          </span>
        </Link>

        <nav className={styles.navigation} aria-label="Navegação principal">
          <Link className={styles.navLink} href="/registros">Registros</Link>
          <Link className={styles.navLink} href="/historia">História</Link>
          {viewer === 'member' ? (
            <>
              <Link className={styles.navLink} href="/painel">Painel</Link>
              <form action={signOutAction}>
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
