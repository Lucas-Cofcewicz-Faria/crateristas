import { PublicShell } from '@/components/shell/PublicShell';
import { publicVisitFiltersSchema } from '@/domain/reviews/schemas';
import { RecordFilters } from '@/features/records/RecordFilters';
import { RecordGrid } from '@/features/records/RecordGrid';
import styles from '@/features/records/records.module.css';
import { findOptionalMember } from '@/lib/auth/access';
import { getReviewRepository } from '@/lib/reviews/server';

type RecordsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RecordsPage({ searchParams }: RecordsPageProps) {
  const filters = publicVisitFiltersSchema.parse(await searchParams);
  const repository = getReviewRepository();
  const [records, member] = await Promise.all([
    repository.listPublicVisits(filters),
    findOptionalMember(),
  ]);

  return (
    <PublicShell viewer={member ? 'member' : 'visitor'}>
      <section className={styles.archive}>
        <header className={styles.archiveHeader}>
          <p className={styles.eyebrow}>Arquivo público</p>
          <h1 className={styles.archiveTitle}>Livro de registros</h1>
          <p className={styles.archiveLead}>
            Restaurantes visitados pela sociedade, preservados com a nota coletiva
            e o número de crateristas que contribuíram para cada relato.
          </p>
        </header>
        <RecordFilters filters={filters} />
        <RecordGrid records={records} />
      </section>
    </PublicShell>
  );
}
