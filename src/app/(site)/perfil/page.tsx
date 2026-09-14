import { redirect } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { findOptionalMember } from '@/lib/auth/access';
import { logoutAction } from '@/features/auth/actions';
import { ProfileEditor } from '@/features/members/ProfileEditor';
import styles from '@/features/members/profile.module.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Meu perfil | Crateristas' };

export default async function ProfilePage() {
  const member = await findOptionalMember();
  if (!member) redirect('/entrar');
  return <><div className={styles.page}>
    <header className={styles.heading}><h1>Meu perfil</h1><p>Seu lugar na sociedade, com a sua cara. Foto e descrição aparecem para todos.</p></header>
    <ProfileEditor member={{ displayName: member.displayName, slug: member.slug, bio: member.bio,
      avatarUrl: member.avatarUrl, societyTitle: member.societyTitle }} />
    <section className={styles.account} aria-labelledby="profile-account"><div><h2 id="profile-account">Sua sessão</h2><p className={styles.hint}>Sair não altera seu perfil nem suas avaliações.</p></div>
      <form action={logoutAction}><Button type="submit" variant="secondary"><LogOut size={18} aria-hidden="true" />Sair da plataforma</Button></form>
    </section>
  </div></>;
}
