import styles from './route-loading.module.css';

/** Content-only fallback: the enclosing site layout keeps navigation and session UI. */
export function RouteLoading({ label }: { label: string }) {
  return <section className={styles.loading} role="status" aria-live="polite" aria-busy="true">
    <span className={styles.track} aria-hidden="true" /><p>{label}</p>
  </section>;
}
