import { BrandHomeLink } from './BrandHomeLink';
import { EntryLink } from './EntryLink';
import { CraterLogo } from '@/components/brand/CraterLogo';
import { logoutAction } from '@/features/auth/actions';
import { HeaderMotion } from './HeaderMotion';
import { HeaderLinks } from './HeaderLinks';
import { HeaderNavigation } from './HeaderNavigation';
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
        <BrandHomeLink className={styles.brand}>
          <CraterLogo className={styles.brandMark} />
          <span>
            <strong className={styles.brandName}>Crateristas</strong>
            <span className={styles.brandKicker}>Livro de registros</span>
          </span>
        </BrandHomeLink>

        <HeaderNavigation>
          <HeaderLinks member={viewer === 'member'} />
          {viewer === 'member' ? (
            <>
              <form action={signOutAction}>
                <button className={styles.signOut} type="submit">Sair</button>
              </form>
            </>
          ) : (
            <EntryLink />
          )}
        </HeaderNavigation>
      </div>
    </HeaderMotion>
  );
}
