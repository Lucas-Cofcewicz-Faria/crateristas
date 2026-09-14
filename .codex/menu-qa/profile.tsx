import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../src/app/globals.css';
import './fonts.css';
import { PublicShell } from '@/components/shell/PublicShell';
import { ProfileEditor } from '@/features/members/ProfileEditor';
import { MemberProfile } from '@/features/members/MemberProfile';
import { MemberManager } from '@/features/members/MemberManager';
import { MemberGrid } from '@/features/members/MemberGrid';
import { Button } from '@/components/ui/Button';
import { LogOut } from 'lucide-react';
import styles from '@/features/members/profile.module.css';
const member = { slug: 'ana', displayName: 'Ana de Teste', avatarUrl: null, bio: 'Perfil sintético para conferir o layout. Aqui ficam as histórias de mesas longas, o prato favorito e uma boa dose de devoção à cratera.', societyTitle: 'Guardiã das Mesas Longas', memberNumber: 3, favoriteCuisine: null, contributions: { publishedVisits: 7, scorecards: 7 } };
const view = new URLSearchParams(location.search).get('view');
if (new URLSearchParams(location.search).has('photo')) member.avatarUrl = 'https://demo.public.blob.vercel-storage.com/members/qa-portrait.jpeg';
createRoot(document.getElementById('root')!).render(<PublicShell viewer="member">
  {view === 'cards' ? <div className={styles.page}><MemberGrid members={[member, {...member, slug: 'bia', displayName: 'Outro integrante de teste', societyTitle: null, memberNumber: 2}]} /></div> : view === 'public' ? <MemberProfile member={member} isOwner /> : view === 'admin' ? <div className={styles.page}><MemberManager currentMemberId="admin" members={[{ ...member, id: 'admin', role: 'admin', scorecardCount: 7, removedAt: null }, { ...member, id: 'member', displayName: 'Outro integrante de teste', role: 'member', scorecardCount: 2, removedAt: null }]} /></div> : <div className={styles.page}>
    <header className={styles.heading}><h1>Meu perfil</h1><p>Seu lugar na sociedade, com a sua cara. Foto e descrição aparecem para todos.</p></header>
    <ProfileEditor member={member} /><section className={styles.account}><div><h2>Sua sessão</h2><p className={styles.hint}>Sair não altera seu perfil nem suas avaliações.</p></div><Button variant="secondary"><LogOut size={18} aria-hidden="true" />Sair da plataforma</Button></section>
  </div>}
</PublicShell>);
