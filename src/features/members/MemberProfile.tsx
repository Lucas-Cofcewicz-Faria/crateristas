import Link from 'next/link';
import { ArrowLeft, Pencil } from 'lucide-react';
import type { PublicMemberSummary } from '@/domain/reviews/repository';
import { CraterLogo } from '@/components/brand/CraterLogo';
import { SocietyFragment } from '@/components/society/SocietyFragment';
import { getSocietyFragmentForMember } from '@/content/society';
import { MemberPortrait } from './MemberPortrait';
import { ProfileAtmosphere } from './ProfileAtmosphere';
import styles from './profile.module.css';

export function MemberProfile({ member, isOwner = false }: { member: PublicMemberSummary; isOwner?: boolean }) {
  const fragment = getSocietyFragmentForMember(member.memberNumber);
  const count = member.contributions.publishedVisits;
  return <ProfileAtmosphere key={`${member.slug}:${member.avatarUrl ?? ''}`}><article className={styles.page}>
    <nav className={styles.pageNav} aria-label="Navegação do perfil">
      <Link className={styles.textLink} href="/historia#integrantes"><ArrowLeft size={18} aria-hidden="true" />Todos os crateristas</Link>
      {isOwner ? <Link className={styles.textLink} href="/perfil"><Pencil size={17} aria-hidden="true" />Editar meu perfil</Link> : null}
    </nav>
    <div className={styles.publicProfile}>
      <div className={styles.portrait}><MemberPortrait avatarUrl={member.avatarUrl} displayName={member.displayName} paletteSource /></div>
      <div className={styles.publicIdentity}>
        <h1>{member.displayName}</h1>
        <p className={styles.officialTitle}><CraterLogo />{member.societyTitle || 'Integrante'}</p>
        <p className={styles.memberNumber}>Craterista nº {String(member.memberNumber).padStart(2, '0')}</p>
        {member.bio.trim() ? <p className={styles.biography}>{member.bio}</p> : null}
        <p className={styles.contribution}>{count} {count === 1 ? 'visita com contribuição pública' : 'visitas com contribuições públicas'}</p>
        {member.favoriteCuisine ? <p className={styles.hint}>Culinária favorita: {member.favoriteCuisine}</p> : null}
        {fragment ? <div className={styles.fragment}><SocietyFragment fragment={fragment} label={`Revelar fragmento de ${member.displayName}`} /></div> : null}
      </div>
    </div>
  </article></ProfileAtmosphere>;
}
