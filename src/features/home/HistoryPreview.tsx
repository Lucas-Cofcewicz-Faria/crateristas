import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { CRATER_HISTORY } from '@/content/crater-history';
import styles from './home.module.css';

export function HistoryPreview() {
  return (
    <section
      aria-labelledby="history-preview-title"
      className={styles.historyPreview}
      data-motion="excavation"
      id="historia"
    >
      <p className={styles.marginNote}>Arquivo oral · fragmento 01</p>
      <div>
        <h2 data-motion="inscription" id="history-preview-title">{CRATER_HISTORY.title}</h2>
        <p className={styles.historyExcerpt}>{CRATER_HISTORY.excerpt}</p>
        <Link className={styles.historyAction} href="/historia">
          <span>Conheça nossa história</span><ArrowUpRight aria-hidden="true" size={24} />
        </Link>
      </div>
    </section>
  );
}
