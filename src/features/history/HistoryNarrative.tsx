import Link from 'next/link';
import { CRATER_HISTORY } from '@/content/crater-history';
import type { PublicMemberSummary } from '@/domain/reviews/repository';
import { MemberGrid } from '@/features/members/MemberGrid';
import { HistoryHashTarget } from './HistoryHashTarget';
import styles from './history.module.css';

export interface HistoryNarrativeProps {
  members: readonly PublicMemberSummary[];
  showPanelLink: boolean;
}

export function HistoryNarrative({ members, showPanelLink }: HistoryNarrativeProps) {
  return (
    <article className={styles.story}>
      <header className={styles.storyHero}>
        <h1>{CRATER_HISTORY.title}</h1>
        <p>{CRATER_HISTORY.excerpt}</p>
      </header>

      <div className={styles.chapters}>
        {CRATER_HISTORY.chapters.map((chapter, index) => (
          <section className={styles.chapter} id={chapter.id} key={chapter.id}>
            <div className={styles.chapterIndex}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <p>{chapter.eyebrow}</p>
            </div>
            <div>
              <h2>{chapter.title}</h2>
              <p>{chapter.body}</p>
            </div>
          </section>
        ))}
      </div>

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
  );
}
