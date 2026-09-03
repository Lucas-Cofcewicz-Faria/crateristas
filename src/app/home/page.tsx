import Link from 'next/link';
import { MotionScope } from '@/components/motion/MotionScope';
import { PublicShell } from '@/components/shell/PublicShell';
import { DepthIndicator, type DepthSection } from '@/features/home/DepthIndicator';
import { HistoryPreview } from '@/features/home/HistoryPreview';
import { LandingHero } from '@/features/home/LandingHero';
import { MembersPreview } from '@/features/home/MembersPreview';
import { RecentRestaurantsCarousel } from '@/features/home/RecentRestaurantsCarousel';
import { selectRecentRestaurants } from '@/features/home/select-recent-restaurants';
import styles from '@/features/home/home.module.css';
import { findOptionalMember } from '@/lib/auth/access';
import { getReviewRepository } from '@/lib/reviews/server';

export const dynamic = 'force-dynamic';

const DEPTH_SECTIONS: readonly DepthSection[] = [
  { id: 'entrada', label: 'Entrada' },
  { id: 'restaurantes', label: 'Registros' },
  { id: 'historia', label: 'História' },
  { id: 'sociedade', label: 'Sociedade' },
];

export default async function HomePage() {
  const repository = getReviewRepository();
  const [records, members, viewer] = await Promise.all([
    repository.listPublicVisits({}),
    repository.listPublicMembers(),
    findOptionalMember(),
  ]);
  const recentRestaurants = selectRecentRestaurants(records);

  return (
    <PublicShell viewer={viewer ? 'member' : 'visitor'}>
      <MotionScope className={styles.landing}>
        <DepthIndicator sections={DEPTH_SECTIONS} />
        <LandingHero />
        <section aria-labelledby="recent-title" className={styles.landingSection} id="restaurantes">
          <header className={styles.sectionHeader}>
            <h2 data-motion="inscription" id="recent-title">Restaurantes mais recentes</h2>
            <Link className={styles.textAction} href="/registros">Ver todos os registros</Link>
          </header>
          <RecentRestaurantsCarousel records={recentRestaurants} />
        </section>
        <HistoryPreview />
        <MembersPreview members={members} />
        <section aria-labelledby="closing-title" className={styles.closingCallout}>
          <h2 data-motion="inscription" id="closing-title">
            A próxima mesa ainda não foi registrada.
          </h2>
          <div>
            <Link className={styles.primaryAction} href="/registros">Explorar o arquivo</Link>
            <Link className={styles.textAction} href={viewer ? '/painel' : '/entrar'}>
              {viewer ? 'Abrir seu painel' : 'Entrar como integrante'}
            </Link>
          </div>
        </section>
      </MotionScope>
    </PublicShell>
  );
}
