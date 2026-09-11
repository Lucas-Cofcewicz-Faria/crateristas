import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import styles from './shell.module.css';

export function EntryLink({ href = '/entrar', children = 'Entrar' }: { href?: string; children?: string }) {
  return <Link className={styles.signIn} href={href}>
    <span>{children}</span><ArrowUpRight aria-hidden="true" size={18} />
  </Link>;
}
