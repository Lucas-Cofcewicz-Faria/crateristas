import { PublicShell } from '@/components/shell/PublicShell';
import { CreateVisitForm } from '@/features/visits/CreateVisitForm';
import styles from '@/features/visits/review-workflow.module.css';
import { requireMember } from '@/lib/auth/access';
import { notFound } from 'next/navigation';
import { findCatalogRestaurant } from '@/features/restaurants/catalog';

export const dynamic = 'force-dynamic';

export default async function NewVisitPage({ searchParams }: { searchParams?: Promise<{ restaurante?: string }> } = {}) {
  await requireMember();
  const selectedSlug = (await searchParams)?.restaurante;
  const restaurant = selectedSlug ? await findCatalogRestaurant(selectedSlug, true) : null;
  if (selectedSlug && !restaurant) notFound();

  return (
    <PublicShell viewer="member">
      <section className={styles.workflowPage}>
        <header className={styles.workflowHeader}>
          <div>
            <h1>Registrar nova visita</h1>
            <p className={styles.lead}>
              {restaurant
                ? 'Registre outra visita a este restaurante, com sua própria data e avaliações.'
                : 'Cadastre um restaurante e registre sua primeira visita, com data e avaliações próprias.'}
            </p>
          </div>
        </header>
        <CreateVisitForm restaurant={restaurant} />
      </section>
    </PublicShell>
  );
}
