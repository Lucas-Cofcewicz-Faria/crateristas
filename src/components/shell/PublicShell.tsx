import type { ReactNode } from 'react';
import { AppFooter } from './AppFooter';
import { AppHeader, type HeaderViewer } from './AppHeader';
import styles from './shell.module.css';

export interface PublicShellProps {
  children: ReactNode;
  viewer: HeaderViewer;
  signOutAction?: () => Promise<void>;
}

export function PublicShell({ children, viewer, signOutAction }: PublicShellProps) {
  return (
    <div className="desktop-frame">
      <a className={styles.skipLink} href="#conteudo-principal">
        Ir para o conteúdo
      </a>
      <AppHeader viewer={viewer} signOutAction={signOutAction} />
      <main className={styles.main} id="conteudo-principal">
        {children}
      </main>
      <AppFooter />
    </div>
  );
}
