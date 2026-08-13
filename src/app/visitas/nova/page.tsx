import { PublicShell } from '@/components/shell/PublicShell';
import { CreateVisitForm } from '@/features/visits/CreateVisitForm';
import styles from '@/features/visits/review-workflow.module.css';
import { requireMember } from '@/lib/auth/access';

export const dynamic = 'force-dynamic';

export default async function NewVisitPage() {
  await requireMember();

  return (
    <PublicShell viewer="member">
      <section className={styles.workflowPage}>
        <header className={styles.workflowHeader}>
          <div>
            <p className={styles.eyebrow}>Nova contribuição</p>
            <h1>Registrar nova visita</h1>
            <p className={styles.lead}>
              Comece pelos dados do restaurante. Todos os campos poderão ser revisados.
            </p>
          </div>
        </header>
        <CreateVisitForm />
      </section>
    </PublicShell>
  );
}
