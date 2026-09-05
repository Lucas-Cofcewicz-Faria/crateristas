import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { CraterLogo } from '@/components/brand/CraterLogo';
import { logoutAction } from '@/features/auth/actions';
import { HeaderMotion } from './HeaderMotion';
import { HeaderLinks } from './HeaderLinks';
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
    <HeaderMotion>
      <div className={styles.headerInner}>
        <Link className={styles.brand} href="/home" aria-label="Crateristas — início">
          <CraterLogo className={styles.brandMark} />
          <span>
            <strong className={styles.brandName}>Crateristas</strong>
            <span className={styles.brandKicker}>Livro de registros</span>
          </span>
        </Link>

        <nav className={styles.navigation} aria-label="Navegação principal">
          <HeaderLinks member={viewer === 'member'} />
          {viewer === 'member' ? (
            <>
              <form action={signOutAction}>
                <button className={styles.signOut} type="submit">Sair</button>
              </form>
            </>
          ) : (
            <Link className={styles.signIn} href="/entrar">
              <span>Entrar</span><ArrowUpRight aria-hidden="true" size={18} />
            </Link>
          )}
        </nav>
      </div>
    </HeaderMotion>
  );
}
