'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { ChevronDown, LogOut, UserRound } from 'lucide-react';
import styles from './profile-menu.module.css';

function SignOutButton() {
  const { pending } = useFormStatus();
  return <button className={styles.signOut} type="submit" disabled={pending}>
    <LogOut size={17} aria-hidden="true" />{pending ? 'Saindo...' : 'Sair da plataforma'}
  </button>;
}

export function ProfileMenu({ signOutAction }: { signOutAction: () => Promise<void> }) {
  const pathname = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;
  const root = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpenPath(null);
    };
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, [open]);
  return <div className={styles.root} ref={root} data-profile-open={open}
    onPointerEnter={(event) => { if (event.pointerType !== 'touch') setOpenPath(pathname); }}
    onPointerLeave={() => { if (!root.current?.contains(document.activeElement)) setOpenPath(null); }}
    onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpenPath(null); }}
    onKeyDown={(event) => {
      if (event.key !== 'Escape' || !open) return;
      event.preventDefault(); event.stopPropagation();
      setOpenPath(null); toggle.current?.focus();
    }}>
    <Link className={styles.profile} href="/perfil" aria-current={pathname === '/perfil' ? 'page' : undefined}
      onFocus={() => setOpenPath(pathname)} onClick={() => setOpenPath(null)}>
      <UserRound size={18} aria-hidden="true" />Perfil
    </Link>
    <button ref={toggle} className={styles.toggle} type="button" aria-label="Opções do perfil"
      aria-expanded={open} aria-controls={id} onClick={() => setOpenPath(open ? null : pathname)}>
      <ChevronDown size={16} aria-hidden="true" />
    </button>
    <div className={styles.dropdown} id={id} hidden={!open}>
      <form action={signOutAction}><SignOutButton /></form>
    </div>
  </div>;
}
