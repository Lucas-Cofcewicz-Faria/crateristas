import Link from 'next/link';
import { CRATER_HISTORY } from '@/content/crater-history';
import styles from './home.module.css';

export function HistoryPreview() {
  return (
    <section aria-labelledby="history-preview-title" className={styles.historyPreview} id="historia">
      <p className={styles.marginNote}>Arquivo oral · fragmento 01</p>
      <div>
        <h2 id="history-preview-title">{CRATER_HISTORY.title}</h2>
        <p className={styles.historyExcerpt}>{CRATER_HISTORY.excerpt}</p>
        <Link className={styles.textAction} href="/historia">Conheça nossa história</Link>
      </div>
    </section>
  );
}
