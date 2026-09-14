import { MotionScope } from '@/components/motion/MotionScope';
import { publicVisitFiltersSchema } from '@/domain/reviews/schemas';
import { RecordFilters } from '@/features/records/RecordFilters';
import { RecordGrid } from '@/features/records/RecordGrid';
import styles from '@/features/records/records.module.css';
import { getReviewRepository } from '@/lib/reviews/server';
import { findOptionalMember } from '@/lib/auth/access';

type RecordsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RecordsPage({ searchParams }: RecordsPageProps) {
  const filters = publicVisitFiltersSchema.parse(await searchParams);
  const repository = getReviewRepository();
  const member = await findOptionalMember();
  const records = member
    ? await repository.listMemberVisibleVisits(member.id, filters)
    : await repository.listPublicVisits(filters);

  return (
    <>
      <MotionScope className={styles.archive}>
        <header className={styles.archiveHeader}>
          <p className={styles.eyebrow}>{member ? 'Arquivo da sociedade' : 'Arquivo público'}</p>
          <h1 className={styles.archiveTitle} data-motion="inscription">Livro de registros</h1>
          <p className={styles.archiveLead}>
            {member
              ? 'Avaliações salvas pela sociedade. Os estados de visibilidade mostram quais registros já podem ser vistos pelo público.'
              : 'Restaurantes visitados pela sociedade, preservados com a nota coletiva e o número de crateristas que contribuíram para cada relato.'}
          </p>
        </header>
        <RecordFilters filters={filters} />
        <RecordGrid records={records} showPublicationState={Boolean(member)} />
      </MotionScope>
    </>
  );
}
