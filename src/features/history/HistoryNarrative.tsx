import Link from 'next/link';
import { MotionScope } from '@/components/motion/MotionScope';
import { CRATER_HISTORY } from '@/content/crater-history';
import type { PublicMemberSummary } from '@/domain/reviews/repository';
import { MemberGrid } from '@/features/members/MemberGrid';
import { HistoryHashTarget } from './HistoryHashTarget';
import { HistoryChapters } from './HistoryChapters';
import styles from './history.module.css';

export interface HistoryNarrativeProps {
  members: readonly PublicMemberSummary[];
  showPanelLink: boolean;
}

export function HistoryNarrative({ members, showPanelLink }: HistoryNarrativeProps) {
  return (
    <MotionScope>
      <article className={styles.story}>
        <header className={styles.storyHero}>
          <h1 data-motion="inscription">{CRATER_HISTORY.title}</h1>
          <p data-motion="excavation">{CRATER_HISTORY.excerpt}</p>
          <nav aria-label="Capítulos da história" className={styles.chapterNavigation}>
            {CRATER_HISTORY.chapters.map((chapter) => (
              <Link href={`#${chapter.id}`} key={chapter.id}>{chapter.title}</Link>
            ))}
          </nav>
        </header>

        <HistoryChapters />

        <HistoryHashTarget />
        <section aria-labelledby="members-title" className={styles.members} id="integrantes">
          <header className={styles.membersHeader}>
            <h2 id="members-title">Os oito Crateristas</h2>
            {showPanelLink ? <Link href="/painel">Suas avaliações pendentes</Link> : null}
          </header>
          <MemberGrid members={[...members]} />
        </section>

        <footer className={styles.storyFooter}>
          <h2>Consulte os registros preservados pela Sociedade.</h2>
          <Link href="/registros">Explorar restaurantes</Link>
        </footer>
      </article>
    </MotionScope>
  );
}
