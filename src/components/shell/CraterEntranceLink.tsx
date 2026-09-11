'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './shell.module.css';

/** An opt-in experience, kept after the footer content and off the primary navigation. */
export function CraterEntranceLink() {
  const pathname = usePathname();
  if (pathname !== '/home') return null;
  return <div className={styles.craterEntrance}>
    <Link href="/?explorar=1" prefetch={false}>Visitar a cratera em 3D</Link>
  </div>;
}
